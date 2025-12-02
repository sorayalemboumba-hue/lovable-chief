import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Application } from "@/types/application";
import { BriefCandidature } from "./BriefCandidature";
import { AlertTriangle, Clock, Ban, Edit, Trash2 } from "lucide-react";

interface ApplicationCardProps {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateCV?: () => void;
  onGenerateLetter?: () => void;
  onUpdate: (app: Application) => void;
}

export function ApplicationCard({ application, onEdit, onDelete, onUpdate }: ApplicationCardProps) {
  const navigate = useNavigate();

  // Logique Coaching (Une seule bannière)
  const getCoachingBanner = () => {
    if (application.excluded) {
      return (
        <div className="bg-red-100 p-3 rounded-md flex items-center gap-2 text-red-800 font-bold mb-4">
          <Ban className="w-5 h-5" /> ⛔ OFFRE EXCLUE : {application.exclusion_reason}
        </div>
      );
    }
    const daysUntil = application.deadline 
      ? Math.ceil((new Date(application.deadline).getTime() - Date.now()) / 86400000) 
      : 10;
    if (daysUntil <= 3 && daysUntil >= 0) {
      return (
        <div className="bg-orange-100 p-3 rounded-md flex items-center gap-2 text-orange-800 font-bold mb-4">
          <Clock className="w-5 h-5" /> ⚡ PLAN J-{daysUntil} : Bloquer 3x30min pour finaliser !
        </div>
      );
    }
    if ((application.compatibility ?? 100) < 70) {
      return (
        <div className="bg-blue-50 p-3 rounded-md flex items-center gap-2 text-blue-800 text-sm mb-4">
          <AlertTriangle className="w-4 h-4" /> 🎯 Positionnement clair requis (Match faible)
        </div>
      );
    }
    return null;
  };

  const handleBriefUpdate = (updates: Partial<Application>) => {
    onUpdate({ ...application, ...updates });
  };

  return (
    <Card className="p-6 mb-4 hover:shadow-lg transition-all border-l-4 border-l-primary">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">{application.poste}</h3>
          <p className="text-muted-foreground font-medium">{application.entreprise} • {application.lieu}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={application.statut === 'soumise' ? "default" : "outline"} className="text-sm">
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

      {/* BANNIÈRE COACHING */}
      {getCoachingBanner()}

      {/* BRIEF CANDIDATURE (REMPLACE LA MARCHE À SUIVRE) */}
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Brief Candidature</h4>
        
        {/* Intégration du composant Brief existant */}
        <BriefCandidature application={application} onUpdate={handleBriefUpdate} />

        {/* BOUTON GÉNÉRATEUR CV */}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/generate/${application.id}`)}
            className="border-primary text-primary hover:bg-primary/5"
          >
            📄 Créer CV & Lettre Soraya
          </Button>
          <Button onClick={() => onUpdate({...application, statut: 'soumise'})}>
            ✅ Marquer comme Envoyé
          </Button>
        </div>
      </div>
    </Card>
  );
}
