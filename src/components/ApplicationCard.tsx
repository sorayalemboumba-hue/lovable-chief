import { Application } from '@/types/application';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Calendar, ExternalLink, Download, Edit, Trash2, FileText, Mail, Users, Sparkles, Eye, CalendarCheck, AtSign, ClipboardList } from 'lucide-react';
import { formatDate, getDaysUntil, isOverdue, isUrgent } from '@/lib/dateUtils';
import { downloadIcs } from '@/lib/icsExport';
import { supabase } from '@/integrations/supabase/client';
import { CompatibilityBadge } from './CompatibilityBadge';
import { ApplicationChecklist } from './ApplicationChecklist';
import { toast } from 'sonner';

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

export function ApplicationCard({ application, onEdit, onDelete, onGenerateCV, onGenerateLetter, onUpdate }: ApplicationCardProps) {
  const daysUntil = getDaysUntil(application.deadline);
  const urgent = isUrgent(application.deadline);
  const overdue = isOverdue(application.deadline);

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
    <Card className="p-6 hover:shadow-md transition-all duration-300 border-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{application.poste}</h3>
            <CompatibilityBadge application={application} />
            {application.priorite >= 8 && (
              <Badge variant="destructive" className="text-xs">Priorité haute</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {application.entreprise}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {application.lieu}
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

      {/* Nouvelles informations extraites */}
      {(application.publicationDate || application.applicationEmail || application.applicationInstructions || (application.requiredDocuments && application.requiredDocuments.length > 0)) && (
        <div className="mt-4 pt-4 border-t space-y-3">
          {application.publicationDate && (
            <div className="flex items-start gap-2 text-sm">
              <CalendarCheck className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Publiée le:</span>
                <span className="ml-1 font-medium">{formatDate(application.publicationDate)}</span>
              </div>
            </div>
          )}
          
          {application.applicationEmail && (
            <div className="flex items-start gap-2 text-sm">
              <AtSign className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Candidature à:</span>
                <a href={`mailto:${application.applicationEmail}`} className="ml-1 font-medium text-primary hover:underline">
                  {application.applicationEmail}
                </a>
              </div>
            </div>
          )}
          
          {application.applicationInstructions && (
          <div className="flex items-start gap-2 text-sm">
              <ClipboardList className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <span className="text-muted-foreground">Instructions:</span>
                <p className="mt-1 text-xs bg-muted/50 p-2 rounded leading-relaxed">{application.applicationInstructions}</p>
              </div>
            </div>
          )}
          
          {application.requiredDocuments && application.requiredDocuments.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <span className="text-muted-foreground">Documents requis:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {application.requiredDocuments.map((doc, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
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
        <div className="mt-4 pt-4 border-t space-y-3">
          {application.matchingSkills && application.matchingSkills.length > 0 && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-success flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Vos atouts pour ce poste
              </div>
              <div className="flex flex-wrap gap-1">
                {application.matchingSkills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-success/30 bg-success/5">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {application.missingRequirements && application.missingRequirements.length > 0 && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-warning flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Compétences à mettre en avant
              </div>
              <div className="flex flex-wrap gap-1">
                {application.missingRequirements.map((req, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-warning/30 bg-warning/5">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t mt-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          <span className={overdue ? "text-destructive font-medium" : urgent ? "text-warning font-medium" : ""}>
            {formatDate(application.deadline)}
            {!overdue && ` (${daysUntil}j)`}
            {overdue && " - En retard"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {application.originalOfferUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOriginalOffer}
              className="gap-1"
              title="Voir l'offre originale"
            >
              <Eye className="w-4 h-4" />
              Offre
            </Button>
          )}
          {onGenerateCV && !application.url?.includes('cv-') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateCV}
              className="gap-1"
              title="Générer CV"
            >
              <FileText className="w-4 h-4" />
              CV
            </Button>
          )}
          {onGenerateLetter && !application.url?.includes('lettre-') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateLetter}
              className="gap-1"
              title="Générer lettre de motivation"
            >
              <Mail className="w-4 h-4" />
              Lettre
            </Button>
          )}
          {application.url && application.url.startsWith('http') && (
            <Button variant="ghost" size="sm" asChild>
              <a href={application.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => downloadIcs(application)}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
