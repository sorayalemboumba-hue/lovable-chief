import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { PersonalTask } from '@/types/personalTask';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, Briefcase, CheckSquare } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getDaysUntil } from '@/lib/dateUtils';

interface WeekCalendarViewProps {
  applications: Application[];
  tasks: PersonalTask[];
}

interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  type: 'deadline' | 'task';
  date: Date;
  isUrgent: boolean;
  isOverdue: boolean;
  description?: string;
  url?: string;
  done?: boolean;
}

export function WeekCalendarView({ applications, tasks }: WeekCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const previousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Comparaison stricte YYYY-MM-DD (ignore timezone)
  const isSameDayStrict = (dateStr: string, compareDate: Date): boolean => {
    const targetStr = dateStr.split('T')[0]; // YYYY-MM-DD
    const compareStr = format(compareDate, 'yyyy-MM-dd');
    return targetStr === compareStr;
  };

  // Build events from applications and tasks
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const dateStr = format(date, 'yyyy-MM-dd');

    // Add application deadlines
    applications.forEach(app => {
      if (!app.deadline) return;
      if (isSameDayStrict(app.deadline, date)) {
        const days = getDaysUntil(app.deadline);
        events.push({
          id: app.id,
          title: app.entreprise,
          subtitle: app.poste,
          type: 'deadline',
          date: new Date(app.deadline + 'T12:00:00'), // Force midi pour éviter décalage
          isUrgent: days <= 3 && days >= 0,
          isOverdue: days < 0,
          url: app.url || undefined,
        });
      }
    });

    // Add personal tasks
    tasks.forEach(task => {
      if (!task.deadline) return;
      if (isSameDayStrict(task.deadline, date)) {
        events.push({
          id: task.id,
          title: task.title,
          subtitle: task.description || '',
          type: 'task',
          date: new Date(task.deadline + 'T12:00:00'), // Force midi
          isUrgent: false,
          isOverdue: false,
          description: task.description,
          url: task.url,
          done: task.done,
        });
      }
    });

    return events;
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Agenda Semaine
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-lg font-semibold">
            {format(currentWeekStart, "d MMM", { locale: fr })} - {format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: fr })}
          </span>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Headers */}
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={`text-center p-2 rounded-t-lg ${
                  isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <div className="text-xs font-medium">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className={`text-lg font-bold ${isToday ? '' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}

          {/* Day columns */}
          {weekDays.map((day, i) => {
            const events = getEventsForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={`col-${i}`}
                className={`min-h-[200px] p-2 border rounded-b-lg ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="space-y-1">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        event.type === 'deadline'
                          ? event.isOverdue
                            ? 'bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30'
                            : event.isUrgent
                            ? 'bg-warning/20 text-warning-foreground border border-warning/30 hover:bg-warning/30'
                            : 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
                          : event.done
                          ? 'bg-muted text-muted-foreground line-through border border-border hover:bg-muted/80'
                          : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                      }`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.subtitle && (
                        <div className="truncate opacity-80">{event.subtitle}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 border-2">
        <h3 className="font-semibold mb-3">Légende</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30" />
            <span className="text-sm">Deadline en retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning/20 border border-warning/30" />
            <span className="text-sm">Deadline urgente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/20" />
            <span className="text-sm">Deadline à venir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/10 border border-primary/20" />
            <span className="text-sm">Tâche personnelle</span>
          </div>
        </div>
      </Card>

      {/* Event details dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.type === 'deadline' ? (
                <Briefcase className="w-5 h-5 text-destructive" />
              ) : (
                <CheckSquare className="w-5 h-5 text-primary" />
              )}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div>
                <span className="text-sm font-medium">Type : </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  selectedEvent.type === 'deadline' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {selectedEvent.type === 'deadline' ? 'Deadline candidature' : 'Tâche personnelle'}
                </span>
              </div>
              
              {selectedEvent.subtitle && (
                <div>
                  <span className="text-sm font-medium">
                    {selectedEvent.type === 'deadline' ? 'Poste : ' : 'Notes : '}
                  </span>
                  <span className="text-sm text-muted-foreground">{selectedEvent.subtitle}</span>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium">Date : </span>
                <span className="text-sm text-muted-foreground">
                  {format(selectedEvent.date, "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </div>
              
              {selectedEvent.url && (
                <div>
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir le lien
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
