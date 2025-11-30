import { useEffect, useState } from 'react';
import { Application } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bell, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface DeadlineNotificationsProps {
  applications: Application[];
}

interface DeadlineAlert {
  application: Application;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'info';
}

export function DeadlineNotifications({ applications }: DeadlineNotificationsProps) {
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(
    localStorage.getItem('last_deadline_check')
  );

  useEffect(() => {
    checkDeadlines();
    
    // Check every 6 hours
    const interval = setInterval(checkDeadlines, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [applications]);

  const checkDeadlines = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Don't show if already checked today
    if (lastCheck === today) return;

    const deadlineAlerts: DeadlineAlert[] = [];

    applications.forEach(app => {
      // Only check for active applications (not yet submitted)
      if (app.statut === 'soumise' || app.statut === 'entretien') return;

      const deadline = new Date(app.deadline);
      const diffTime = deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let urgency: 'critical' | 'warning' | 'info' | null = null;

      if (daysRemaining < 0) {
        urgency = 'critical'; // Deadline passed
      } else if (daysRemaining <= 2) {
        urgency = 'critical'; // Less than 2 days
      } else if (daysRemaining <= 7) {
        urgency = 'warning'; // Less than a week
      } else if (daysRemaining <= 14) {
        urgency = 'info'; // Less than 2 weeks
      }

      if (urgency) {
        deadlineAlerts.push({
          application: app,
          daysRemaining,
          urgency,
        });
      }
    });

    if (deadlineAlerts.length > 0) {
      setAlerts(deadlineAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining));
      setShowDialog(true);
      
      // Show toast for critical deadlines
      const criticalCount = deadlineAlerts.filter(a => a.urgency === 'critical').length;
      if (criticalCount > 0) {
        toast.error(`${criticalCount} deadline(s) critique(s) !`, {
          duration: 5000,
        });
      }
    }

    localStorage.setItem('last_deadline_check', today);
    setLastCheck(today);
  };

  const handleDismiss = () => {
    setShowDialog(false);
  };

  const getUrgencyColor = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'info':
        return 'bg-info/10 border-info/20 text-info';
    }
  };

  const getUrgencyBadge = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground">Attention</Badge>;
      case 'info':
        return <Badge variant="secondary">Bientôt</Badge>;
    }
  };

  const formatDaysRemaining = (days: number) => {
    if (days < 0) return 'Deadline dépassée';
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    return `Dans ${days} jours`;
  };

  if (alerts.length === 0) return null;

  return (
    <>
      {/* Notification Badge in header */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDialog(true)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full">
            {alerts.length}
          </span>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Alertes deadlines
            </DialogTitle>
            <DialogDescription>
              {alerts.length} offre(s) avec des deadlines approchantes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getUrgencyColor(alert.urgency)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getUrgencyBadge(alert.urgency)}
                      <span className="text-sm font-medium">
                        {formatDaysRemaining(alert.daysRemaining)}
                      </span>
                    </div>
                    <h4 className="font-semibold truncate">{alert.application.poste}</h4>
                    <p className="text-sm opacity-90 truncate">
                      {alert.application.entreprise} • {alert.application.lieu}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      Deadline: {new Date(alert.application.deadline).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={handleDismiss}>
              Compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
