import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PersonalTask } from '@/types/personalTask';
import { CheckCircle, Circle, Plus, Trash2, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PersonalTaskManagerProps {
  tasks: PersonalTask[];
  onAddTask: (task: Omit<PersonalTask, 'id' | 'createdAt' | 'done'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function PersonalTaskManager({ tasks, onAddTask, onToggleTask, onDeleteTask }: PersonalTaskManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: undefined as Date | undefined,
    url: '',
  });

  const handleSubmit = () => {
    if (!newTask.title.trim()) return;
    
    onAddTask({
      title: newTask.title,
      description: newTask.description || undefined,
      deadline: newTask.deadline?.toISOString().split('T')[0],
      url: newTask.url || undefined,
    });
    
    setNewTask({ title: '', description: '', deadline: undefined, url: '' });
    setIsDialogOpen(false);
  };

  const pendingTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            Mes tâches personnelles
          </h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une tâche</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Mettre à jour LinkedIn"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description / Notes</Label>
                  <Textarea
                    id="description"
                    placeholder="Détails supplémentaires..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Date limite</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTask.deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTask.deadline ? format(newTask.deadline, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTask.deadline}
                        onSelect={(date) => setNewTask({ ...newTask, deadline: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">Lien / URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://..."
                    value={newTask.url}
                    onChange={(e) => setNewTask({ ...newTask, url: e.target.value })}
                  />
                </div>
                
                <Button onClick={handleSubmit} className="w-full" disabled={!newTask.title.trim()}>
                  Ajouter la tâche
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune tâche personnelle</p>
            <p className="text-sm">Cliquez sur "Nouvelle tâche" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Circle className="w-4 h-4 text-warning" />
                  À faire ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleTask(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {completedTasks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Terminées ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleTask(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete }: { task: PersonalTask; onToggle: () => void; onDelete: () => void }) {
  return (
    <Card className={cn("p-4 border", task.done && "bg-muted/30")}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
          {task.done ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className={cn("font-medium", task.done && "line-through text-muted-foreground")}>
            {task.title}
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {task.deadline && (
              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                <CalendarIcon className="w-3 h-3" />
                {format(new Date(task.deadline), "d MMM yyyy", { locale: fr })}
              </span>
            )}
            
            {task.url && (
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Lien
              </a>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
