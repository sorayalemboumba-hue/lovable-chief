import { Application } from '@/types/application';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Calendar, ExternalLink, Download, Edit, Trash2, FileText, Mail, Users, Sparkles, Eye, CalendarCheck, AtSign, ClipboardList, CheckCircle2, Target, ChevronDown, ChevronUp, Zap, Ban, RefreshCw, Loader2 } from 'lucide-react';
import { formatDate, getDaysUntil, isOverdue, isUrgent } from '@/lib/dateUtils';
import { downloadIcs } from '@/lib/icsExport';
import { supabase } from '@/integrations/supabase/client';
import { CompatibilityBadge } from './CompatibilityBadge';
import { ApplicationChecklist } from './ApplicationChecklist';
import { ApplicationWorkflow } from './ApplicationWorkflow';
import { toast } from 'sonner';
import { useState, memo, useCallback } from 'react';

interface ApplicationCardProps {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateCV?: () => void;
  onGenerateLetter?: () => void;
  onUpdate?: (updates: Partial<Application>) => void;
}

const STATUS_STYLES = {
  "à compléter": "bg-warning/10 text-warning border-warning/20",
  "en cours": "bg-primary/10 text-primary border-primary/20",
  "soumise": "bg-success/10 text-success border-success/20",
  "entretien": "bg-accent/10 text-accent border-accent/20",
};

