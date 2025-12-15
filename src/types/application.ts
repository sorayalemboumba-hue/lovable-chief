export type ApplicationStatus = "à compléter" | "en cours" | "soumise" | "entretien";
export type ApplicationType = "standard" | "spontanée" | "recommandée" | "oce";
export type ApplicationMethod = "Email" | "Formulaire" | "Simplifiée" | "Inconnu";
export type OfferLanguage = "Français" | "Anglais" | "Allemand";

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
  type?: ApplicationType;
  referent?: string;
  compatibility?: number;
  missingRequirements?: string[];
  matchingSkills?: string[];
  originalOfferUrl?: string;
  publicationDate?: string;
  applicationEmail?: string;
  applicationInstructions?: string;
  requiredDocuments?: string[];
  cv_template_id?: string;
  letter_template_id?: string;
  is_complete?: boolean;
  recommended_channel?: string;
  ats_compliant?: boolean;
  urgent_no_deadline?: boolean;
  excluded?: boolean;
  exclusion_reason?: string;
  // NEW FIELDS - Major Update
  applicationMethod?: ApplicationMethod;
  contactPerson?: string;
  isExpired?: boolean;
  language?: OfferLanguage;
  deadlineMissing?: boolean;
  sourceUrl?: string;
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
