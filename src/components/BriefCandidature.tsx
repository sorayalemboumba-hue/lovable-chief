import { Application } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Mail, Linkedin, Globe, Building2 } from "lucide-react";

interface BriefCandidatureProps {
  application: Application;
  onUpdate?: (updates: Partial<Application>) => void;
}

export function BriefCandidature({ application }: BriefCandidatureProps) {
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

  return (
    <div className="space-y-3">
      {/* Canal détecté */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Canal :</span>
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <ChannelIcon className="w-3.5 h-3.5" />
          {channel.label}
        </Badge>
      </div>

      {/* Contact / Lien */}
      {application.applicationEmail && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Contact :</span>
          <a 
            href={`mailto:${application.applicationEmail}`}
            className="text-sm text-primary hover:underline font-medium"
          >
            {application.applicationEmail}
          </a>
        </div>
      )}

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
    </div>
  );
}
