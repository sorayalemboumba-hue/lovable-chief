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
        ...sorayaProfile.competencesExpertises.gestionProjet.slice(0, 3),
        ...sorayaProfile.competencesExpertises.communication.slice(0, 2)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        ['projet', 'social'].includes(r.domaine)
      );
      apropos = sorayaProfile.citations.innovation;
      break;
      
    case 'education':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.international,
        ...sorayaProfile.competencesExpertises.communication.slice(0, 3)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        ['communication', 'international'].includes(r.domaine)
      );
      apropos = sorayaProfile.citations.gestionProjet;
      break;
      
    case 'events':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.evenementiel,
        ...sorayaProfile.competencesExpertises.gestionProjet.slice(0, 2)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        r.domaine === 'événementiel'
      );
      apropos = sorayaProfile.citations.evenementiel;
      break;
      
    case 'social':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.gestionProjet.slice(0, 2),
        ...sorayaProfile.competencesExpertises.leadership.slice(0, 3)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        r.domaine === 'social'
      );
      apropos = sorayaProfile.citations.social;
      break;
      
    case 'management':
      relevantSkills = [
        ...sorayaProfile.competencesExpertises.leadership,
        ...sorayaProfile.competencesExpertises.gestionProjet.slice(0, 2)
      ];
      relevantAchievements = sorayaProfile.realisationsPhares.filter(r => 
        ['leadership', 'projet'].includes(r.domaine)
      );
      apropos = sorayaProfile.citations.leadership;
      break;
      
    default: // standard
      relevantSkills = Object.values(sorayaProfile.competencesExpertises).flat().slice(0, 10);
      relevantAchievements = sorayaProfile.realisationsPhares.slice(0, 4);
      apropos = sorayaProfile.citations.gestionProjet;
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

• Coordonné 200 bénévoles lors de la Fête des Vignerons (1 million de visiteurs)
• Créé le service d'urgence DIPER COVID à la Croix-Rouge (1400 bénéficiaires en 4 semaines)
• Géré le 90ème anniversaire de St Georges International School (10+ activités simultanées)
• Dirigé l'École Moderne pendant la crise COVID (transition digitale complète)

Ma capacité à fédérer des équipes multiculturelles (15 collaborateurs, 7 nationalités) et mon approche centrée sur l'innovation et l'impact social me permettent de transformer les défis en opportunités concrètes.

${isSpontaneous 
  ? `Je serais ravie d'échanger avec vous sur les opportunités de collaboration au sein de ${candidature.entreprise} et de contribuer à vos projets.`
  : `Je suis convaincue que mon profil peut apporter une réelle valeur ajoutée à votre équipe.`}

Disponible pour un entretien à votre convenance, je reste à votre entière disposition.

Avec mes salutations distinguées,

${sorayaProfile.nom}
${sorayaProfile.telephone} | ${sorayaProfile.email}`;

  const shortMessage = isRecommended
    ? `Objet: Candidature ${candidature.poste} (recommandée par ${candidature.referent})

Bonjour,

Suite à ma discussion avec ${candidature.referent}, je vous transmets ma candidature pour le poste de ${candidature.poste}.

Vous trouverez ci-joint mon CV et ma lettre de motivation.

Cordialement,
${sorayaProfile.nom}`
    : `Objet: Candidature ${candidature.poste}

Bonjour,

Je vous transmets ma candidature pour le poste de ${candidature.poste} au sein de ${candidature.entreprise}.

Mon parcours de 15+ années en gestion de projets internationaux et coordination d'équipes multiculturelles correspond aux exigences de ce poste.

Vous trouverez ci-joint mon CV et ma lettre de motivation détaillée.

Bien cordialement,
${sorayaProfile.nom}
${sorayaProfile.telephone}`;

  return {
    lettre_full: letterContent,
    message_channel: shortMessage,
    highlights_numeriques: [
      '200 bénévoles coordonnés',
      '1 million de visiteurs gérés',
      '1400 bénéficiaires COVID en 4 semaines',
      '15+ années d\'expérience internationale',
      '10+ activités simultanées organisées'
    ],
    slogan: sorayaProfile.citations.gestionProjet
  };
};
