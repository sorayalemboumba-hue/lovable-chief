import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Loader2, 
  FileText, 
  Mail, 
  Users, 
  Send, 
  Target,
  Linkedin,
  Globe,
  AtSign,
  Copy,
  ExternalLink,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { Application } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentLibrary } from './DocumentLibrary';
import { ATSScoreCard } from './ATSScoreCard';
import { sorayaProfile } from '@/data/profile';

interface ApplicationWorkflowProps {
  application: Application;
  onUpdate: (updates: Partial<Application>) => void;
}

export function ApplicationWorkflow({ application, onUpdate }: ApplicationWorkflowProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [showDocLib, setShowDocLib] = useState(false);
  const [oceProofSaved, setOceProofSaved] = useState(false);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      
      const profileDescription = `Profil professionnel avec expérience en gestion et coordination.`;
      const jobDescription = `${application.poste} chez ${application.entreprise}, ${application.lieu}. ${application.notes || ''}`;

      const { data, error } = await supabase.functions.invoke('analyze-job-offer', {
        body: { jobDescription, userProfile: profileDescription }
      });

      if (error) throw error;

      onUpdate({
        compatibility: data.compatibility,
        matchingSkills: data.matching_skills,
        missingRequirements: data.missing_requirements,
        keywords: data.keywords,
        recommended_channel: data.recommended_channel,
        requiredDocuments: data.required_documents,
        contacts: data.contacts,
        applicationEmail: data.contacts?.[0]?.email,
        applicationInstructions: data.reasoning
      });

      toast.success(`Analyse terminée: ${data.compatibility}% de compatibilité`);
    } catch (error: any) {
      console.error('Analysis error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('Trop de requêtes. Réessayez dans quelques instants.');
      } else if (error.message?.includes('Crédits')) {
        toast.error('Crédits IA épuisés. Ajoutez des crédits dans Settings → Usage.');
      } else {
        toast.error('Erreur lors de l\'analyse');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectCV = (templateId: string, fileUrl: string) => {
    onUpdate({ cv_template_id: templateId, url: fileUrl });
    toast.success('Modèle de CV sélectionné');
  };

  const handleSelectLetter = (templateId: string, fileUrl: string) => {
    onUpdate({ letter_template_id: templateId });
    toast.success('Modèle de lettre sélectionné');
  };

  const handleSubmitApplication = () => {
    const submissionDate = new Date().toISOString();
    onUpdate({ 
      statut: 'soumise',
      is_complete: true
    });
    toast.success(`Candidature soumise le ${new Date().toLocaleDateString('fr-CH')}`);
  };

  // Generate mailto link with pre-filled content
  const generateMailtoLink = useCallback(() => {
    const email = application.applicationEmail || application.contacts?.[0]?.email || '';
    const subject = encodeURIComponent(`Candidature: ${application.poste} - ${sorayaProfile.nom}`);
    
    const body = encodeURIComponent(
      `Madame, Monsieur,\n\n` +
      `Je me permets de vous adresser ma candidature pour le poste de ${application.poste}.\n\n` +
      `${application.applicationInstructions || 'Vous trouverez ci-joint mon CV et ma lettre de motivation.'}\n\n` +
      `Je reste à votre disposition pour tout renseignement complémentaire.\n\n` +
      `Cordialement,\n${sorayaProfile.nom}`
    );
    
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }, [application]);

  // Generate short note for LinkedIn/JobUp (max 500 chars)
  const generateShortNote = useCallback(() => {
    const intro = `Bonjour,\n\nVotre offre de ${application.poste} a retenu toute mon attention.`;
    const skills = application.matchingSkills?.slice(0, 3).join(', ') || 'gestion de projet, coordination';
    const body = ` Mon expérience en ${skills} correspond à vos attentes.`;
    const closing = `\n\nJe serais ravi(e) d'échanger avec vous.\n\nCordialement,\n${sorayaProfile.nom}`;
    
    return (intro + body + closing).slice(0, 500);
  }, [application]);

  // Generate ATS-optimized motivation text (max 700 chars)
  const generateATSText = useCallback(() => {
    const skills = application.matchingSkills?.slice(0, 4).join(', ') || 'coordination, gestion';
    const keywords = application.keywords?.split(',').slice(0, 3).join(', ') || '';
    
    return `Motivé(e) par le poste de ${application.poste}, je souhaite mettre mes compétences en ${skills} au service de ${application.entreprise}. ${keywords ? `Mes connaissances en ${keywords} ` : ''}correspondent aux exigences de ce poste. Rigoureux(se) et proactif(ve), je suis convaincu(e) de pouvoir contribuer efficacement à votre équipe. Je reste disponible pour un entretien.`.slice(0, 700);
  }, [application]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié !`);
  };

  const channel = application.recommended_channel;
  const isEmailChannel = channel === 'email' || channel === 'spontaneous';
  const isLinkedInChannel = channel === 'linkedin' || channel === 'jobup';
  const isPortalChannel = channel === 'portal';

  const contactEmail = application.applicationEmail || application.contacts?.[0]?.email;
  const contactName = application.contacts?.[0]?.nom;

  const steps = [
    {
      id: 'analyze',
      title: 'Analyser l\'offre',
      icon: Sparkles,
      done: !!application.compatibility,
      action: () => handleAnalyze(),
      actionLabel: 'Analyser avec IA'
    },
    {
      id: 'documents',
      title: 'Sélectionner les modèles',
      icon: FileText,
      done: !!application.cv_template_id,
      action: () => setShowDocLib(true),
      actionLabel: 'Bibliothèque'
    }
  ];

  const completionRate = steps.filter(s => s.done).length / steps.length * 100;

  return (
    <>
      <Card className="p-5 border-2 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-base sm:text-lg mb-1">Brief Candidature</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Adapté au canal de recrutement détecté
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</div>
                <div className="text-xs text-muted-foreground">Préparé</div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    step.done ? 'bg-success/5 border-success/20' : 'bg-background border-border'
                  }`}
                >
                  <div className={`p-2 rounded-full ${step.done ? 'bg-success/10' : 'bg-muted'}`}>
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{step.title}</span>
                    {step.done && (
                      <Badge variant="outline" className="ml-2 text-xs bg-success/10 text-success border-success/20">
                        Fait
                      </Badge>
                    )}
                  </div>
                  {step.action && !step.done && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={step.action}
                      disabled={step.id === 'analyze' && analyzing}
                      className="flex-shrink-0"
                    >
                      {step.id === 'analyze' && analyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        step.actionLabel
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ===== SCÉNARIO A: Email / Chasseur de tête ===== */}
          {isEmailChannel && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Mail className="w-5 h-5" />
                <span>Candidature par Email</span>
              </div>
              
              {/* Contact principal */}
              {(contactEmail || contactName) && (
                <div className="p-4 rounded-lg bg-background border-2">
                  <div className="text-xs text-muted-foreground mb-1">Contact principal</div>
                  {contactName && <div className="font-semibold">{contactName}</div>}
                  {contactEmail && (
                    <a href={`mailto:${contactEmail}`} className="text-primary text-lg font-bold hover:underline">
                      {contactEmail}
                    </a>
                  )}
                </div>
              )}

              {/* Bouton mailto */}
              <Button 
                className="w-full gap-2 text-base py-6" 
                size="lg"
                asChild
              >
                <a href={generateMailtoLink()}>
                  <Mail className="w-5 h-5" />
                  Ouvrir Email pré-rempli
                </a>
              </Button>

              {/* Documents à joindre */}
              {application.requiredDocuments && application.requiredDocuments.length > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-2 text-warning font-medium text-sm mb-2">
                    <FileText className="w-4 h-4" />
                    Documents PDF à joindre
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {application.requiredDocuments.map((doc, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-background">
                        📎 {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SCÉNARIO B: LinkedIn / JobUp ===== */}
          {isLinkedInChannel && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-accent/30 bg-accent/5">
              <div className="flex items-center gap-2 text-accent font-semibold">
                <Linkedin className="w-5 h-5" />
                <span>Candidature simplifiée ({channel === 'linkedin' ? 'LinkedIn' : 'JobUp'})</span>
              </div>
              
              {/* Note rapide à copier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Note rapide à copier (max 500 car.)</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(generateShortNote(), 'Note')}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </Button>
                </div>
                <Textarea 
                  value={generateShortNote()} 
                  readOnly 
                  className="text-sm min-h-[120px] bg-background"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {generateShortNote().length}/500 caractères
                </div>
              </div>

              {/* Bouton externe */}
              {application.url && (
                <Button 
                  className="w-full gap-2 text-base py-6" 
                  size="lg"
                  variant="default"
                  asChild
                >
                  <a href={application.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-5 h-5" />
                    Ouvrir l'offre externe
                  </a>
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                💡 Pas besoin de lettre PDF - La note suffit pour ce canal
              </p>
            </div>
          )}

          {/* ===== SCÉNARIO C: Portail ATS ===== */}
          {isPortalChannel && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 text-warning font-semibold">
                <Globe className="w-5 h-5" />
                <span>Portail ATS (Site carrière)</span>
              </div>
              
              {/* Texte de motivation optimisé */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Texte de motivation (Copier-Coller)</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(generateATSText(), 'Texte')}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </Button>
                </div>
                <Textarea 
                  value={generateATSText()} 
                  readOnly 
                  className="text-sm min-h-[140px] bg-background"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {generateATSText().length}/700 caractères
                </div>
              </div>

              {/* Rappel parsing */}
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-2 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>⚠️ Vérifiez le parsing automatique du CV sur le portail avant de soumettre !</span>
                </div>
              </div>

              {/* Bouton externe */}
              {application.url && (
                <Button 
                  className="w-full gap-2 text-base py-6" 
                  size="lg"
                  variant="default"
                  asChild
                >
                  <a href={application.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-5 h-5" />
                    Accéder au portail
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* ===== Canal non détecté ===== */}
          {!channel && application.compatibility && (
            <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-5 h-5" />
                <span className="font-medium">Canal non détecté</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Relancez l'analyse pour identifier le meilleur canal de candidature.
              </p>
            </div>
          )}

          {/* ===== Section OCE (TOUS LES CAS) ===== */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="oce-proof"
                  checked={oceProofSaved}
                  onCheckedChange={(checked) => setOceProofSaved(!!checked)}
                />
                <label 
                  htmlFor="oce-proof" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Preuve OCE sauvegardée ?
                </label>
              </div>
              <Badge variant="outline" className="text-xs">
                <Briefcase className="w-3 h-3 mr-1" />
                Historique chômage
              </Badge>
            </div>
          </div>

          {/* ===== Bouton de validation finale ===== */}
          {application.statut !== 'soumise' && application.statut !== 'entretien' && (
            <Button
              className="w-full gap-2 text-base py-6"
              size="lg"
              variant={oceProofSaved ? 'default' : 'outline'}
              onClick={handleSubmitApplication}
            >
              <Send className="w-5 h-5" />
              Marquer comme candidaté
              {oceProofSaved && <CheckCircle2 className="w-4 h-4 ml-1" />}
            </Button>
          )}

          {/* ATS Score Card */}
          {application.cv_template_id && (
            <ATSScoreCard application={application} />
          )}
        </div>
      </Card>

      {/* Document Library Modal */}
      <Dialog open={showDocLib} onOpenChange={setShowDocLib}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bibliothèque de documents</DialogTitle>
          </DialogHeader>
          <DocumentLibrary
            application={application}
            onSelectCV={handleSelectCV}
            onSelectLetter={handleSelectLetter}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
