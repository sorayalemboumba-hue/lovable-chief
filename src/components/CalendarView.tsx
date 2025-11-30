import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Application } from '@/types/application';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDate, getDaysUntil } from '@/lib/dateUtils';

interface CalendarViewProps {
  applications: Application[];
}

export function CalendarView({ applications }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getApplicationsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return applications.filter(app => app.deadline === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Calendrier des deadlines
          </h2>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayApplications = getApplicationsForDate(day);
            const hasDeadlines = dayApplications.length > 0;
            const isTodayDate = isToday(day);

            return (
              <Card
                key={day}
                className={`p-3 min-h-[100px] relative ${
                  isTodayDate ? 'border-2 border-primary bg-primary/5' : 'border'
                } ${hasDeadlines ? 'bg-accent/5' : ''}`}
              >
                <div className={`text-sm font-semibold mb-2 ${isTodayDate ? 'text-primary' : ''}`}>
                  {day}
                </div>
                {hasDeadlines && (
                  <div className="space-y-1">
                    {dayApplications.map(app => {
                      const days = getDaysUntil(app.deadline);
                      const isUrgent = days <= 3 && days >= 0;
                      const isOverdue = days < 0;
                      
                      return (
                        <div
                          key={app.id}
                          className={`text-xs p-1 rounded truncate ${
                            isOverdue ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                            isUrgent ? 'bg-warning/10 text-warning border border-warning/20' :
                            'bg-success/10 text-success border border-success/20'
                          }`}
                          title={`${app.poste} - ${app.entreprise}`}
                        >
                          {app.entreprise}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 border-2">
        <h3 className="font-semibold mb-4">Légende</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/20" />
            <span className="text-sm">En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning/10 border border-warning/20" />
            <span className="text-sm">Urgent (≤3 jours)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/10 border border-success/20" />
            <span className="text-sm">À venir</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
