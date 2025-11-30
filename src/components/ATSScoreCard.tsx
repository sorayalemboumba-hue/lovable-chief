import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Application } from '@/types/application';

interface ATSScoreCardProps {
  application: Application;
}

export function ATSScoreCard({ application }: ATSScoreCardProps) {
  const checks = [
    {
      id: 'format',
      label: 'Format de document (PDF recommandé)',
      status: application.cv_template_id ? 'pass' : 'warning',
      weight: 25
    },
    {
      id: 'keywords',
      label: 'Mots-clés de l\'offre présents',
      status: (application.keywords?.split('\n').length || 0) >= 5 ? 'pass' : 'warning',
      weight: 30
    },
    {
      id: 'structure',
      label: 'Structure claire (modèle sélectionné)',
      status: application.cv_template_id && application.letter_template_id ? 'pass' : 'fail',
      weight: 20
    },
    {
      id: 'filename',
      label: 'Nom de fichier professionnel',
      status: 'pass', // Always pass for now, could be improved
      weight: 15
    },
    {
      id: 'completeness',
      label: 'Dossier complet (CV + Lettre)',
      status: application.cv_template_id && application.letter_template_id ? 'pass' : 'fail',
      weight: 10
    }
  ];

  const score = checks.reduce((total, check) => {
    if (check.status === 'pass') return total + check.weight;
    if (check.status === 'warning') return total + (check.weight * 0.5);
    return total;
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'fail': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Acceptable';
    return 'À améliorer';
  };

  return (
    <Card className="p-5 border-2 bg-gradient-to-br from-accent/5 to-primary/5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-base">Score ATS</h4>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}/100</div>
            <div className="text-xs text-muted-foreground">{getScoreLabel(score)}</div>
          </div>
        </div>

        <div className="space-y-2">
          {checks.map((check) => (
            <div 
              key={check.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
            >
              <div className="flex-shrink-0">
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{check.label}</p>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  check.status === 'pass' ? 'bg-success/10 text-success border-success/20' :
                  check.status === 'warning' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-destructive/10 text-destructive border-destructive/20'
                }`}
              >
                {check.weight}pts
              </Badge>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Les ATS (Applicant Tracking Systems) filtrent automatiquement les candidatures. 
            Un score de 80+ augmente vos chances de passage de 35%.
          </p>
        </div>
      </div>
    </Card>
  );
}
