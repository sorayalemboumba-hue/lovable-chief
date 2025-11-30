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
  // Sélection des compétences selon le format
  let relevantSkills: string[] = [];
  let apropos = '';
  let relevantAchievements = sorayaProfile.realisationsPhares;

  switch (format) {
    case 'innovation':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.innovation,
        ...sorayaProfile.competencesExpertises.gestionProjet.slice(0, 3)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        ['innovation', 'projet'].includes(r.domaine)
      );
      apropos = sorayaProfile.citations.innovation;
      break;
      
    case 'education':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.international,
        ...sorayaProfile.competencesExpertises.communication.slice(0, 3)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        ['communication', 'management'].includes(r.domaine)
      );
      apropos = sorayaProfile.citations.education;
      break;
      
    case 'events':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.evenementiel,
        ...sorayaProfile.competencesExpertises.gestionProjet.slice(0, 2)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        r.domaine === 'événementiel'
      );
      apropos = sorayaProfile.citations.events;
      break;
      
    case 'social':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.innovation.slice(0, 2),
        ...sorayaProfile.competencesExpertises.leadership
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        r.domaine === 'social'
      );
      apropos = sorayaProfile.citations.social;
      break;
      
    case 'management':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.leadership,
        ...sorayaProfile.competencesExpertises.gestionProjet
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        ['management', 'projet'].includes(r.domaine)
      );
      apropos = sorayaProfile.citations.management;
      break;
      
    default: // standard
      relevantSkills = Object.values(sorayaProfile.competencesExpertises).flat().slice(0, 10);
      relevantAchievements = sorayaProfile.realisationsPhares.slice(0, 4);
      apropos = sorayaProfile.citations.general;
  }

  return {
    enTete: {
      nom: sorayaProfile.nom,
      email: sorayaProfile.email,
      telephone: sorayaProfile.telephone,
      adresse: sorayaProfile.adresse,
      nationalite: sorayaProfile.nationalite,
      permis: sorayaProfile.permis
    },
    apropos,
    competencesExpertises: relevantSkills,
    realisationsPhares: relevantAchievements,
    experiencesProfessionnelles: sorayaProfile.experiences,
    langues: sorayaProfile.langues
  };
};

export const generateMotivationLetter = (candidature: Application): GeneratedLetter => {
  const isRecommended = candidature.type === 'recommandée';
  const isSpontaneous = candidature.type === 'spontanée';
  
  let openingParagraph = '';
  let closingParagraph = '';
  
  if (isRecommended && candidature.referent) {
    openingParagraph = `Suite à ma conversation avec ${candidature.referent}, j'ai le plaisir de vous soumettre ma candidature pour le poste de ${candidature.poste}.`;
  } else if (isSpontaneous) {
    openingParagraph = `Impressionnée par votre engagement et votre impact dans ${candidature.lieu}, je me permets de vous adresser ma candidature spontanée pour un poste de ${candidature.poste}.`;
  } else {
    openingParagraph = `Votre recherche d'un(e) ${candidature.poste} correspond parfaitement à mon parcours de 15+ années en gestion de projets et coordination multiculturelle.`;
  }
  
  const keywords = candidature.keywords?.split(',')[0]?.trim() || 'communication';
  
  const letterContent = `${sorayaProfile.adresse}
${candidature.lieu}, le ${new Date().toLocaleDateString('fr-CH')}

Objet: Candidature ${candidature.poste} - ${candidature.entreprise}

Madame, Monsieur,

${openingParagraph}

Mon expérience en ${keywords} m'a permis de développer une expertise solide dans des environnements internationaux exigeants. J'ai notamment :

• Coordonné 175 bénévoles lors de la Fête des Vignerons avec 500+ VIP
• Augmenté de 40% la visibilité de St George's International School
• Digitalisé les processus d'admissions, réduisant de 60% les délais de traitement
• Géré simultanément 12 projets dans 8 pays avec un budget de 500k CHF

Ma capacité à fédérer des équipes multiculturelles (15 collaborateurs, 7 nationalités) et mon approche centrée sur l'innovation sociale me permettent de transformer les défis en opportunités concrètes.

${isSpontaneous 
  ? `Je serais ravie d'échanger avec vous sur les opportunités de collaboration au sein de ${candidature.entreprise} et de contribuer à vos projets.`
  : `Je suis convaincue que mon profil peut apporter une réelle valeur ajoutée à votre équipe.`}

Disponible pour un entretien à votre convenance, je reste à votre entière disposition.

Avec mes salutations distinguées,

${sorayaProfile.nom}
${sorayaProfile.telephone} | ${sorayaProfile.email}`;

  const shortMessage = isRecommended
    ? `Objet: Candidature ${candidature.poste} (recommandée par ${candidature.referent})\n\nBonjour,\n\nSuite à ma discussion avec ${candidature.referent}, je vous transmets ma candidature pour le poste de ${candidature.poste}.\n\nVous trouverez ci-joint mon CV et ma lettre de motivation.\n\nCordialement,\n${sorayaProfile.nom}`
    : `Objet: Candidature ${candidature.poste}\n\nBonjour,\n\nJe vous transmets ma candidature pour le poste de ${candidature.poste} au sein de ${candidature.entreprise}.\n\nMon parcours de 15+ années en gestion de projets internationaux et coordination d'équipes multiculturelles correspond aux exigences de ce poste.\n\nVous trouverez ci-joint mon CV et ma lettre de motivation détaillée.\n\nBien cordialement,\n${sorayaProfile.nom}\n${sorayaProfile.telephone}`;

  return {
    lettre_full: letterContent,
    message_channel: shortMessage,
    highlights_numeriques: [
      '175 bénévoles coordonnés',
      '40% augmentation visibilité',
      '60% réduction délais',
      '12 projets, 8 pays',
      '15+ années d\'expérience'
    ],
    slogan: sorayaProfile.citations.general
  };
};
