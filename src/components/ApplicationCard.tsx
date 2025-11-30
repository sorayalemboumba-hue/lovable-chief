import { Application } from '@/types/application';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Calendar, ExternalLink, Download, Edit, Trash2, FileText, Mail } from 'lucide-react';
import { formatDate, getDaysUntil, isOverdue, isUrgent } from '@/lib/dateUtils';
import { downloadIcs } from '@/lib/icsExport';

interface ApplicationCardProps {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateCV?: () => void;
  onGenerateLetter?: () => void;
}

const STATUS_STYLES = {
  "à compléter": "bg-warning/10 text-warning border-warning/20",
  "en cours": "bg-primary/10 text-primary border-primary/20",
  "soumise": "bg-success/10 text-success border-success/20",
  "entretien": "bg-accent/10 text-accent border-accent/20",
};

export function ApplicationCard({ application, onEdit, onDelete, onGenerateCV, onGenerateLetter }: ApplicationCardProps) {
  const daysUntil = getDaysUntil(application.deadline);
  const urgent = isUrgent(application.deadline);
  const overdue = isOverdue(application.deadline);

  return (
    <Card className="p-6 hover:shadow-md transition-all duration-300 border-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{application.poste}</h3>
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

          <Badge className={STATUS_STYLES[application.statut]} variant="outline">
            {application.statut}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          <span className={overdue ? "text-destructive font-medium" : urgent ? "text-warning font-medium" : ""}>
            {formatDate(application.deadline)}
            {!overdue && ` (${daysUntil}j)`}
            {overdue && " - En retard"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
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