export const ApplicationCard = memo(function ApplicationCard({ application, onEdit, onDelete, onGenerateCV, onGenerateLetter, onUpdate }: ApplicationCardProps) {
  const daysUntil = getDaysUntil(application.deadline);
  const urgent = isUrgent(application.deadline);
  const overdue = isOverdue(application.deadline);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Relancer l'analyse IA
  const handleReanalyze = useCallback(async () => {
    if (!onUpdate) return;
    
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
        requiredDocuments: data.required_documents,
        publicationDate: data.publication_date,
        deadline: data.deadline,
        urgent_no_deadline: data.urgent_no_deadline,
        contacts: data.contacts,
        excluded: data.excluded,
        exclusion_reason: data.exclusion_reason,
        applicationEmail: data.contacts?.[0]?.email,
        applicationInstructions: data.reasoning
      });

      toast.success(`Analyse terminée: ${data.compatibility}% de compatibilité`);
    } catch (error: any) {
      console.error('Reanalysis error:', error);
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        toast.error('Trop de requêtes. Réessayez dans quelques instants.');
      } else if (error.message?.includes('Crédits') || error.message?.includes('402')) {
        toast.error('Crédits IA épuisés. Ajoutez des crédits dans Settings → Usage.');
      } else {
        toast.error('Erreur lors de l\'analyse');
      }
    } finally {
      setAnalyzing(false);
    }
  }, [application, onUpdate]);

  // UN SEUL message de coaching selon priorité stricte
  const getCoachingBanner = (): { message: string; icon: any; color: 'destructive' | 'warning' | 'success' | 'accent' } | null => {
    const compatibility = application.compatibility || 0;
    const isNotSubmitted = application.statut !== 'soumise' && application.statut !== 'entretien';
    
    // PRIORITÉ A: Offre exclue (absolue)
    if (application.excluded) {
      return {
        message: `⛔ Offre exclue : ${application.exclusion_reason || 'Critères non remplis'}`,
        icon: Ban,
        color: 'destructive'
      };
    }
    
    // PRIORITÉ B: Urgence deadline (urgent_no_deadline OU deadline ≤ 3 jours)
    if (isNotSubmitted && (application.urgent_no_deadline || (daysUntil <= 3 && daysUntil >= 0))) {
      return {
        message: '⚡ Plan J-3 : Bloquer 3x30min pour finaliser cette candidature',
        icon: Zap,
        color: 'destructive'
      };
    }
    
    // PRIORITÉ C: Documents manquants
    if (isNotSubmitted && application.requiredDocuments && application.requiredDocuments.length > 0 && application.statut === 'à compléter') {
      return {
        message: `📝 Finaliser dossier : ${application.requiredDocuments.slice(0, 3).join(', ')}${application.requiredDocuments.length > 3 ? '...' : ''}`,
        icon: ClipboardList,
        color: 'warning'
      };
    }
    
    // PRIORITÉ D: Compatibilité < 70%
    if (isNotSubmitted && compatibility > 0 && compatibility < 70) {
      return {
        message: `🎯 Positionnement clair requis : valorisez vos compétences transférables (${compatibility}% match)`,
        icon: Target,
        color: 'warning'
      };
    }
    
    // Message positif si soumise
    if (application.statut === 'soumise') {
      return {
        message: '✅ Candidature soumise ! Préparez une relance dans 48-72h.',
        icon: CheckCircle2,
        color: 'success'
      };
    }
    
    return null;
  };

  const coachingBanner = getCoachingBanner();

  const handleViewOriginalOffer = async () => {
    if (!application.originalOfferUrl) {
      toast.error('Aucune offre originale disponible');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('job-offers')
        .download(application.originalOfferUrl);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing offer:', error);
      toast.error('Erreur lors de l\'ouverture de l\'offre');
    }
  };

  const getTypeIcon = () => {
    if (application.type === 'recommandée') return <Users className="w-4 h-4" />;
    if (application.type === 'spontanée') return <Sparkles className="w-4 h-4" />;
    return null;
  };

  const getTypeBadge = () => {
    if (application.type === 'recommandée') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Users className="w-3 h-3" />
          Recommandée {application.referent && `par ${application.referent}`}
        </Badge>
      );
    }
    if (application.type === 'spontanée') {
      return (
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" />
          Spontanée
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 sm:p-6 hover:shadow-lg transition-all duration-200 border-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 sm:gap-3 mb-3 flex-wrap">
            <h3 className="text-lg sm:text-xl font-semibold leading-tight flex-1 min-w-0">{application.poste}</h3>
            {onUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReanalyze}
                disabled={analyzing}
                title="Relancer l'analyse IA"
                className="h-8 w-8"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-primary" />
                )}
              </Button>
            )}
            <CompatibilityBadge application={application} />
            {application.priorite >= 8 && (
              <Badge variant="destructive" className="text-xs font-bold">Priorité haute</Badge>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{application.entreprise}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{application.lieu}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={STATUS_STYLES[application.statut]} variant="outline">
              {application.statut}
            </Badge>
            {getTypeBadge()}
          </div>
        </div>
      </div>

      {onUpdate && (
        <div className="mt-4">
          <ApplicationChecklist application={application} onUpdate={onUpdate} />
        </div>
      )}

      {/* Coaching Banner - UN SEUL message par priorité */}
      {coachingBanner && (
        <div className="mt-5">
          <div 
            className={`p-4 rounded-lg border-2 ${
              coachingBanner.color === 'destructive' ? 'bg-destructive/10 border-destructive/40 shadow-destructive/20 shadow-sm' :
              coachingBanner.color === 'warning' ? 'bg-warning/10 border-warning/40' :
              coachingBanner.color === 'success' ? 'bg-success/10 border-success/40' :
              'bg-accent/10 border-accent/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                coachingBanner.color === 'destructive' ? 'bg-destructive/20' :
                coachingBanner.color === 'warning' ? 'bg-warning/20' :
                coachingBanner.color === 'success' ? 'bg-success/20' :
                'bg-accent/20'
              }`}>
                <coachingBanner.icon className={`w-5 h-5 ${
                  coachingBanner.color === 'destructive' ? 'text-destructive' :
                  coachingBanner.color === 'warning' ? 'text-warning' :
                  coachingBanner.color === 'success' ? 'text-success' :
                  'text-accent'
                }`} />
              </div>
              <p className={`text-sm font-bold leading-relaxed flex-1 ${
                coachingBanner.color === 'destructive' ? 'text-destructive' : ''
              }`}>
                {coachingBanner.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Toggle & Display */}
      {onUpdate && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWorkflow(!showWorkflow)}
            className="w-full gap-2 mb-3"
          >
            {showWorkflow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showWorkflow ? 'Masquer' : 'Afficher'} la marche à suivre
          </Button>
          {showWorkflow && (
            <ApplicationWorkflow application={application} onUpdate={onUpdate} />
          )}
        </div>
      )}

      {/* Nouvelles informations extraites */}
      {(application.publicationDate || application.applicationEmail || application.applicationInstructions || (application.requiredDocuments && application.requiredDocuments.length > 0)) && (
        <div className="mt-5 pt-5 border-t-2 space-y-4">
          {application.publicationDate && (
            <div className="flex items-start gap-3 text-sm">
              <CalendarCheck className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-muted-foreground font-medium">Publiée le:</span>
                <span className="ml-2 font-semibold">{formatDate(application.publicationDate)}</span>
              </div>
            </div>
          )}
          
          {application.applicationEmail && (
            <div className="flex items-start gap-3 text-sm">
              <AtSign className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground font-medium">Candidature à:</span>
                <a href={`mailto:${application.applicationEmail}`} className="ml-2 font-semibold text-primary hover:underline break-all">
                  {application.applicationEmail}
                </a>
              </div>
            </div>
          )}
          
          {application.applicationInstructions && (
          <div className="flex items-start gap-3 text-sm">
              <ClipboardList className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground font-medium">Instructions:</span>
                <p className="mt-2 text-xs sm:text-sm bg-muted/50 p-3 rounded-md leading-relaxed">{application.applicationInstructions}</p>
              </div>
            </div>
          )}
          
          {application.requiredDocuments && application.requiredDocuments.length > 0 && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground font-medium">Documents requis:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {application.requiredDocuments.map((doc, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-medium">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compétences et matching */}
      {((application.matchingSkills && application.matchingSkills.length > 0) || (application.missingRequirements && application.missingRequirements.length > 0)) && (
        <div className="mt-5 pt-5 border-t-2 space-y-4">
          {application.matchingSkills && application.matchingSkills.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-success flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Vos atouts pour ce poste
              </div>
              <div className="flex flex-wrap gap-2">
                {application.matchingSkills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-medium border-success/30 bg-success/5 text-success">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {application.missingRequirements && application.missingRequirements.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-warning flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Compétences à mettre en avant
              </div>
              <div className="flex flex-wrap gap-2">
                {application.missingRequirements.map((req, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-medium border-warning/30 bg-warning/5 text-warning">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t-2 mt-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="w-5 h-5 flex-shrink-0" />
          <span className={overdue ? "text-destructive font-bold" : urgent ? "text-warning font-bold" : ""}>
            {formatDate(application.deadline)}
            {!overdue && ` (${daysUntil}j)`}
            {overdue && " - En retard"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {application.originalOfferUrl && (
            <Button
              variant="outline"
              size="default"
              onClick={handleViewOriginalOffer}
              className="gap-2 min-w-[80px]"
              title="Voir l'offre originale"
            >
              <Eye className="w-4 h-4" />
              Offre
            </Button>
          )}
          {onGenerateCV && !application.url?.includes('cv-') && (
            <Button
              variant="outline"
              size="default"
              onClick={onGenerateCV}
              className="gap-2 min-w-[80px]"
              title="Générer CV"
            >
              <FileText className="w-4 h-4" />
              CV
            </Button>
          )}
          {onGenerateLetter && !application.url?.includes('lettre-') && (
            <Button
              variant="outline"
              size="default"
              onClick={onGenerateLetter}
              className="gap-2 min-w-[80px]"
              title="Générer lettre de motivation"
            >
              <Mail className="w-4 h-4" />
              Lettre
            </Button>
          )}
          {application.url && application.url.startsWith('http') && (
            <Button variant="ghost" size="icon" asChild title="Ouvrir le lien">
              <a href={application.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => downloadIcs(application)} title="Télécharger calendrier">
            <Download className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Modifier">
            <Edit className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Supprimer">
            <Trash2 className="w-5 h-5 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
