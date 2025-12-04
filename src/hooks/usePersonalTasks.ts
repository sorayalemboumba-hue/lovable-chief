import { useState, useEffect, useCallback } from 'react';
import { PersonalTask } from '@/types/personalTask';
import { toast } from 'sonner';

const STORAGE_KEY = 'sosoflow_personal_tasks';

export function usePersonalTasks() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading personal tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save tasks to localStorage
  const saveTasks = useCallback((newTasks: PersonalTask[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  }, []);

  const addTask = useCallback((task: Omit<PersonalTask, 'id' | 'createdAt' | 'done'>) => {
    const newTask: PersonalTask = {
      ...task,
      id: Date.now().toString(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    saveTasks([...tasks, newTask]);
    toast.success('Tâche ajoutée');
    return newTask;
  }, [tasks, saveTasks]);

  const updateTask = useCallback((id: string, updates: Partial<PersonalTask>) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    saveTasks(newTasks);
  }, [tasks, saveTasks]);

  const deleteTask = useCallback((id: string) => {
    const newTasks = tasks.filter(task => task.id !== id);
    saveTasks(newTasks);
    toast.success('Tâche supprimée');
  }, [tasks, saveTasks]);

  const toggleTask = useCallback((id: string) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, done: !task.done } : task
    );
    saveTasks(newTasks);
  }, [tasks, saveTasks]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
  };
}
