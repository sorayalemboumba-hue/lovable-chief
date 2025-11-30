import { Application } from '@/types/application';
import { getDaysUntil } from './dateUtils';

export interface PriorityScore {
  total: number;
  urgency: number;
  quality: number;
  statusBoost: number;
}

/**
 * Smart Priority Engine
 * Calcule un score de priorité basé sur:
 * - Urgence (deadline)
 * - Qualité (compatibilité)
 * - Statut (boost pour certains statuts)
 */
export function getPriorityScore(app: Application): PriorityScore {
  // Urgency score (0-40 points)
  const daysUntil = getDaysUntil(app.deadline);
  let urgency = 0;
  
  // Handle null/missing deadline with neutral score
  if (!app.deadline || daysUntil === 999) {
    urgency = 10; // Neutral score for no deadline
  } else if (daysUntil < 0) {
    urgency = 40; // Overdue gets max priority
  } else if (daysUntil <= 3) {
    urgency = 35;
  } else if (daysUntil <= 7) {
    urgency = 25;
  } else if (daysUntil <= 14) {
    urgency = 15;
  } else {
    urgency = 5;
  }

  // Quality score (0-40 points)
  const compatibility = app.compatibility || 0;
  let quality = 0;
  if (compatibility >= 80) quality = 40;
  else if (compatibility >= 70) quality = 30;
  else if (compatibility >= 60) quality = 20;
  else if (compatibility >= 50) quality = 10;
  else quality = 0;

  // Status boost (0-20 points)
  let statusBoost = 0;
  if (app.statut === 'entretien') statusBoost = 20;
  else if (app.statut === 'soumise') statusBoost = 15;
  else if (app.statut === 'en cours') statusBoost = 10;
  else statusBoost = 5;

  const total = urgency + quality + statusBoost;

  return {
    total,
    urgency,
    quality,
    statusBoost
  };
}

/**
 * Sort applications by smart priority
 */
export function sortByPriority(applications: Application[]): Application[] {
  return [...applications].sort((a, b) => {
    const scoreA = getPriorityScore(a);
    const scoreB = getPriorityScore(b);
    
    // Sort by total score descending
    if (scoreB.total !== scoreA.total) {
      return scoreB.total - scoreA.total;
    }
    
    // If same score, sort by manual priority
    return b.priorite - a.priorite;
  });
}
