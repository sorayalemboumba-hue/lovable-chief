import { Application } from '@/types/application';
import { calculateCompatibility } from '@/lib/compatibilityCalculator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface CompatibilityBadgeProps {
  application: Application;
}

export function CompatibilityBadge({ application }: CompatibilityBadgeProps) {
  // Use AI-analyzed compatibility if available, otherwise fallback to local calculation
  const hasAIAnalysis = application.compatibility !== undefined && application.compatibility !== null;
  
  const aiResult = hasAIAnalysis ? {
    score: application.compatibility!,
    matchingSkills: application.matchingSkills || [],
    missingRequirements: application.missingRequirements || [],
    recommendation: application.compatibility! >= 80 ? 'excellent' as const :
                    application.compatibility! >= 70 ? 'good' as const :
                    application.compatibility! >= 60 ? 'fair' as const : 'low' as const,
    shouldApply: application.compatibility! >= 60
  } : null;
  
  const localResult = !hasAIAnalysis ? calculateCompatibility(application) : null;
  const result = aiResult || localResult!;
  
  const getIcon = () => {
    switch (result.recommendation) {
      case 'excellent':
        return <CheckCircle className="w-3 h-3" />;
      case 'good':
        return <TrendingUp className="w-3 h-3" />;
      case 'fair':
        return <TrendingUp className="w-3 h-3" />;
      case 'low':
        return <TrendingDown className="w-3 h-3" />;
    }
  };
  
  const getVariant = () => {
    if (result.score >= 80) return 'default';
    if (result.score >= 70) return 'secondary';
    if (result.score >= 60) return 'outline';
    return 'destructive';
  };
  
  const getColor = () => {
    if (result.score >= 80) return 'text-green-600 dark:text-green-400';
    if (result.score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (result.score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge variant={getVariant()} className="gap-1 cursor-help">
          {getIcon()}
          <span className={getColor()}>{result.score}%</span>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              Compatibilité: {result.score}%
              {!result.shouldApply && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </h4>
            {!result.shouldApply && (
              <p className="text-sm text-destructive mb-2">
                ⚠️ Compatibilité faible - Reconsidérer cette candidature
              </p>
            )}
          </div>
          
          {result.matchingSkills.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">✅ Compétences correspondantes:</h5>
              <div className="flex flex-wrap gap-1">
                {result.matchingSkills.map((skill, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {result.missingRequirements.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">📋 Pré-requis à vérifier:</h5>
              <ul className="text-xs space-y-0.5">
                {result.missingRequirements.map((req, i) => (
                  <li key={i} className="text-muted-foreground">• {req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
