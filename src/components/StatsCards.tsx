import { Application } from '@/types/application';
import { Card } from '@/components/ui/card';
import { Target, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  applications: Application[];
}

export function StatsCards({ applications }: StatsCardsProps) {
  const total = applications.length;
  const completed = applications.filter(a => a.statut === 'soumise' || a.statut === 'entretien').length;
  const inProgress = applications.filter(a => a.statut === 'en cours').length;
  const toComplete = applications.filter(a => a.statut === 'à compléter').length;

  const stats = [
    { 
      label: 'Total candidatures', 
      value: total, 
      icon: Target, 
      gradient: 'from-primary to-primary/70',
      bgColor: 'bg-primary/10'
    },
    { 
      label: 'En cours', 
      value: inProgress, 
      icon: Clock, 
      gradient: 'from-accent to-accent/70',
      bgColor: 'bg-accent/10'
    },
    { 
      label: 'À compléter', 
      value: toComplete, 
      icon: TrendingUp, 
      gradient: 'from-warning to-warning/70',
      bgColor: 'bg-warning/10'
    },
    { 
      label: 'Soumises', 
      value: completed, 
      icon: CheckCircle, 
      gradient: 'from-success to-success/70',
      bgColor: 'bg-success/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={`p-6 ${stat.bgColor} border-2 hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
