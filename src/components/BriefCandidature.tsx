import { Application } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Globe, Building2, Copy, Check, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BriefCandidatureProps {
  application: Application;
  onUpdate?: (updates: Partial<Application>) => void;
}

export function BriefCandidature({ application }: BriefCandidatureProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Détection du canal de candidature
  const getChannel = () => {
    const url = application.url?.toLowerCase() || '';
    const instructions = application.applicationInstructions?.toLowerCase() || '';
    const email = application.applicationEmail;

    if (email) return { type: 'email', label: 'Email direct', icon: Mail };
    if (url.includes('linkedin') || url.includes('jobup')) return { type: 'linkedin', label: 'LinkedIn / JobUp', icon: Linkedin };
    if (url.includes('indeed') || url.includes('jobs.ch') || instructions.includes('portail')) return { type: 'portal', label: 'Portail ATS', icon: Building2 };
    if (url) return { type: 'web', label: 'Site web', icon: Globe };
    return { type: 'unknown', label: 'Non défini', icon: Globe };
  };

  const channel = getChannel();
  const ChannelIcon = channel.icon;

  const handleCopyEmail = async () => {
    if (application.applicationEmail) {
      await navigator.clipboard.writeText(application.applicationEmail);
      setCopiedEmail(true);
      toast.success("Email copié !");
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const hasAnalysisData = application.matchingSkills?.length || 
                          application.missingRequirements?.length || 
                          application.requiredDocuments?.length ||
                          application.compatibility !== undefined;

  return (
    <div className="space-y-4">
      {/* Canal détecté */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Canal :</span>
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <ChannelIcon className="w-3.5 h-3.5" />
          {channel.label}
        </Badge>
        {application.ats_compliant === false && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            ⚠️ ATS non standard
          </Badge>
        )}
      </div>

      {/* Contact / Email avec bouton copie */}
      {application.applicationEmail && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Contact :</span>
          <div className="flex items-center gap-2">
            <a 
              href={`mailto:${application.applicationEmail}`}
              className="text-sm text-primary hover:underline font-medium"
            >
              {application.applicationEmail}
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleCopyEmail}
            >
              {copiedEmail ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Lien URL */}
      {application.url && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Lien :</span>
          <a 
            href={application.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline font-medium truncate max-w-[250px]"
          >
            {application.url}
          </a>
        </div>
      )}

      {/* Compatibilité */}
      {application.compatibility !== null && application.compatibility !== undefined && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Match :</span>
          <Badge 
            variant={application.compatibility >= 70 ? "default" : "outline"}
            className={application.compatibility >= 70 ? "bg-green-600" : ""}
          >
            {application.compatibility}%
          </Badge>
        </div>
      )}

      {/* Documents requis - Checklist */}
      {application.requiredDocuments && application.requiredDocuments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Documents requis :</span>
          </div>
          <ul className="ml-6 space-y-1">
            {application.requiredDocuments.map((doc, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions de candidature */}
      {application.applicationInstructions && (
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Instructions :</strong> {application.applicationInstructions}
          </p>
        </div>
      )}

      {/* SECTION ANALYSE COMPÉTENCES */}
      {hasAnalysisData && (
        <div className="border-t pt-4 mt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Analyse Compétences
            </span>
          </div>

          {/* Atouts (Matching Skills) */}
          {application.matchingSkills && application.matchingSkills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Vos Atouts</span>
              </div>
              <div className="flex flex-wrap gap-1.5 ml-5">
                {application.matchingSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ✅ {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Points à renforcer (Missing Requirements) */}
          {application.missingRequirements && application.missingRequirements.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Points à renforcer</span>
              </div>
              <div className="flex flex-wrap gap-1.5 ml-5">
                {application.missingRequirements.map((req, index) => (
                  <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    ⚠️ {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message si pas de données d'analyse */}
      {!hasAnalysisData && (
        <div className="text-center py-3 text-sm text-muted-foreground italic border-t mt-4">
          <Sparkles className="w-4 h-4 inline mr-1.5 opacity-50" />
          En attente d'analyse IA...
        </div>
      )}
    </div>
  );
}
