import { useState } from 'react';
import { Application } from '@/types/application';
import { parseJobAlert, ParsedJob } from '@/lib/emailParser';
import { parseHtmlEmailContent, htmlToCleanText } from '@/lib/htmlEmailParser';
import { parseTextJobOffer } from '@/lib/textJobParser';
import { parsePDFFile } from '@/lib/pdfParser';
import { extractJobContent } from '@/lib/emailCleaner';
import { analyzeJobText, checkDuplicate, cleanTitle, extractCompany, extractLocationFromLine, SmartAnalysisResult } from '@/lib/smartTextAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { evaluateExclusionRules, shouldExcludeOffer, getExclusionReason, ExclusionFlags } from '@/lib/exclusionRules';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RichTextPaste } from '@/components/ui/RichTextPaste';
import { 
  FileText, Mail, Link as LinkIcon, Sparkles, AlertTriangle, 
  CheckCircle, XCircle, Loader2, MapPin, Languages, GraduationCap,
  Building, Briefcase, Plus, AlertOctagon
} from 'lucide-react';
import { toast } from 'sonner';

interface SmartImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (jobs: Partial<Application>[]) => Promise<string[]>;
  existingApplications?: { poste: string; entreprise: string }[];
}

interface ExtendedParsedJob extends ParsedJob {
  url?: string;
  description?: string;
}

interface AnalysisResult {
  job: ExtendedParsedJob;
  aiAnalysis: {
    compatibility: number;
    matchingSkills: string[];
    missingRequirements: string[];
    keywords: string;
    recommendedChannel: string;
    requiredDocuments: string[];
    deadline: string;
    contacts: { nom?: string; email?: string; telephone?: string }[];
    excluded: boolean;
    exclusionReason: string | null;
    reasoning: string;
    warning?: string;
  } | null;
  smartAnalysis: SmartAnalysisResult | null;
  exclusionFlags: ExclusionFlags;
  isExcluded: boolean;
  exclusionReason: string;
  isAnalyzing: boolean;
  extractionFailed?: boolean;
  isDuplicate?: boolean;
}

type ImportStep = 'input' | 'analysis' | 'review';

