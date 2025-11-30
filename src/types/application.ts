export type ApplicationStatus = "à compléter" | "en cours" | "soumise" | "entretien";

export interface Application {
  id: string;
  entreprise: string;
  poste: string;
  lieu: string;
  deadline: string;
  statut: ApplicationStatus;
  priorite: number;
  keywords?: string;
  notes?: string;
  url?: string;
  contacts?: Contact[];
  actions?: Action[];
  createdAt: string;
}

export interface Contact {
  id: string;
  nom: string;
  role?: string;
  email?: string;
  telephone?: string;
  linkedin?: string;
  notes?: string;
}

export interface Action {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  notes?: string;
}

export interface CoachingTip {
  id: string;
  tag: string;
  title: string;
  note: string;
  source: string;
}

export interface ProfileSkill {
  category: string;
  skills: string[];
}
