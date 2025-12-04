import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { BriefCandidature } from "./BriefCandidature";
import { formatDateDisplay, getDaysUntil } from "@/lib/dateUtils";
import { AlertTriangle, Clock, Ban, ExternalLink, Sparkles, Copy, FileText, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationCardProps {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateCV?: () => void;
  onGenerateLetter?: () => void;
  onUpdate: (updates: Partial<Application>) => void;
}

export function ApplicationCard({ application, onEdit, onDelete, onUpdate }: ApplicationCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Calculs Dates & Coaching (SANS conversion timezone)
  const daysUntil = application.deadline ? getDaysUntil(application.deadline) : null;
  const formattedDeadline = formatDateDisplay(application.deadline || '');

  const getCoachingBanner = () => {
    if (application.excluded) return <div className="bg-red-100 p-3 rounded-md flex items-center gap-2 text-red-800 font-bold mb-4"><Ban className="w-5 h-5" /> ⛔ OFFRE EXCLUE : {application.exclusion_reason}</div>;
    if (daysUntil !== null && daysUntil <= 3 && daysUntil >= 0) return <div className="bg-orange-100 p-3 rounded-md flex items-center gap-2 text-orange-800 font-bold mb-4"><Clock className="w-5 h-5" /> ⚡ URGENT J-{daysUntil} : Bloquer 30min maintenant !</div>;
    if ((application.compatibility ?? 100) < 70) return <div className="bg-blue-50 p-3 rounded-md flex items-center gap-2 text-blue-800 text-sm mb-4"><AlertTriangle className="w-4 h-4" /> 🎯 Match moyen ({application.compatibility}%) : Personnalisation forte requise</div>;
    return null;
  };

  // 2. Fonction Analyse IA (Restauration)
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const jobDescription = `
        Poste: ${application.poste}
        Entreprise: ${application.entreprise}
        Lieu: ${application.lieu}
        ${application.keywords ? `Compétences: ${application.keywords}` : ''}
        ${application.notes ? `Description: ${application.notes}` : ''}
        ${application.url ? `URL: ${application.url}` : ''}
      `.trim();

      const { data, error } = await supabase.functions.invoke('analyze-job-offer', {
        body: { jobDescription, url: application.url }
      });
      if (error) throw error;
      if (data) {
        onUpdate({
          ...data,
          analysisDate: new Date().toISOString()
        });
        toast.success("Analyse IA terminée ! Données mises à jour.");
      }
    } catch (error) {
      toast.error("Erreur lors de l'analyse IA");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Générateur de Super Prompt (Stratégie Canva/ChatGPT)
  const copySuperPrompt = () => {
    const prompt = `
    Agis comme un Expert Recrutement et Copywriter Senior.
    
    CONTEXTE :
    Je postule chez : ${application.entreprise}
    Poste : ${application.poste}
    Lieu : ${application.lieu}
    
    ANALYSE DU POSTE (Mots-clés détectés) :
    ${application.keywords || "À extraire de l'offre"}
    
    MON PROFIL (Points forts détectés) :
    ${application.matchingSkills || "Expérience pertinente en gestion de projet et coordination"}
    
    INSTRUCTIONS POUR LA LETTRE :
    Rédige une lettre de motivation structurée et percutante (Style Suisse Romande).
    1. Accroche : Storytelling sur l'alignement de valeurs.
    2. Corps : Preuves concrètes (STAR) liées aux mots-clés ci-dessus.
    3. Conclusion : Appel à l'action confiant.
    4. Ton : Professionnel, Engagé, mais Humain.
    `;
    navigator.clipboard.writeText(prompt);
    toast.success("✨ Super-Prompt copié ! Colle-le dans ChatGPT.");
  };

  const copyDesignBrief = () => {
     const brief = `
     POUR GEMINI/CANVA - BRIEF DESIGN :
     Crée un CV moderne "Executive".
     - Titre : ${application.poste}
     - Couleur accent : Bleu Marine ou couleur de ${application.entreprise}
     - Mettre en avant ces compétences : ${application.keywords}
     `;
     navigator.clipboard.writeText(brief);
     toast.success("🎨 Brief Design copié !");
  };

  return (
    <Card className="p-6 mb-4 hover:shadow-lg transition-all border-l-4 border-l-primary relative bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900">{application.poste}</h3>
          <p className="text-gray-600 font-medium">{application.entreprise} • {application.lieu}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-3 h-3" /> Deadline : <span className={`font-semibold ${daysUntil && daysUntil <= 3 ? 'text-red-600' : 'text-gray-700'}`}>{formattedDeadline}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={application.statut === 'soumise' ? "default" : "outline"}>{application.statut.toUpperCase()}</Badge>
            <Button variant="ghost" size="icon" onClick={onEdit} title="Modifier">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Supprimer">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          <span className="text-xs text-gray-400">Match: {application.compatibility || 0}%</span>
        </div>
      </div>

      {/* BANNIÈRE COACHING */}
      {getCoachingBanner()}

      {/* CONTENU & ACTIONS */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        
        {/* Intégration du Brief (Détails) */}
        <BriefCandidature application={application} />
        
        {/* BARRE D'OUTILS PRODUCTIVITÉ */}
        <div className="flex flex-wrap gap-2 mt-6 justify-end bg-gray-50 p-3 rounded-lg">
           
           {/* Bouton 0 : Voir l'annonce (TOUJOURS VISIBLE) */}
           <Button 
             variant="outline" 
             size="sm" 
             className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
             onClick={() => {
               if (application.url) {
                 window.open(application.url, '_blank', 'noopener,noreferrer');
               } else {
                 toast.warning("⚠️ Aucun lien enregistré pour cette offre. Modifiez l'offre pour en ajouter un.");
               }
             }}
           >
             <ExternalLink className="w-4 h-4" /> 👁️ Voir l'annonce
           </Button>
           
           {/* Bouton 1 : Analyse IA (Si données manquantes) */}
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={handleAnalyze} 
             disabled={isAnalyzing}
             className="text-gray-600 hover:text-primary hover:bg-primary/10"
           >
             {isAnalyzing ? <span className="animate-spin mr-2">⏳</span> : <Sparkles className="w-4 h-4 mr-2" />} 
             {application.keywords ? "Ré-analyser" : "Lancer Analyse IA"}
           </Button>

           {/* Bouton 2 : Copier Prompt ChatGPT */}
           <Button variant="outline" size="sm" onClick={copySuperPrompt} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
             <Copy className="w-4 h-4" /> Prompt ChatGPT
           </Button>

           {/* Bouton 3 : Copier Brief Canva */}
           <Button variant="outline" size="sm" onClick={copyDesignBrief} className="gap-2 border-pink-200 text-pink-700 hover:bg-pink-50">
             <FileText className="w-4 h-4" /> Brief Canva
           </Button>
           
           {/* Bouton 4 : Valider */}
           <Button size="sm" onClick={() => onUpdate({ statut: 'soumise' })} className="gap-2 ml-2">
             ✅ Marquer envoyée
           </Button>
        </div>
      </div>
    </Card>
  );
}
