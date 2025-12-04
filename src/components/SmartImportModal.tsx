import { useState } from 'react';
import { Application } from '@/types/application';
import { parseJobAlert, ParsedJob } from '@/lib/emailParser';
import { parseTextJobOffer } from '@/lib/textJobParser';
import { parsePDFFile } from '@/lib/pdfParser';
import { cleanEmailContent, extractJobContent } from '@/lib/emailCleaner';
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
import { 
  FileText, Mail, Link as LinkIcon, Sparkles, AlertTriangle, 
  CheckCircle, XCircle, Loader2, MapPin, Languages, GraduationCap,
  Building, Briefcase, Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface SmartImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (jobs: Partial<Application>[]) => Promise<string[]>;
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
  } | null;
  exclusionFlags: ExclusionFlags;
  isExcluded: boolean;
  exclusionReason: string;
  isAnalyzing: boolean;
}

type ImportStep = 'input' | 'analysis' | 'review';

export function SmartImportModal({ open, onClose, onImport }: SmartImportModalProps) {
  const [step, setStep] = useState<ImportStep>('input');
  const [activeTab, setActiveTab] = useState('text');
  
  // Input states
  const [textContent, setTextContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
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
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetState = () => {
    setStep('input');
    setTextContent('');
    setLinkUrl('');
    setEmailContent('');
    setPdfFile(null);
    setSpontaneousForm({ entreprise: '', poste: '', lieu: '', notes: '' });
    setAnalysisResults([]);
    setCurrentAnalysisIndex(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Parse and start analysis
  const handleAnalyze = async (jobs: ExtendedParsedJob[]) => {
    if (jobs.length === 0) {
      toast.error('Aucune offre détectée');
      return;
    }

    setStep('analysis');
    setIsAnalyzing(true);
    
    // Initialize results with exclusion check
    const initialResults: AnalysisResult[] = jobs.map(job => {
      const flags = evaluateExclusionRules(job.poste, job.lieu, job.motsCles);
      const isExcluded = shouldExcludeOffer(flags);
      return {
        job,
        aiAnalysis: null,
        exclusionFlags: flags,
        isExcluded,
        exclusionReason: isExcluded ? getExclusionReason(flags) : '',
        isAnalyzing: !isExcluded // Only analyze non-excluded jobs
      };
    });
    
    setAnalysisResults(initialResults);

    // Run AI analysis for non-excluded jobs
    const userProfile = `Profil professionnel avec expérience en gestion de projet, coordination d'équipes et événementiel. Basée en Suisse romande (Genève/Vaud). Bachelor en Hospitality Management de l'EHL. Compétences: leadership, communication, organisation, gestion de crise.`;
    
    for (let i = 0; i < initialResults.length; i++) {
      const result = initialResults[i];
      if (result.isExcluded) continue;
      
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
              compatibility: data.compatibility || 0,
              matchingSkills: data.matching_skills || [],
              missingRequirements: data.missing_requirements || [],
              keywords: data.keywords || '',
              recommendedChannel: data.recommended_channel || '',
              requiredDocuments: data.required_documents || ['CV'],
              deadline: data.deadline || '',
              contacts: data.contacts || [],
              excluded: data.excluded || false,
              exclusionReason: data.exclusion_reason,
              reasoning: data.reasoning || ''
            },
            isExcluded: data.excluded || r.isExcluded,
            exclusionReason: data.exclusion_reason || r.exclusionReason,
            isAnalyzing: false
          } : r
        ));
      } catch (error) {
        console.error('Analysis error:', error);
        setAnalysisResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, isAnalyzing: false } : r
        ));
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
    if (job) {
      handleAnalyze([{ ...job, url: linkUrl || undefined }]);
    } else {
      // Create basic job from content
      handleAnalyze([{
        entreprise: 'À déterminer',
        poste: content.substring(0, 50) + '...',
        lieu: 'Suisse',
        canal: 'direct',
        source: 'Texte',
        motsCles: content.substring(0, 200),
        description: content
      }]);
    }
  };

  // Handle email submission - with cleaning
  const handleSubmitEmail = () => {
    if (!emailContent) {
      toast.error('Veuillez coller le contenu de l\'email');
      return;
    }
    
    // Clean the email content first
    const cleanedContent = extractJobContent(emailContent);
    console.log('Cleaned email content:', cleanedContent.substring(0, 200));
    
    const jobs = parseJobAlert(cleanedContent);
    if (jobs.length > 0) {
      handleAnalyze(jobs);
    } else {
      // Try to parse as raw text if no jobs detected
      const job = parseTextJobOffer(cleanedContent);
      if (job) {
        handleAnalyze([job]);
      } else {
        toast.error('Aucune offre détectée dans l\'email');
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
        handleAnalyze([job]);
      } else {
        toast.error('Impossible d\'analyser le PDF');
      }
    } catch (error) {
      toast.dismiss('pdf-parse');
      toast.error('Erreur lors de l\'analyse du PDF');
    }
  };

  // Handle spontaneous submission
  const handleSubmitSpontaneous = () => {
    if (!spontaneousForm.entreprise || !spontaneousForm.poste) {
      toast.error('Veuillez remplir au moins l\'entreprise et le poste');
      return;
    }
    
    handleAnalyze([{
      entreprise: spontaneousForm.entreprise,
      poste: spontaneousForm.poste,
      lieu: spontaneousForm.lieu || 'Suisse',
      canal: 'spontanée',
      source: 'Spontanée',
      motsCles: spontaneousForm.notes,
      description: spontaneousForm.notes
    }]);
  };

  // Validate and import single result
  const handleValidateAndImport = async (index: number) => {
    const result = analysisResults[index];
    const today = new Date();
    const defaultDeadline = new Date(today);
    defaultDeadline.setDate(today.getDate() + 14);
    
    // Check if OCE job (priority handling)
    const isOCE = (result.job as any).isOCE || 
                  result.job.canal === 'OCE' || 
                  /(?:OCE|ORP|Office cantonal)/i.test(result.job.source || '');
    
    // Calculate priority: OCE = 1 (URGENT), high match = 3, default = 2
    let priority = 2;
    if (isOCE) {
      priority = 1; // URGENT for OCE
    } else if (result.aiAnalysis?.compatibility && result.aiAnalysis.compatibility >= 80) {
      priority = 3;
    }
    
    // Build notes with OCE warning if applicable
    let notes = result.aiAnalysis?.reasoning || '';
    if (isOCE) {
      notes = `⚠️ OFFRE OCE - Preuve de candidature requise pour validation ORP\n\n${notes}`;
    }
    
    const applicationToImport: Partial<Application> = {
      entreprise: result.job.entreprise,
      poste: result.job.poste,
      lieu: result.job.lieu,
      deadline: result.aiAnalysis?.deadline || defaultDeadline.toISOString().split('T')[0],
      statut: 'à compléter',
      priorite: priority,
      keywords: result.aiAnalysis?.keywords || result.job.motsCles,
      notes,
      url: result.job.url,
      compatibility: result.aiAnalysis?.compatibility,
      matchingSkills: result.aiAnalysis?.matchingSkills,
      missingRequirements: result.aiAnalysis?.missingRequirements,
      recommended_channel: isOCE ? 'OCE' : result.aiAnalysis?.recommendedChannel,
      requiredDocuments: result.aiAnalysis?.requiredDocuments || (isOCE ? ['CV', 'Lettre de motivation', 'Preuve de candidature'] : undefined),
      applicationEmail: result.aiAnalysis?.contacts?.[0]?.email,
    };
    
    try {
      await onImport([applicationToImport]);
      toast.success(`✅ "${result.job.poste}" importée ${isOCE ? '(OCE - URGENT)' : ''} !`);
      
      // Remove from results
      setAnalysisResults(prev => prev.filter((_, i) => i !== index));
      
      // Close if no more results
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
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Collez l'email complet (LinkedIn, JobUp, Indeed...)"
                  className="min-h-[250px]"
                />
              </div>
              <Button 
                onClick={handleSubmitEmail}
                disabled={!emailContent}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                Analyser les offres
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
            {/* Scrollable content area */}
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
                    <Card key={index} className={`p-5 ${result.isExcluded ? 'border-destructive/50 bg-destructive/5' : 'border-primary/30'}`}>
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

                      {/* AI Analysis results - compact */}
                      {result.aiAnalysis && !result.isExcluded && (
                        <div className="space-y-3">
                          {/* Compatibility bar */}
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

                          {/* Skills - compact */}
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

                          {/* Deadline & Channel - inline */}
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

                      {/* Action buttons - inside card */}
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
                          className="flex-1 gap-1"
                          disabled={result.isAnalyzing}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Importer
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Fixed footer - always visible */}
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
