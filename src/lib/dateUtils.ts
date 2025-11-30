export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-CH');
};

export const getDaysUntil = (dateStr: string): number => {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isOverdue = (dateStr: string): boolean => {
  return getDaysUntil(dateStr) < 0;
};

export const isUrgent = (dateStr: string): boolean => {
  const days = getDaysUntil(dateStr);
  return days >= 0 && days <= 7;
};
