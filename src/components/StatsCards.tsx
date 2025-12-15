import { Card } from '@/components/ui/card';
import { Application } from '@/types/application';
import { Briefcase, AlertTriangle, Target, TrendingUp, Send } from 'lucide-react';
import { getDaysUntil } from '@/lib/dateUtils';

interface StatsCardsProps {
  applications: Application[];
}

export function StatsCards({ applications }: StatsCardsProps) {
  // Offres Sourcées = total importé
  const totalSourced = applications.length;
  
  // Dossiers Envoyés = statut 'soumise' ou 'entretien'
  const totalSent = applications.filter(app => app.statut === 'soumise' || app.statut === 'entretien').length;
  
  // Deadlines urgentes
  const urgent = applications.filter(app => {
    const days = getDaysUntil(app.deadline);
    return days <= 3 && days >= 0;
  }).length;
  
  // Compatibilité moyenne
  const appsWithCompatibility = applications.filter(app => app.compatibility && app.compatibility > 0);
  const avgCompatibility = appsWithCompatibility.length > 0
    ? Math.round(appsWithCompatibility.reduce((sum, app) => sum + (app.compatibility || 0), 0) / appsWithCompatibility.length)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Offres Sourcées</p>
            <p className="text-3xl font-bold">{totalSourced}</p>
          </div>
          <div className="p-3 bg-primary/20 rounded-lg">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>
      
      <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-success mb-1">Dossiers Envoyés</p>
            <p className="text-3xl font-bold">{totalSent}</p>
          </div>
          <div className="p-3 bg-success/20 rounded-lg">
            <Send className="w-6 h-6 text-success" />
          </div>
        </div>
      </Card>
      
      <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-destructive mb-1">Deadlines urgentes</p>
            <p className="text-3xl font-bold">{urgent}</p>
          </div>
          <div className="p-3 bg-destructive/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
        </div>
      </Card>
      
      <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent mb-1">Compatibilité moyenne</p>
            <p className="text-3xl font-bold">{avgCompatibility}%</p>
          </div>
          <div className="p-3 bg-accent/20 rounded-lg">
            <Target className="w-6 h-6 text-accent" />
          </div>
        </div>
      </Card>
    </div>
  );
}
