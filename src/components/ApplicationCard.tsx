import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Application } from "@/types/application";
import { ApplicationWorkflow } from "./ApplicationWorkflow";
import { AlertTriangle, Clock, Ban, Building2, MapPin, Calendar, Edit, Trash2 } from "lucide-react";
import { formatDate, getDaysUntil, isOverdue, isUrgent } from '@/lib/dateUtils';
import { CompatibilityBadge } from './CompatibilityBadge';
import { useState } from "react";

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

export function ApplicationCard({ application, onEdit, onDelete, onUpdate }: ApplicationCardProps) {
  const navigate = useNavigate();
  const [showBrief, setShowBrief] = useState(true);
  const daysUntil = getDaysUntil(application.deadline);
  const overdue = isOverdue(application.deadline);
  const urgent = isUrgent(application.deadline);

  // Logique Coaching (Une seule bannière - Priorité: Exclue > Urgente > Compatibilité)
  const getCoachingBanner = () => {
    // PRIORITÉ A: Offre exclue
    if (application.excluded) {
      return (
        <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-2 text-destructive font-bold mb-4 border border-destructive/30">
          <Ban className="w-5 h-5" />
          ⛔ OFFRE EXCLUE : {application.exclusion_reason || 'Critères non remplis'}
        </div>
      );
    }
    
    // PRIORITÉ B: Urgence deadline (urgent_no_deadline OU deadline ≤ 3 jours)
    const isNotSubmitted = application.statut !== 'soumise' && application.statut !== 'entretien';
    if (isNotSubmitted && (application.urgent_no_deadline || (daysUntil <= 3 && daysUntil >= 0))) {
      return (
        <div className="bg-warning/20 p-3 rounded-md flex items-center gap-2 text-warning font-bold mb-4 border border-warning/30">
          <Clock className="w-5 h-5" />
          ⚡ PLAN J-{daysUntil >= 0 ? daysUntil : 0} : Bloquer 3x30min pour finaliser !
        </div>
      );
    }
    
    // PRIORITÉ C: Compatibilité < 70%
    if (isNotSubmitted && (application.compatibility ?? 100) < 70 && application.compatibility !== undefined) {
      return (
        <div className="bg-accent/20 p-3 rounded-md flex items-center gap-2 text-accent-foreground text-sm mb-4 border border-accent/30">
          <AlertTriangle className="w-4 h-4" />
          🎯 Positionnement clair requis (Match {application.compatibility}%)
        </div>
      );
    }
    
    return null;
  };

  const handleUpdate = (updates: Partial<Application>) => {
    if (onUpdate) {
      onUpdate(updates);
    }
  };

  return (
    <Card className="p-6 mb-4 hover:shadow-lg transition-all border-l-4 border-l-primary">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2 flex-wrap">
            <h3 className="text-xl font-bold text-foreground">{application.poste}</h3>
            <CompatibilityBadge application={application} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4" />
              {application.entreprise}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {application.lieu}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={STATUS_STYLES[application.statut]} variant="outline">
            {application.statut.toUpperCase()}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Modifier">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Supprimer">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-2 text-sm font-medium mb-4">
        <Calendar className="w-4 h-4" />
        <span className={overdue ? "text-destructive font-bold" : urgent ? "text-warning font-bold" : ""}>
          {formatDate(application.deadline)}
          {!overdue && daysUntil >= 0 && ` (${daysUntil}j)`}
          {overdue && " - En retard"}
        </span>
      </div>

      {/* BANNIÈRE COACHING - UNE SEULE */}
      {getCoachingBanner()}

      {/* BRIEF CANDIDATURE */}
      {onUpdate && (
        <div className="mt-4 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBrief(!showBrief)}
            className="mb-3 text-sm text-muted-foreground"
          >
            {showBrief ? '▼ Masquer' : '▶ Afficher'} le brief candidature
          </Button>
          
          {showBrief && (
            <ApplicationWorkflow application={application} onUpdate={handleUpdate} />
          )}

          {/* BOUTON GÉNÉRATEUR CV */}
          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/generate?appId=${application.id}`)}
              className="border-primary text-primary hover:bg-primary/5"
            >
              📄 Créer CV & Lettre Soraya
            </Button>
            {application.statut !== 'soumise' && application.statut !== 'entretien' && (
              <Button onClick={() => handleUpdate({ statut: 'soumise' })}>
                ✅ Marquer comme Envoyé
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
