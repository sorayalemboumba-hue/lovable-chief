import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AtSign
} from 'lucide-react';
import { Application } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentLibrary } from './DocumentLibrary';
import { ATSScoreCard } from './ATSScoreCard';

interface ApplicationWorkflowProps {
  application: Application;
  onUpdate: (updates: Partial<Application>) => void;
}

export function ApplicationWorkflow({ application, onUpdate }: ApplicationWorkflowProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [showDocLib, setShowDocLib] = useState(false);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      
      const userProfile = `Profil professionnel avec expérience en gestion et coordination.`;
      const jobDescription = `${application.poste} chez ${application.entreprise}, ${application.lieu}. ${application.notes || ''}`;

      const { data, error } = await supabase.functions.invoke('analyze-job-offer', {
        body: { jobDescription, userProfile }
      });

      if (error) throw error;

      onUpdate({
        compatibility: data.compatibility,
        matchingSkills: data.matching_skills,
        missingRequirements: data.missing_requirements,
        keywords: data.keywords,
        recommended_channel: data.recommended_channel,
        requiredDocuments: data.required_documents
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

  const handleMarkComplete = () => {
    onUpdate({ is_complete: !application.is_complete });
    toast.success(application.is_complete ? 'Dossier marqué incomplet' : 'Dossier complet validé');
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'email': return <AtSign className="w-4 h-4" />;
      case 'portal': return <Globe className="w-4 h-4" />;
      case 'spontaneous': return <Send className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (channel?: string) => {
    switch (channel) {
      case 'linkedin': return 'LinkedIn';
      case 'email': return 'Email direct';
      case 'portal': return 'Portail entreprise';
      case 'spontaneous': return 'Candidature spontanée';
      default: return 'Non défini';
    }
  };

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
      done: !!application.cv_template_id && !!application.letter_template_id,
      action: () => setShowDocLib(true),
      actionLabel: 'Bibliothèque'
    },
    {
      id: 'contacts',
      title: 'Identifier les contacts',
      icon: Users,
      done: (application.contacts?.length || 0) > 0,
      action: undefined
    },
    {
      id: 'send',
      title: 'Envoyer la candidature',
      icon: Send,
      done: application.statut === 'soumise' || application.statut === 'entretien',
      action: undefined
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
              <h4 className="font-semibold text-base sm:text-lg mb-1">Marche à suivre</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Complétez toutes les étapes pour un dossier optimal
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</div>
                <div className="text-xs text-muted-foreground">Complet</div>
              </div>
              <Button
                variant={application.is_complete ? 'default' : 'outline'}
                size="default"
                onClick={handleMarkComplete}
                className="gap-2"
              >
                {application.is_complete ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                {application.is_complete ? 'Validé' : 'Valider'}
              </Button>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    step.done ? 'bg-success/5 border-success/20' : 'bg-background border-border'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    step.done ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{step.title}</span>
                      {step.done && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          Fait
                        </Badge>
                      )}
                    </div>
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

          {/* Channel Recommendation */}
          {application.recommended_channel && (
            <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  {getChannelIcon(application.recommended_channel)}
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-sm mb-1">Canal recommandé</h5>
                  <p className="text-xs text-muted-foreground">
                    {getChannelLabel(application.recommended_channel)} - Meilleur canal pour cette candidature
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Required */}
          {application.requiredDocuments && application.requiredDocuments.length > 0 && (
            <div className="p-4 rounded-lg border-2 border-warning/20 bg-warning/5">
              <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents requis
              </h5>
              <div className="flex flex-wrap gap-2">
                {application.requiredDocuments.map((doc, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-background">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ATS Score Card - Show before submission */}
          {application.cv_template_id && application.letter_template_id && (
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
