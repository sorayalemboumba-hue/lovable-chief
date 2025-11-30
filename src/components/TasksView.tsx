import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Application, Action } from '@/types/application';
import { CheckCircle, Circle, Plus, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface TasksViewProps {
  applications: Application[];
  onUpdateApplication: (id: string, updates: Partial<Application>) => void;
}

export function TasksView({ applications, onUpdateApplication }: TasksViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(
    applications.length > 0 ? applications[0].id : null
  );

  const selectedApp = applications.find(app => app.id === selectedApplicationId);

  const handleAddTask = () => {
    if (!selectedApp || !newTaskTitle.trim()) return;

    const newTask: Action = {
      id: Date.now().toString(),
      title: newTaskTitle,
      done: false,
    };

    const updatedActions = [...(selectedApp.actions || []), newTask];
    onUpdateApplication(selectedApp.id, { actions: updatedActions });
    setNewTaskTitle('');
    toast.success('Tâche ajoutée');
  };

  const handleToggleTask = (taskId: string) => {
    if (!selectedApp) return;

    const updatedActions = (selectedApp.actions || []).map(action =>
      action.id === taskId ? { ...action, done: !action.done } : action
    );
    onUpdateApplication(selectedApp.id, { actions: updatedActions });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedApp) return;

    const updatedActions = (selectedApp.actions || []).filter(action => action.id !== taskId);
    onUpdateApplication(selectedApp.id, { actions: updatedActions });
    toast.success('Tâche supprimée');
  };

  const allTasks = applications.flatMap(app => 
    (app.actions || []).map(action => ({
      ...action,
      applicationId: app.id,
      applicationName: `${app.poste} - ${app.entreprise}`
    }))
  );

  const pendingTasks = allTasks.filter(task => !task.done);
  const completedTasks = allTasks.filter(task => task.done);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-primary" />
          Gestion des tâches
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-semibold mb-3">Candidatures</h3>
            <div className="space-y-2">
              {applications.map(app => {
                const taskCount = (app.actions || []).length;
                const doneCount = (app.actions || []).filter(a => a.done).length;
                
                return (
                  <Card
                    key={app.id}
                    className={`p-3 cursor-pointer border transition-all ${
                      selectedApplicationId === app.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedApplicationId(app.id)}
                  >
                    <div className="font-medium text-sm truncate">{app.poste}</div>
                    <div className="text-xs text-muted-foreground truncate">{app.entreprise}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {taskCount > 0 ? `${doneCount}/${taskCount} tâches` : 'Aucune tâche'}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">
                    Tâches pour {selectedApp.poste}
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nouvelle tâche..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <Button onClick={handleAddTask} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(selectedApp.actions || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune tâche pour cette candidature
                    </div>
                  ) : (
                    (selectedApp.actions || []).map(action => (
                      <Card key={action.id} className="p-3 border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => handleToggleTask(action.id)}
                              className="flex-shrink-0"
                            >
                              {action.done ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                            <span className={`${action.done ? 'line-through text-muted-foreground' : ''}`}>
                              {action.title}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(action.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Sélectionnez une candidature pour gérer ses tâches
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Circle className="w-5 h-5 text-warning" />
            Tâches en attente ({pendingTasks.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Aucune tâche en attente
              </div>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="p-2 bg-muted/50 rounded text-sm">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.applicationName}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 border-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Tâches complétées ({completedTasks.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {completedTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Aucune tâche complétée
              </div>
            ) : (
              completedTasks.map(task => (
                <div key={task.id} className="p-2 bg-success/5 rounded text-sm">
                  <div className="font-medium line-through text-muted-foreground">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.applicationName}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