export function SmartImportModal({ open, onClose, onImport, existingApplications = [] }: SmartImportModalProps) {
  const [step, setStep] = useState<ImportStep>('input');
  const [activeTab, setActiveTab] = useState('text');
  
  // Input states
  const [textContent, setTextContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState(''); // NEW: Manual source URL
  const [emailContent, setEmailContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // Spontaneous form
  const [spontaneousForm, setSpontaneousForm] = useState({
    entreprise: '',
    poste: '',
    lieu: '',
    notes: ''
  });
  
  // Analysis state
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetState = () => {
    setStep('input');
    setTextContent('');
    setLinkUrl('');
    setSourceUrl('');
    setEmailContent('');
    setPdfFile(null);
    setSpontaneousForm({ entreprise: '', poste: '', lieu: '', notes: '' });
    setAnalysisResults([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Parse and start analysis with smart text analysis
  const handleAnalyze = async (jobs: ExtendedParsedJob[], rawText?: string) => {
    if (jobs.length === 0) {
      toast.error('Aucune offre détectée');
      return;
    }

    setStep('analysis');
    setIsAnalyzing(true);
    
    // Run smart text analysis on raw content
    const smartAnalysisData = rawText ? analyzeJobText(rawText) : null;
    
    // Initialize results with exclusion check and duplicate detection
    const initialResults: AnalysisResult[] = jobs.map(job => {
      const flags = evaluateExclusionRules(job.poste, job.lieu, job.motsCles);
      const isExcluded = shouldExcludeOffer(flags);
      const isDuplicate = checkDuplicate(job.poste, job.entreprise, existingApplications);
      
      return {
        job,
        aiAnalysis: null,
        smartAnalysis: smartAnalysisData,
        exclusionFlags: flags,
        isExcluded,
        exclusionReason: isExcluded ? getExclusionReason(flags) : '',
        isAnalyzing: !isExcluded && !isDuplicate,
        isDuplicate
      };
    });
    
    setAnalysisResults(initialResults);

    // Show duplicate warnings
    const duplicates = initialResults.filter(r => r.isDuplicate);
    if (duplicates.length > 0) {
      toast.warning(`⚠️ ${duplicates.length} doublon(s) détecté(s)`, { duration: 5000 });
    }

    // Run AI analysis for non-excluded, non-duplicate jobs
    const userProfile = `Profil professionnel avec expérience en gestion de projet, coordination d'équipes et événementiel. Basée en Suisse romande (Genève/Vaud). Bachelor en Hospitality Management de l'EHL. Compétences: leadership, communication, organisation, gestion de crise.`;
    
    for (let i = 0; i < initialResults.length; i++) {
      const result = initialResults[i];
      if (result.isExcluded || result.isDuplicate) continue;
      
      try {
        const jobDescription = `
          Poste: ${result.job.poste}
          Entreprise: ${result.job.entreprise}
          Lieu: ${result.job.lieu}
          Compétences: ${result.job.motsCles || ''}
          Description: ${result.job.description || ''}
        `;
        
        const { data, error } = await supabase.functions.invoke('analyze-job-offer', {
          body: { jobDescription, userProfile }
        });
        
        if (error) throw error;
        
        setAnalysisResults(prev => prev.map((r, idx) => 
          idx === i ? {
            ...r,
            aiAnalysis: {
              compatibility: data.compatibility || 50,
              matchingSkills: data.matching_skills || [],
              missingRequirements: data.missing_requirements || [],
              keywords: data.keywords || '',
              recommendedChannel: data.recommended_channel || '',
              requiredDocuments: data.required_documents || smartAnalysisData?.requiredDocuments || ['CV'],
              deadline: data.deadline || smartAnalysisData?.deadline || '',
              contacts: data.contacts || [],
              excluded: data.excluded || false,
              exclusionReason: data.exclusion_reason,
              reasoning: data.reasoning || '',
              warning: data.warning
            },
            isExcluded: data.excluded || r.isExcluded,
            exclusionReason: data.exclusion_reason || r.exclusionReason,
            isAnalyzing: false,
            extractionFailed: data.warning === 'extraction_failed'
          } : r
        ));
        
        if (data.warning) {
          toast.warning('⚠️ Analyse partielle. Vérifiez les informations.', { duration: 4000 });
        }
      } catch (error) {
        console.error('Analysis error:', error);
        setAnalysisResults(prev => prev.map((r, idx) => 
          idx === i ? { 
            ...r, 
            isAnalyzing: false,
            aiAnalysis: {
              compatibility: 50,
              matchingSkills: [],
              missingRequirements: [],
              keywords: '',
              recommendedChannel: 'direct',
              requiredDocuments: smartAnalysisData?.requiredDocuments || ['CV', 'Lettre de motivation'],
              deadline: smartAnalysisData?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              contacts: [],
              excluded: false,
              exclusionReason: null,
              reasoning: '⚠️ Analyse IA indisponible. Complétez manuellement.',
              warning: 'analysis_error'
            },
            extractionFailed: true
          } : r
        ));
        toast.warning('Analyse IA indisponible. Import manuel possible.', { duration: 4000 });
      }
    }
    
    setIsAnalyzing(false);
    setStep('review');
  };

  // Handle text/link submission
  const handleSubmitText = () => {
    const content = textContent || linkUrl;
    if (!content) {
      toast.error('Veuillez entrer du contenu');
      return;
    }
    
    const job = parseTextJobOffer(content);
    
    // Smart cleaning: extract company and location from "Company · Location" format
    let finalJob = job;
    if (job) {
      const cleanedTitle = cleanTitle(job.poste);
      const detectedCompany = extractCompany(content);
      const detectedLocation = extractLocationFromLine(content);
      
      finalJob = {
        ...job,
        poste: cleanedTitle || '',
        entreprise: detectedCompany || job.entreprise || '',
        lieu: detectedLocation || job.lieu || 'Suisse',
        url: sourceUrl || linkUrl || undefined
      };
    }
    
    if (finalJob) {
      handleAnalyze([finalJob], content);
    } else {
      // Fallback: try to detect company and location from raw text
      const detectedCompany = extractCompany(content);
      const detectedLocation = extractLocationFromLine(content);
      
      handleAnalyze([{
        entreprise: detectedCompany || '',
        poste: '',
        lieu: detectedLocation || 'Suisse',
        canal: 'direct',
        source: 'Texte',
        motsCles: content.substring(0, 200),
        description: content,
        url: sourceUrl || linkUrl || undefined
      }], content);
    }
  };

  // Handle email submission with HTML parsing
  const handleSubmitEmail = () => {
    if (!emailContent) {
      toast.error('Veuillez coller le contenu de l\'email');
      return;
    }
    
    const isHtmlContent = /<[a-z][\s\S]*>/i.test(emailContent);
    let jobs: (ParsedJob & { url?: string })[] = [];
    
    if (isHtmlContent) {
      console.log('Parsing HTML email content...');
      jobs = parseHtmlEmailContent(emailContent);
      
      if (jobs.length > 0) {
        const linksCount = jobs.filter(j => j.url).length;
        toast.success(`${jobs.length} offre(s) détectée(s) dont ${linksCount} avec lien`);
      }
    }
    
    // Fallback to text parsing
    if (jobs.length === 0) {
      const cleanedContent = isHtmlContent ? htmlToCleanText(emailContent) : extractJobContent(emailContent);
      jobs = parseJobAlert(cleanedContent);
    }
    
    // Apply manual source URL to all jobs if provided
    if (sourceUrl) {
      jobs = jobs.map(job => ({ ...job, url: job.url || sourceUrl }));
    }
    
    if (jobs.length > 0) {
      handleAnalyze(jobs, emailContent);
    } else {
      const cleanedContent = isHtmlContent ? htmlToCleanText(emailContent) : emailContent;
      const job = parseTextJobOffer(cleanedContent);
      if (job) {
        handleAnalyze([{ ...job, url: sourceUrl || undefined }], cleanedContent);
      } else {
        toast.error('Aucune offre détectée. Essayez de coller le texte brut.');
      }
    }
  };

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }
    
    setPdfFile(file);
    toast.loading('Analyse du PDF...', { id: 'pdf-parse' });
    
    try {
      const job = await parsePDFFile(file);
      toast.dismiss('pdf-parse');
      
      if (job) {
        handleAnalyze([{ ...job, url: sourceUrl || undefined }]);
      } else {
        toast.warning('⚠️ PDF complexe non lu. Mode manuel activé.', { duration: 5000 });
        handleAnalyzeWithFallback([{
          entreprise: 'À compléter',
          poste: file.name.replace('.pdf', '').substring(0, 50),
          lieu: 'Suisse',
          canal: 'PDF',
          source: 'PDF (extraction manuelle)',
          motsCles: '',
          description: '⚠️ Le texte du PDF n\'a pas pu être extrait. Veuillez copier-coller la description du poste.',
          url: sourceUrl || undefined
        }], true);
      }
    } catch (error) {
      toast.dismiss('pdf-parse');
      console.error('PDF parsing error:', error);
      toast.warning('⚠️ Erreur PDF. Mode manuel activé.', { duration: 5000 });
      handleAnalyzeWithFallback([{
        entreprise: 'À compléter',
        poste: file?.name?.replace('.pdf', '').substring(0, 50) || 'Poste à définir',
        lieu: 'Suisse',
        canal: 'PDF',
        source: 'PDF (extraction manuelle)',
        motsCles: '',
        description: '⚠️ Le texte du PDF n\'a pas pu être extrait.',
        url: sourceUrl || undefined
      }], true);
    }
  };

  // Fallback analysis mode
  const handleAnalyzeWithFallback = async (jobs: ExtendedParsedJob[], extractionFailed: boolean) => {
    if (jobs.length === 0) {
      toast.error('Aucune offre détectée');
      return;
    }

    const today = new Date();
    const defaultDeadline = new Date(today);
    defaultDeadline.setDate(today.getDate() + 7);

    const fallbackResults: AnalysisResult[] = jobs.map(job => {
      const flags = evaluateExclusionRules(job.poste, job.lieu, job.motsCles);
      const isDuplicate = checkDuplicate(job.poste, job.entreprise, existingApplications);
      
      return {
        job,
        aiAnalysis: {
          compatibility: 50,
          matchingSkills: [],
          missingRequirements: [],
          keywords: '',
          recommendedChannel: 'direct',
          requiredDocuments: ['CV', 'Lettre de motivation'],
          deadline: defaultDeadline.toISOString().split('T')[0],
          contacts: [],
          excluded: false,
          exclusionReason: null,
          reasoning: extractionFailed 
            ? '⚠️ Extraction PDF impossible. Complétez manuellement.' 
            : 'Analyse de base.',
          warning: extractionFailed ? 'extraction_failed' : undefined
        },
        smartAnalysis: null,
        exclusionFlags: flags,
        isExcluded: false,
        exclusionReason: '',
        isAnalyzing: false,
        extractionFailed,
        isDuplicate
      };
    });

    setAnalysisResults(fallbackResults);
    setStep('review');
    
    if (extractionFailed) {
      toast.info('📝 Importez l\'offre puis éditez-la pour ajouter les détails.', { duration: 6000 });
    }
  };

  // Handle spontaneous submission
  const handleSubmitSpontaneous = () => {
    if (!spontaneousForm.entreprise || !spontaneousForm.poste) {
      toast.error('Veuillez remplir au moins l\'entreprise et le poste');
      return;
    }
    
    // Check for duplicates
    if (checkDuplicate(spontaneousForm.poste, spontaneousForm.entreprise, existingApplications)) {
      toast.error('⚠️ Doublon détecté ! Cette candidature existe déjà.');
      return;
    }
    
    handleAnalyze([{
      entreprise: spontaneousForm.entreprise,
      poste: spontaneousForm.poste,
      lieu: spontaneousForm.lieu || 'Suisse',
      canal: 'spontanée',
      source: 'Spontanée',
      motsCles: spontaneousForm.notes,
      description: spontaneousForm.notes,
      url: sourceUrl || undefined
    }], spontaneousForm.notes);
  };

  // Validate and import
  const handleValidateAndImport = async (index: number, forceDuplicate = false) => {
    const result = analysisResults[index];
    
    // Confirm duplicate import
    if (result.isDuplicate && !forceDuplicate) {
      toast.error('⚠️ Doublon détecté ! Cliquez à nouveau pour forcer l\'import.', { duration: 3000 });
      setAnalysisResults(prev => prev.map((r, i) => 
        i === index ? { ...r, isDuplicate: false } : r
      ));
      return;
    }
    
    const today = new Date();
    const defaultDeadline = new Date(today);
    defaultDeadline.setDate(today.getDate() + 14);
    
    const isOCE = (result.job as any).isOCE || 
                  result.job.canal === 'OCE' || 
                  /(?:OCE|ORP|Office cantonal)/i.test(result.job.source || '');
    
    let priority = 2;
    if (isOCE) {
      priority = 1;
    } else if (result.aiAnalysis?.compatibility && result.aiAnalysis.compatibility >= 80) {
      priority = 3;
    }
    
    let notes = result.aiAnalysis?.reasoning || '';
    if (isOCE) {
      notes = `⚠️ OFFRE OCE - Preuve de candidature requise pour validation ORP\n\n${notes}`;
    }
    
    // Merge smart analysis data
    const smartData = result.smartAnalysis;
    
    // Clean title: if it's a URL, leave empty for user to complete
    const cleanedPoste = cleanTitle(result.job.poste);
    const hasValidTitle = cleanedPoste && cleanedPoste.trim() !== '';
    const hasValidCompany = result.job.entreprise && result.job.entreprise.trim() !== '';
    
    const applicationToImport: Partial<Application> = {
      entreprise: hasValidCompany ? result.job.entreprise : '',
      poste: hasValidTitle ? cleanedPoste : '',
      lieu: result.job.lieu,
      deadline: result.aiAnalysis?.deadline || smartData?.deadline || defaultDeadline.toISOString().split('T')[0],
      statut: 'à compléter',
      priorite: priority,
      keywords: result.aiAnalysis?.keywords || result.job.motsCles,
      notes,
      url: result.job.url,
      sourceUrl: sourceUrl || result.job.url,
      compatibility: result.aiAnalysis?.compatibility,
      matchingSkills: result.aiAnalysis?.matchingSkills,
      missingRequirements: result.aiAnalysis?.missingRequirements,
      recommended_channel: isOCE ? 'OCE' : result.aiAnalysis?.recommendedChannel,
      requiredDocuments: result.aiAnalysis?.requiredDocuments || smartData?.requiredDocuments || (isOCE ? ['CV', 'Lettre de motivation', 'Preuve de candidature'] : undefined),
      applicationEmail: result.aiAnalysis?.contacts?.[0]?.email || smartData?.applicationEmail,
      // NEW FIELDS from smart analysis
      applicationMethod: smartData?.applicationMethod,
      contactPerson: smartData?.contactPerson || result.aiAnalysis?.contacts?.[0]?.nom,
      language: smartData?.language,
      isExpired: smartData?.isExpired,
      deadlineMissing: smartData?.deadlineMissing && !result.aiAnalysis?.deadline,
    };
    
    try {
      await onImport([applicationToImport]);
      toast.success(`✅ "${result.job.poste}" importée ${isOCE ? '(OCE - URGENT)' : ''} !`);
      
      setAnalysisResults(prev => prev.filter((_, i) => i !== index));
      
      if (analysisResults.length <= 1) {
        handleClose();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'import');
    }
  };

  // Reject result
  const handleReject = (index: number) => {
    const result = analysisResults[index];
    toast.info(`❌ "${result.job.poste}" rejetée`);
    setAnalysisResults(prev => prev.filter((_, i) => i !== index));
    
    if (analysisResults.length <= 1) {
      handleClose();
    }
  };

  // Render exclusion badge
  const renderExclusionBadge = (flags: ExclusionFlags, aiExcluded?: boolean, aiReason?: string | null) => {
    const badges = [];
    
    if (flags.isStage) {
      badges.push(
        <Badge key="stage" variant="destructive" className="gap-1">
          <GraduationCap className="w-3 h-3" /> Stage/Non rémunéré
        </Badge>
      );
    }
    if (flags.isOutsideGEVD) {
      badges.push(
        <Badge key="geo" variant="destructive" className="gap-1">
          <MapPin className="w-3 h-3" /> Hors zone GE-VD
        </Badge>
      );
    }
    if (flags.requiresGerman) {
      badges.push(
        <Badge key="german" variant="destructive" className="gap-1">
          <Languages className="w-3 h-3" /> Allemand requis
        </Badge>
      );
    }
    if (aiExcluded && aiReason) {
      badges.push(
        <Badge key="ai" variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" /> {aiReason}
        </Badge>
      );
    }
    
    return badges.length > 0 ? <div className="flex flex-wrap gap-2">{badges}</div> : null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {step === 'input' && '📥 Importer une nouvelle offre'}
            {step === 'analysis' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse IA en cours...
              </>
            )}
            {step === 'review' && '🔍 Résultat d\'analyse'}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Input */}
        {step === 'input' && (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* NEW: Global Source URL Field */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                🔗 Lien de l'annonce (prioritaire)
              </label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://linkedin.com/jobs/view/... ou autre URL"
                className="bg-white"
              />
              <p className="text-xs text-blue-600 mt-1">
                Ce lien sera sauvegardé même si aucun lien n'est extrait du contenu.
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text" className="gap-2 text-xs sm:text-sm">
                  <LinkIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Texte/Lien</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2 text-xs sm:text-sm">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="gap-2 text-xs sm:text-sm">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </TabsTrigger>
                <TabsTrigger value="spontaneous" className="gap-2 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Spontanée</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    🔗 Lien de l'annonce (LinkedIn, JobUp, CAGI...)
                  </label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://linkedin.com/jobs/view/..."
                    className="mb-4"
                  />
                  
                  <label className="block text-sm font-medium mb-2">
                    📝 Ou collez le texte de l'annonce
                  </label>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Collez ici la description complète du poste..."
                    className="min-h-[200px]"
                  />
                </div>
                <Button 
                  onClick={handleSubmitText}
                  disabled={!textContent && !linkUrl}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyser avec l'IA
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    📧 Collez le contenu de l'email d'alerte emploi
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    💡 Les liens (Postuler, Voir l'offre...) seront automatiquement extraits
                  </p>
                  <RichTextPaste
                    value={emailContent}
                    onChange={setEmailContent}
                    placeholder="Collez l'email complet avec ses liens (LinkedIn, JobUp, Indeed...)"
                  />
                </div>
                <Button 
                  onClick={handleSubmitEmail}
                  disabled={!emailContent}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyser les offres ({emailContent ? 'HTML' : '...'})
                </Button>
              </TabsContent>

              <TabsContent value="pdf" className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <label className="block text-sm font-medium mb-4">
                    📄 Importez un PDF d'annonce
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90 mx-auto max-w-xs"
                  />
                  {pdfFile && (
                    <p className="text-sm text-muted-foreground mt-4">
                      📄 {pdfFile.name}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="spontaneous" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      🏢 Entreprise *
                    </label>
                    <Input
                      value={spontaneousForm.entreprise}
                      onChange={(e) => setSpontaneousForm(prev => ({ ...prev, entreprise: e.target.value }))}
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      💼 Poste visé *
                    </label>
                    <Input
                      value={spontaneousForm.poste}
                      onChange={(e) => setSpontaneousForm(prev => ({ ...prev, poste: e.target.value }))}
                      placeholder="Ex: Chef de projet événementiel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      📍 Lieu
                    </label>
                    <Input
                      value={spontaneousForm.lieu}
                      onChange={(e) => setSpontaneousForm(prev => ({ ...prev, lieu: e.target.value }))}
                      placeholder="Ex: Genève"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      📝 Notes / Motivation
                    </label>
                    <Textarea
                      value={spontaneousForm.notes}
                      onChange={(e) => setSpontaneousForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Pourquoi cette entreprise vous intéresse..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSubmitSpontaneous}
                  disabled={!spontaneousForm.entreprise || !spontaneousForm.poste}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Créer la candidature
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* STEP 2: Analysis in progress */}
        {step === 'analysis' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
            <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
            <h3 className="text-xl font-semibold mb-2">Analyse IA en cours</h3>
            <p className="text-muted-foreground text-center max-w-md">
              L'intelligence artificielle analyse la compatibilité avec votre profil et détecte les critères d'exclusion...
            </p>
            <Progress value={45} className="w-64 mt-6" />
          </div>
        )}

        {/* STEP 3: Review results */}
        {step === 'review' && (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {analysisResults.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-semibold mb-2">Toutes les offres traitées !</h3>
                  <Button onClick={handleClose} className="mt-4">
                    Fermer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {analysisResults.map((result, index) => (
                    <Card key={index} className={`p-5 ${
                      result.isDuplicate 
                        ? 'border-yellow-500/50 bg-yellow-50' 
                        : result.isExcluded 
                          ? 'border-destructive/50 bg-destructive/5' 
                          : result.extractionFailed 
                            ? 'border-orange-500/50 bg-orange-50' 
                            : 'border-primary/30'
                    }`}>
                      {/* Duplicate warning banner */}
                      {result.isDuplicate && (
                        <div className="mb-3 p-2 bg-yellow-100 rounded-lg border border-yellow-300">
                          <p className="font-medium text-yellow-800 flex items-center gap-2 text-sm">
                            <AlertOctagon className="w-4 h-4" />
                            ⚠️ DOUBLON DÉTECTÉ - Cette offre existe déjà !
                          </p>
                        </div>
                      )}
                      
                      {/* Extraction warning banner */}
                      {result.extractionFailed && !result.isDuplicate && (
                        <div className="mb-3 p-2 bg-orange-100 rounded-lg border border-orange-300">
                          <p className="font-medium text-orange-800 flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            PDF complexe - Complétez manuellement après import
                          </p>
                        </div>
                      )}
                      
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold flex items-center gap-2 truncate">
                            <Briefcase className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">{result.job.poste}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{result.job.entreprise} • {result.job.lieu}</span>
                          </p>
                        </div>
                        
                        {result.isAnalyzing ? (
                          <Badge variant="secondary" className="gap-1 shrink-0 ml-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyse...
                          </Badge>
                        ) : result.isDuplicate ? (
                          <Badge variant="outline" className="gap-1 shrink-0 ml-2 border-yellow-500 text-yellow-700">
                            <AlertOctagon className="w-3 h-3" /> Doublon
                          </Badge>
                        ) : result.extractionFailed ? (
                          <Badge variant="outline" className="gap-1 shrink-0 ml-2 border-orange-500 text-orange-700">
                            <AlertTriangle className="w-3 h-3" /> Manuel
                          </Badge>
                        ) : result.isExcluded ? (
                          <Badge variant="destructive" className="gap-1 shrink-0 ml-2">
                            <XCircle className="w-3 h-3" /> Exclue
                          </Badge>
                        ) : (
                          <Badge
                            variant={result.aiAnalysis?.compatibility && result.aiAnalysis.compatibility >= 70 ? "default" : "secondary"}
                            className="gap-1 text-sm px-2 shrink-0 ml-2"
                          >
                            {result.aiAnalysis?.compatibility || 0}%
                          </Badge>
                        )}
                      </div>

                      {/* Smart Analysis Badges */}
                      {result.smartAnalysis && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {result.smartAnalysis.requiredDocuments.map((doc, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              📄 {doc}
                            </Badge>
                          ))}
                          {result.smartAnalysis.language && (
                            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                              {result.smartAnalysis.language === 'Français' ? '🇫🇷' : result.smartAnalysis.language === 'Anglais' ? '🇬🇧' : '🇩🇪'} {result.smartAnalysis.language}
                            </Badge>
                          )}
                          {result.smartAnalysis.applicationMethod !== 'Inconnu' && (
                            <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                              📨 {result.smartAnalysis.applicationMethod}
                            </Badge>
                          )}
                          {result.smartAnalysis.isExpired && (
                            <Badge variant="destructive" className="text-xs">
                              ⚠️ Expirée
                            </Badge>
                          )}
                          {result.smartAnalysis.deadlineMissing && !result.aiAnalysis?.deadline && (
                            <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                              ⚠️ Sans deadline
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Exclusion warnings */}
                      {result.isExcluded && (
                        <div className="mb-3 p-2 bg-destructive/10 rounded-lg">
                          <p className="font-semibold text-destructive flex items-center gap-2 text-sm mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            Critères d'exclusion
                          </p>
                          {renderExclusionBadge(result.exclusionFlags, result.aiAnalysis?.excluded, result.aiAnalysis?.exclusionReason)}
                        </div>
                      )}

                      {/* AI Analysis results */}
                      {result.aiAnalysis && !result.isExcluded && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Compatibilité</span>
                              <span className="font-semibold">{result.aiAnalysis.compatibility}%</span>
                            </div>
                            <Progress 
                              value={result.aiAnalysis.compatibility} 
                              className={`h-1.5 ${result.aiAnalysis.compatibility >= 70 ? '' : '[&>div]:bg-orange-500'}`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Atouts
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {result.aiAnalysis.matchingSkills?.slice(0, 3).map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 text-xs py-0">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-orange-700 mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> À renforcer
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {result.aiAnalysis.missingRequirements?.slice(0, 3).map((req, i) => (
                                  <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-800 text-xs py-0">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs">
                            {result.aiAnalysis.deadline && (
                              <span className="text-muted-foreground">
                                📅 {result.aiAnalysis.deadline}
                              </span>
                            )}
                            {result.aiAnalysis.recommendedChannel && (
                              <span className="text-muted-foreground">
                                📬 {result.aiAnalysis.recommendedChannel}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(index)}
                          className="flex-1 gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <XCircle className="w-3 h-3" />
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleValidateAndImport(index)}
                          className={`flex-1 gap-1 ${result.isDuplicate ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                          disabled={result.isAnalyzing}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {result.isDuplicate ? 'Forcer l\'import' : 'Importer'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {analysisResults.length > 0 && (
              <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une autre offre
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                >
                  Fermer
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
