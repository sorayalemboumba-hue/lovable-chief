import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { BriefCandidature } from "./BriefCandidature";
import { formatDateDisplay, getDaysUntil } from "@/lib/dateUtils";
import { 
  AlertTriangle, Clock, Ban, ExternalLink, Sparkles, Copy, FileText, 
  Edit, Trash2, X, CalendarPlus, Mail, FormInput, Zap, HelpCircle,
  User, Globe
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ApplicationCardProps {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateCV?: () => void;
  onGenerateLetter?: () => void;
  onUpdate: (updates: Partial<Application>) => void;
  isArchived?: boolean;
}

export function ApplicationCard({ application, onEdit, onDelete, onUpdate, isArchived }: ApplicationCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [showDeadlineInput, setShowDeadlineInput] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");

  // Date calculations
  const daysUntil = application.deadline ? getDaysUntil(application.deadline) : null;
  const formattedDeadline = formatDateDisplay(application.deadline || '');
  const isExpired = application.isExpired || (daysUntil !== null && daysUntil < 0);
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 2;
  const deadlineMissing = application.deadlineMissing || !application.deadline;

  // Application method icon
  const getMethodIcon = () => {
    switch (application.applicationMethod) {
      case 'Email': return <Mail className="w-3 h-3" />;
      case 'Formulaire': return <FormInput className="w-3 h-3" />;
      case 'Simplifiée': return <Zap className="w-3 h-3" />;
      default: return <HelpCircle className="w-3 h-3" />;
    }
  };

  // Language flag
  const getLanguageFlag = () => {
    switch (application.language) {
      case 'Français': return '🇫🇷';
      case 'Anglais': return '🇬🇧';
      case 'Allemand': return '🇩🇪';
      default: return '🌐';
    }
  };

  const getCoachingBanner = () => {
    if (application.excluded) {
      return (
        <div className="bg-red-100 p-3 rounded-md flex items-center gap-2 text-red-800 font-bold mb-4">
          <Ban className="w-5 h-5" /> ⛔ OFFRE EXCLUE : {application.exclusion_reason}
        </div>
      );
    }
    if (isUrgent && !isExpired) {
      return (
        <div className="bg-orange-100 p-3 rounded-md flex items-center gap-2 text-orange-800 font-bold mb-4">
          <Clock className="w-5 h-5" /> ⚡ URGENT {daysUntil === 0 ? "AUJOURD'HUI" : `J-${daysUntil}`} : Bloquer 30min maintenant !
        </div>
      );
    }
    if ((application.compatibility ?? 100) < 70) {
      return (
        <div className="bg-blue-50 p-3 rounded-md flex items-center gap-2 text-blue-800 text-sm mb-4">
          <AlertTriangle className="w-4 h-4" /> 🎯 Match moyen ({application.compatibility}%) : Personnalisation forte requise
        </div>
      );
    }
    return null;
  };

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

  const generateChatGPTPrompt = () => {
    return `🔴 BRIEFING MISSION POUR LE GPT "RÉDACTEUR SORAYA" :

► CONTEXTE DE L'OFFRE :
- Poste visé : ${application.poste}
- Entreprise : ${application.entreprise}
- Lieu : ${application.lieu}

► ANALYSE STRATÉGIQUE (Données SoSoFlow) :
- Mots-clés impératifs (ATS) : ${application.keywords || "À extraire de l'offre"}
- Mes Atouts majeurs : ${application.matchingSkills || "Mon expérience en gestion de projet et coordination"}
- ⚠️ Points de Vigilance (Gaps à combler) : ${application.missingRequirements?.join(', ') || "Aucun gap majeur détecté"}

► ORDRE DE MISSION :
Rédige une lettre de motivation "Executive" et un Profil CV sur-mesure.
Stratégie : Utilise mon style (Storytelling engagé) et appuie sur mes atouts pour compenser les points de vigilance cités ci-dessus.`;
  };

  const generateCanvaBrief = () => {
    return `🎨 KIT D'ASSEMBLAGE POUR CANVA (Copier-Coller) :

1. TITRE DU POSTE (En haut, Vert Sauge) :
${application.poste ? application.poste.toUpperCase() : "TITRE DU POSTE"}

2. SOUS-TITRE (Contexte) :
${application.entreprise} | ${application.lieu}

3. MOTS-CLÉS À METTRE EN GRAS (Section Compétences) :
${application.keywords || "Gestion de projet, Coordination, Communication"}

4. NOM DU FICHIER EXPORT :
CV_Soraya_Koite_${application.entreprise ? application.entreprise.replace(/\s+/g, '_') : 'Candidature'}_${new Date().getFullYear()}.pdf`;
  };

  const openChatGPTPreview = () => {
    setPreviewTitle("📋 Briefing ChatGPT");
    setPreviewContent(generateChatGPTPrompt());
  };

  const openCanvaPreview = () => {
    setPreviewTitle("🎨 Kit Design Canva");
    setPreviewContent(generateCanvaBrief());
  };

  const copyAndClose = () => {
    if (previewContent) {
      navigator.clipboard.writeText(previewContent);
      toast.success("✅ Copié dans le presse-papier !");
      setPreviewContent(null);
    }
  };

  const handleAddDeadline = () => {
    if (newDeadline) {
      onUpdate({ 
        deadline: newDeadline, 
        deadlineMissing: false 
      });
      setShowDeadlineInput(false);
      setNewDeadline("");
      toast.success("✅ Deadline ajoutée !");
    }
  };

  // Helper: Check if title is a URL (starts with http)
  const displayTitle = application.poste?.startsWith('http') ? '' : application.poste;
  const hasValidTitle = displayTitle && displayTitle.trim() !== '';
  
  // Helper: Check if location is valid (not placeholder)
  const placeholderLocations = ['à déterminer', 'inconnu', 'unknown', 'n/a', 'tbd', ''];
  const hasValidLocation = application.lieu && !placeholderLocations.includes(application.lieu.toLowerCase().trim());
  
  // Helper: Check if company is valid
  const hasValidCompany = application.entreprise && application.entreprise.trim() !== '';
  
  // Check if any required field is incomplete
  const isIncomplete = !hasValidTitle || !hasValidCompany;

  return (
    <>
      <Card className={`p-6 mb-4 hover:shadow-lg transition-all border-l-4 relative ${
        isArchived
          ? 'border-l-gray-300 bg-gray-100/80 opacity-60'
          : isExpired 
            ? 'border-l-gray-400 bg-gray-50 opacity-75' 
            : isUrgent 
              ? 'border-l-red-500 bg-red-50/30' 
              : 'border-l-primary bg-white'
      }`}>
        {/* HEADER - LinkedIn Style (Company first, then Title) */}
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            {/* Line 1: Company Name (Small, Bold, Dark Gray) - Only if valid */}
            {hasValidCompany && (
              <p className={`text-xs font-bold uppercase tracking-wider ${isExpired ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                {application.entreprise}
              </p>
            )}
            
            {/* Line 2: Job Title (Large, Black, prominent) */}
            <h3 className={`text-xl font-bold leading-tight ${isExpired ? 'text-muted-foreground/70' : 'text-foreground'}`}>
              {hasValidTitle ? displayTitle : <span className="text-destructive/70 italic">Titre à compléter</span>}
            </h3>
            
            {/* Line 3: Location - Only if valid (empty if placeholder) */}
            {hasValidLocation && (
              <p className={`text-sm ${isExpired ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                📍 {application.lieu}
              </p>
            )}
            
            {/* Deadline display with alerts */}
            <div className="flex items-center gap-2 text-sm mt-2">
              <Clock className="w-3 h-3 text-gray-400" />
              
              {/* ALERT: Expired */}
              {isExpired && (
                <Badge variant="secondary" className="bg-gray-200 text-gray-600 gap-1">
                  Expirée
                </Badge>
              )}
              
              {/* ALERT: Urgent (J-1 or Today) */}
              {isUrgent && !isExpired && (
                <Badge variant="destructive" className="gap-1 animate-pulse">
                  ⚠️ {daysUntil === 0 ? "Aujourd'hui" : daysUntil === 1 ? "J-1" : `J-${daysUntil}`}
                </Badge>
              )}
              
              {/* ALERT: Missing deadline - RED visible button */}
              {deadlineMissing && !isExpired && (
                <>
                  {showDeadlineInput ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="h-8 w-40 text-sm border-destructive"
                      />
                      <Button size="sm" variant="default" onClick={handleAddDeadline} className="h-8 px-3">
                        ✓ OK
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowDeadlineInput(false)} className="h-8 px-2">
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-7 text-xs gap-1 font-bold shadow-md"
                      onClick={() => setShowDeadlineInput(true)}
                    >
                      <CalendarPlus className="w-4 h-4" />
                      ⚠️ Définir date
                    </Button>
                  )}
                </>
              )}
              
              {/* Normal deadline display */}
              {!deadlineMissing && !isUrgent && !isExpired && (
                <span className="text-gray-700 font-semibold">{formattedDeadline}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {/* Badge "À COMPLÉTER" if incomplete */}
              {isIncomplete && (
                <Badge variant="destructive" className="bg-orange-500 text-white text-xs">
                  ⚠️ À COMPLÉTER
                </Badge>
              )}
              <Badge variant={application.statut === 'soumise' ? "default" : "outline"}>
                {application.statut.toUpperCase()}
              </Badge>
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

        {/* NEW: Required Documents & Application Method Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Required Documents */}
          {application.requiredDocuments && application.requiredDocuments.length > 0 && (
            application.requiredDocuments.map((doc, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                📄 {doc}
              </Badge>
            ))
          )}
          
          {/* Application Method */}
          {application.applicationMethod && application.applicationMethod !== 'Inconnu' && (
            <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700 gap-1">
              {getMethodIcon()} {application.applicationMethod}
            </Badge>
          )}
        </div>

        {/* BANNIÈRE COACHING */}
        {getCoachingBanner()}

        {/* CONTENU & ACTIONS */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <BriefCandidature application={application} />
          
          {/* NEW: Contact & Language Footer */}
          <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {application.contactPerson && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {application.contactPerson}
                </span>
              )}
              {application.language && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {getLanguageFlag()} {application.language}
                </span>
              )}
            </div>
            {application.sourceUrl && (
              <a 
                href={application.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Source
              </a>
            )}
          </div>
          
          {/* BARRE D'OUTILS PRODUCTIVITÉ */}
          <div className="flex flex-wrap gap-2 mt-6 justify-end bg-gray-50 p-3 rounded-lg">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => {
                const url = application.sourceUrl || application.url;
                if (url) {
                  window.open(url, '_blank', 'noopener,noreferrer');
                } else {
                  toast.warning("⚠️ Aucun lien enregistré pour cette offre. Modifiez l'offre pour en ajouter un.");
                }
              }}
            >
              <ExternalLink className="w-4 h-4" /> 👁️ Voir l'annonce
            </Button>
            
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

            <Button variant="outline" size="sm" onClick={openChatGPTPreview} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Copy className="w-4 h-4" /> Prompt ChatGPT
            </Button>

            <Button variant="outline" size="sm" onClick={openCanvaPreview} className="gap-2 border-pink-200 text-pink-700 hover:bg-pink-50">
              <FileText className="w-4 h-4" /> Brief Canva
            </Button>
            
            <Button size="sm" onClick={() => onUpdate({ statut: 'soumise' })} className="gap-2 ml-2">
              ✅ Marquer envoyée
            </Button>
          </div>
        </div>
      </Card>

      {/* MODALE DE PRÉVISUALISATION */}
      <Dialog open={previewContent !== null} onOpenChange={(open) => !open && setPreviewContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="my-4">
            <Textarea 
              value={previewContent || ""} 
              readOnly 
              className="min-h-[300px] font-mono text-sm bg-muted/50 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewContent(null)}>
              <X className="w-4 h-4 mr-2" /> Fermer
            </Button>
            <Button onClick={copyAndClose} className="gap-2">
              <Copy className="w-4 h-4" /> Copier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
