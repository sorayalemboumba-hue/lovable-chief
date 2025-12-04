import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PersonalTask } from '@/types/personalTask';
import { CheckCircle, Circle, Plus, Trash2, Calendar as CalendarIcon, ExternalLink, Pencil } from 'lucide-react';
import { format, startOfDay, isEqual, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PersonalTaskManagerProps {
  tasks: PersonalTask[];
  onAddTask: (task: Omit<PersonalTask, 'id' | 'createdAt' | 'done'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<PersonalTask>) => void;
}

export function PersonalTaskManager({ tasks, onAddTask, onToggleTask, onDeleteTask, onUpdateTask }: PersonalTaskManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: undefined as Date | undefined,
    url: '',
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', deadline: undefined, url: '' });
    setEditingTask(null);
  };

  const openDialog = (task?: PersonalTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline ? parseISO(task.deadline) : undefined,
        url: task.url || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    const taskData = {
      title: formData.title,
      description: formData.description || undefined,
      deadline: formData.deadline?.toISOString().split('T')[0],
      url: formData.url || undefined,
    };

    if (editingTask && onUpdateTask) {
      onUpdateTask(editingTask.id, taskData);
    } else {
      onAddTask(taskData);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  // Trier: tâches non terminées en haut, terminées en bas
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    // Ensuite par deadline (les plus proches en premier)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const pendingTasks = sortedTasks.filter(t => !t.done);
  const completedTasks = sortedTasks.filter(t => t.done);

  // Comparaison de dates (jour uniquement, ignore l'heure)
  const getDeadlineStatus = (deadline: string) => {
    const today = startOfDay(new Date());
    const taskDate = startOfDay(parseISO(deadline));
    
    if (isEqual(taskDate, today)) return 'today';
    if (taskDate < today) return 'overdue';
    return 'future';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            Mes tâches personnelles
          </h2>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => openDialog()}>
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Modifier la tâche' : 'Ajouter une tâche'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Mettre à jour LinkedIn"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description / Notes</Label>
                  <Textarea
                    id="description"
                    placeholder="Détails supplémentaires..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                          !formData.deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? format(formData.deadline, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => setFormData({ ...formData, deadline: date })}
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
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.title.trim()}>
                  {editingTask ? 'Enregistrer' : 'Ajouter la tâche'}
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
                      onEdit={() => openDialog(task)}
                      getDeadlineStatus={getDeadlineStatus}
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
                      onEdit={() => openDialog(task)}
                      getDeadlineStatus={getDeadlineStatus}
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

interface TaskCardProps {
  task: PersonalTask;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  getDeadlineStatus: (deadline: string) => 'today' | 'overdue' | 'future';
}

function TaskCard({ task, onToggle, onDelete, onEdit, getDeadlineStatus }: TaskCardProps) {
  const deadlineStatus = task.deadline ? getDeadlineStatus(task.deadline) : null;
  
  return (
    <Card className={cn(
      "p-4 border transition-all",
      task.done && "bg-muted/30 opacity-70"
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox cliquable */}
        <Checkbox
          checked={task.done}
          onCheckedChange={onToggle}
          className="mt-1 h-5 w-5"
        />
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium",
            task.done && "line-through text-muted-foreground"
          )}>
            {task.title}
          </div>
          
          {task.description && (
            <p className={cn(
              "text-sm mt-1",
              task.done ? "text-muted-foreground/60" : "text-muted-foreground"
            )}>
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {task.deadline && (
              <span className={cn(
                "text-xs flex items-center gap-1 px-2 py-0.5 rounded-full",
                deadlineStatus === 'overdue' && "bg-destructive/10 text-destructive font-medium",
                deadlineStatus === 'today' && "bg-warning/10 text-warning font-medium",
                deadlineStatus === 'future' && "text-muted-foreground"
              )}>
                <CalendarIcon className="w-3 h-3" />
                {deadlineStatus === 'overdue' && '⚠️ '}
                {deadlineStatus === 'today' && "Aujourd'hui - "}
                {format(new Date(task.deadline + 'T00:00:00'), "d MMM yyyy", { locale: fr })}
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
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Modifier">
            <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} title="Supprimer">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
