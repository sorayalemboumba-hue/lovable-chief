import { Application } from '@/types/application';
import { sorayaProfile } from '@/data/profile';

export interface GeneratedCV {
  enTete: {
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    nationalite: string;
    permis: string;
  };
  apropos: string;
  competencesExpertises: string[];
  realisationsPhares: typeof sorayaProfile.realisationsPhares;
  experiencesProfessionnelles: typeof sorayaProfile.experiences;
  langues: typeof sorayaProfile.langues;
}

export interface GeneratedLetter {
  lettre_full: string;
  message_channel: string;
  highlights_numeriques: string[];
  slogan: string;
}

export type CVFormat = 'standard' | 'innovation' | 'education' | 'events' | 'social' | 'management';

export const CV_FORMATS = [
  { id: 'standard', label: 'CV Standard', icon: '📄', description: 'Format polyvalent pour tous secteurs' },
  { id: 'innovation', label: 'CV Innovation', icon: '💡', description: 'Focus innovation sociale et facilitation' },
  { id: 'education', label: 'CV Éducation', icon: '🎓', description: 'Spécialisé éducation internationale' },
  { id: 'events', label: 'CV Événementiel', icon: '🎪', description: 'Focus événementiel et logistique' },
  { id: 'social', label: 'CV Social', icon: '🤝', description: 'Impact social et humanitaire' },
  { id: 'management', label: 'CV Management', icon: '👥', description: 'Leadership et coordination équipes' }
] as const;

export const generateCV = (candidature: Application, format: CVFormat = 'standard'): GeneratedCV => {
  const adaptedSkills = Object.values(sorayaProfile.competencesExpertises).flat().slice(0, 8);
  const relevantAchievements = sorayaProfile.realisationsPhares.slice(0, 3);

  return {
    enTete: {
      nom: sorayaProfile.nom,
      email: sorayaProfile.email,
      telephone: sorayaProfile.telephone,
      adresse: sorayaProfile.adresse,
      nationalite: sorayaProfile.nationalite,
      permis: sorayaProfile.permis
    },
    apropos: "Professionnelle expérimentée en gestion de projets et communication avec 15+ années d'expérience internationale. Spécialisée dans la coordination d'équipes multiculturelles et l'excellence opérationnelle.",
    competencesExpertises: adaptedSkills,
    realisationsPhares: relevantAchievements,
    experiencesProfessionnelles: sorayaProfile.experiences,
    langues: sorayaProfile.langues
  };
};

export const generateMotivationLetter = (candidature: Application): GeneratedLetter => {
  const letterContent = `${sorayaProfile.adresse}
${candidature.lieu}, le ${new Date().toLocaleDateString('fr-CH')}

Objet: Candidature ${candidature.poste} - ${candidature.entreprise}

Madame, Monsieur,

Votre recherche d'un(e) ${candidature.poste} correspond parfaitement à mon parcours de 15+ années en gestion de projets et coordination multiculturelle.

Mon expérience en ${candidature.keywords?.split(',')[0] || 'communication'} m'a permis de développer une expertise solide. J'ai coordonné 175 bénévoles lors de la Fête des Vignerons et augmenté de 40% la visibilité de St George's International School.

Ma capacité à transformer les processus s'illustre par la digitalisation que j'ai menée, réduisant de 60% le temps de traitement des admissions.

Je serais ravie de contribuer à vos objectifs et reste à votre disposition pour un entretien.

Avec mes salutations distinguées,

${sorayaProfile.nom}
${sorayaProfile.telephone} | ${sorayaProfile.email}`;

  return {
    lettre_full: letterContent,
    message_channel: `Objet: Candidature ${candidature.poste} - ${sorayaProfile.nom}\n\nVeuillez trouver ci-joint ma candidature pour le poste de ${candidature.poste}.\n\nCordialement,\n${sorayaProfile.nom}`,
    highlights_numeriques: ['175 bénévoles coordonnés', '40% augmentation visibilité'],
    slogan: "Créer du lien, faciliter les échanges et structurer les projets."
  };
};
