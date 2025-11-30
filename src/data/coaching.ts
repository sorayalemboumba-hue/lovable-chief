import { CoachingTip } from '@/types/application';

export const COACHING_LIBRARY: CoachingTip[] = [
  { 
    id: '1', 
    tag: 'mindset', 
    title: '100 répétitions', 
    note: 'Vise le volume utile. Normalise l\'imperfection des débuts.', 
    source: 'Routine' 
  },
  { 
    id: '2', 
    tag: 'focus', 
    title: 'Action principale du jour', 
    note: 'Chaque jour, une action clé liée à la candidature prioritaire.', 
    source: 'Plan' 
  },
  { 
    id: '3', 
    tag: 'followup', 
    title: 'Relance 48h', 
    note: 'Prépare un suivi bref et factuel 48h après l\'envoi.', 
    source: 'Bonnes pratiques' 
  },
  { 
    id: '4', 
    tag: 'checklist', 
    title: 'Règle des 3 preuves', 
    note: 'Un chiffre; un exemple; une référence.', 
    source: 'Interne' 
  },
  { 
    id: '5', 
    tag: 'energy', 
    title: 'Bloc 30 minutes', 
    note: 'Crée un créneau quotidien de 30 minutes focus candidature.', 
    source: 'Routine' 
  },
];

export const getTipOfDay = (tips: CoachingTip[]): string => {
  if (!tips.length) return "Excellente journée de candidature ! Organisez votre pipeline et priorisez les deadlines.";
  const today = new Date().getDate();
  const selectedTip = tips[today % tips.length];
  return selectedTip.note || selectedTip.title;
};
