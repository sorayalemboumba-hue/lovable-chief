import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { Application } from "@/types/application";
import { BriefCandidature } from "./BriefCandidature";
import { AlertTriangle, Clock, Ban, Edit, Trash2, Zap, Loader2, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApplicationCardProps {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateCV?: () => void;
  onGenerateLetter?: () => void;
  onUpdate: (updates: Partial<Application>) => void;
}

export function ApplicationCard({ application, onEdit, onDelete, onUpdate }: ApplicationCardProps) {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calcul des jours jusqu'à la deadline
  const daysUntil = application.deadline 
    ? Math.ceil((new Date(application.deadline).getTime() - Date.now()) / 86400000) 
    : null;

  // Formatage de la date limite
  const formattedDeadline = application.deadline 
    ? format(new Date(application.deadline), "d MMM yyyy", { locale: fr })
    : "Date inconnue";

  // Logique Coaching (Une seule bannière)
  const getCoachingBanner = () => {
    if (application.excluded) {
      return (
        <div className="bg-red-100 p-3 rounded-md flex items-center gap-2 text-red-800 font-bold mb-4">
          <Ban className="w-5 h-5" /> ⛔ OFFRE EXCLUE : {application.exclusion_reason}
        </div>
      );
    }
    if (daysUntil !== null && daysUntil <= 3 && daysUntil >= 0) {
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
    onUpdate(updates);
  };

  const handleAnalyzeOffer = async () => {
    setIsAnalyzing(true);
    try {
      // Construire la description de l'offre à partir des données existantes
      const jobDescription = `
        Poste: ${application.poste}
        Entreprise: ${application.entreprise}
        Lieu: ${application.lieu}
        ${application.keywords ? `Compétences: ${application.keywords}` : ''}
        ${application.notes ? `Description: ${application.notes}` : ''}
        ${application.url ? `URL: ${application.url}` : ''}
      `.trim();

      const { data, error } = await supabase.functions.invoke('analyze-job-offer', {
        body: { jobDescription }
      });

      if (error) throw error;

      if (data) {
        // Mettre à jour l'application avec les résultats de l'analyse
        const updates: Partial<Application> = {};
        
        if (data.deadline) updates.deadline = data.deadline;
        if (data.applicationEmail) updates.applicationEmail = data.applicationEmail;
        if (data.applicationInstructions) updates.applicationInstructions = data.applicationInstructions;
        if (data.requiredDocuments) updates.requiredDocuments = data.requiredDocuments;
        if (data.compatibility !== undefined) updates.compatibility = data.compatibility;
        if (data.matchingSkills) updates.matchingSkills = data.matchingSkills;
        if (data.missingRequirements) updates.missingRequirements = data.missingRequirements;
        if (data.keywords) updates.keywords = data.keywords;
        if (data.recommended_channel) updates.recommended_channel = data.recommended_channel;
        if (data.ats_compliant !== undefined) updates.ats_compliant = data.ats_compliant;
        if (data.excluded !== undefined) {
          updates.excluded = data.excluded;
          updates.exclusion_reason = data.exclusion_reason;
        }

        onUpdate(updates);
        toast.success("Analyse IA terminée !", {
          description: `Compatibilité: ${data.compatibility || 'N/A'}%`
        });
      }
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      toast.error("Erreur lors de l'analyse", {
        description: "Vérifiez votre connexion et réessayez."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="p-6 mb-4 hover:shadow-lg transition-all border-l-4 border-l-primary">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">{application.poste}</h3>
            <p className="text-muted-foreground font-medium">{application.entreprise} • {application.lieu}</p>
            
            {/* DATE & LIEN ORIGINE */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formattedDeadline}</span>
                {daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && (
                  <Badge variant="outline" className="ml-1 text-orange-600 border-orange-300">
                    J-{daysUntil}
                  </Badge>
                )}
              </div>
              
              {(application.originalOfferUrl || application.url) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => window.open(application.originalOfferUrl || application.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voir l'annonce originale</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
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

        {/* BOUTONS D'ACTION */}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {/* Bouton Analyse IA */}
          <Button 
            variant="secondary"
            onClick={handleAnalyzeOffer}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyser l'offre (IA)
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate(`/generate/${application.id}`)}
            className="border-primary text-primary hover:bg-primary/5"
          >
            📄 Créer CV & Lettre Soraya
          </Button>
          <Button onClick={() => onUpdate({ statut: 'soumise' })}>
            ✅ Marquer comme Envoyé
          </Button>
        </div>
      </div>
      </Card>
    </TooltipProvider>
  );
}
