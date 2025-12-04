import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Obtenir la date d'aujourd'hui en format YYYY-MM-DD (timezone locale)
export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

// Extraire YYYY-MM-DD d'une date ISO ou string
export const extractDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  // Si c'est déjà au format YYYY-MM-DD, le retourner
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Sinon extraire la partie date (avant le T)
  return dateStr.split('T')[0];
};

// Formater une date YYYY-MM-DD en "6 déc. 2025" SANS conversion timezone
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return 'Date inconnue';
  const cleanDate = extractDateString(dateStr);
  if (!cleanDate) return 'Date inconnue';
  
  // Parser avec parseISO et forcer midi pour éviter décalage
  const [year, month, day] = cleanDate.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  return format(date, "d MMM yyyy", { locale: fr });
};

// Calculer le nombre de jours jusqu'à une deadline (comparaison stricte YYYY-MM-DD)
export const getDaysUntil = (dateStr: string): number => {
  if (!dateStr) return 999;
  
  const todayStr = getTodayString();
  const targetStr = extractDateString(dateStr);
  
  if (!targetStr) return 999;
  
  // Comparer les chaînes directement pour éviter timezone
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  const [targetYear, targetMonth, targetDay] = targetStr.split('-').map(Number);
  
  const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
  const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
  
  const diffTime = targetDate.getTime() - todayDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Ancien format (rétrocompatibilité)
export const formatDate = (dateStr: string): string => {
  return formatDateDisplay(dateStr);
};

export const isOverdue = (dateStr: string): boolean => {
  return getDaysUntil(dateStr) < 0;
};

export const isUrgent = (dateStr: string): boolean => {
  const days = getDaysUntil(dateStr);
  return days >= 0 && days <= 7;
};

// Vérifier si deux dates sont le même jour (comparaison stricte)
export const isSameDay = (dateStr1: string, dateStr2: string): boolean => {
  return extractDateString(dateStr1) === extractDateString(dateStr2);
};

// Vérifier si une date correspond à un jour donné du calendrier
export const matchesCalendarDay = (dateStr: string, year: number, month: number, day: number): boolean => {
  const targetStr = extractDateString(dateStr);
  if (!targetStr) return false;
  
  const compareStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return targetStr === compareStr;
};
