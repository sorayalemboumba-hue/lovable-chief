import { Application } from '@/types/application';
import { PersonalTask } from '@/types/personalTask';
import { format, addDays, subDays, parseISO } from 'date-fns';

/**
 * Generate automatic tasks based on application events
 */

// Create "Postuler [Entreprise]" task for J-2 before deadline
export function createDeadlineTask(app: Application): Omit<PersonalTask, 'id' | 'createdAt' | 'done'> | null {
  if (!app.deadline || app.deadlineMissing) return null;
  
  const deadlineDate = parseISO(app.deadline.split('T')[0]);
  const taskDate = subDays(deadlineDate, 2); // Changed from 1 to 2 (J-2)
  
  return {
    title: `Postuler ${app.entreprise || 'Entreprise'}`,
    description: `⚠️ Deadline: ${format(deadlineDate, 'dd/MM/yyyy')} - Poste: ${app.poste}`,
    deadline: format(taskDate, 'yyyy-MM-dd'),
    url: app.url || app.sourceUrl,
  };
}

// Create "Relance" task for J+7 after sending
export function createFollowUpTask(app: Application): Omit<PersonalTask, 'id' | 'createdAt' | 'done'> {
  const today = new Date();
  const followUpDate = addDays(today, 7);
  
  return {
    title: `Relance ${app.entreprise || 'Entreprise'}`,
    description: `Candidature envoyée le ${format(today, 'dd/MM/yyyy')} - Poste: ${app.poste}`,
    deadline: format(followUpDate, 'yyyy-MM-dd'),
    url: app.url || app.sourceUrl,
  };
}

// Check if a task already exists (avoid duplicates)
export function taskExists(tasks: PersonalTask[], taskTitle: string): boolean {
  return tasks.some(t => t.title.toLowerCase() === taskTitle.toLowerCase());
}
