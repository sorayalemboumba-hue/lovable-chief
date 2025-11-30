import { Application } from '@/types/application';
import { cvInstructions, letterInstructions } from '@/data/cvTemplates';

export interface GeneratedDocument {
  content: string;
  metadata: {
    type: 'cv' | 'letter';
    format?: string;
    language: string;
    jobTitle: string;
    company: string;
  };
}

export const generateIntelligentCV = (
  application: Application,
  format: 'professional' | 'innovative' | 'standard' = 'professional',
  language: 'fr' | 'en' = 'fr'
): GeneratedDocument => {
  const profile = cvInstructions.profile;
  const competences = cvInstructions.competences;
  const experiences = cvInstructions.experiences;
  const formations = cvInstructions.formations;
  
  // Analyser les compétences requises pour adapter le CV
  const keywords = application.keywords?.toLowerCase() || '';
  const jobDescription = `${application.poste} ${keywords}`.toLowerCase();
  
  // Sélectionner les compétences les plus pertinentes
  const relevantCompetences = selectRelevantSkills(jobDescription, competences);
  
  // Sélectionner les expériences les plus pertinentes (max 6)
  const relevantExperiences = selectRelevantExperiences(jobDescription, experiences);
  
  // Générer le contenu textuel du CV
  let content = '';
  
  // En-tête
  content += `${profile.nom}\n`;
  content += `${profile.adresse} | ${profile.telephone} | ${profile.email}\n`;
  content += `${profile.dateNaissance} - ${profile.nationalite} - ${profile.permis}\n\n`;
  
  // Titre adapté au poste
  const title = language === 'fr' 
    ? getAdaptedTitle(application.poste, 'fr')
    : getAdaptedTitle(application.poste, 'en');
  content += `${title.toUpperCase()}\n\n`;
  
  // Profil
  content += `À PROPOS\n\n`;
  content += `${language === 'fr' ? profile.profil.fr : profile.profil.en}\n\n`;
  
  // Compétences clés
  content += `COMPÉTENCES ET EXPERTISE\n\n`;
  Object.entries(relevantCompetences).forEach(([category, skills]) => {
    content += `${category.toUpperCase()}\n`;
    (skills as string[]).slice(0, 3).forEach(skill => {
      content += `• ${skill}\n`;
    });
    content += `\n`;
  });
  
  // Expérience professionnelle
  content += `EXPÉRIENCE PROFESSIONNELLE\n\n`;
  relevantExperiences.forEach(exp => {
    content += `${exp.poste} | ${exp.entreprise}, ${exp.lieu} | ${exp.periode}\n`;
    content += `${exp.description}\n\n`;
  });
  
  // Formation
  content += `FORMATION\n\n`;
  formations.forEach(form => {
    content += `${form.diplome}\n`;
    content += `${form.institution} | ${form.annee}\n\n`;
  });
  
  // Langues
  content += `LANGUES\n\n`;
  profile.langues.forEach(lang => {
    content += `${lang.langue}: ${lang.niveau}\n`;
  });
  
  return {
    content,
    metadata: {
      type: 'cv',
      format,
      language,
      jobTitle: application.poste,
      company: application.entreprise
    }
  };
};

export const generateIntelligentCoverLetter = (
  application: Application,
  language: 'fr' | 'en' = 'fr'
): GeneratedDocument => {
  const profile = cvInstructions.profile;
  const keywords = application.keywords?.toLowerCase() || '';
  const jobDescription = `${application.poste} ${keywords}`.toLowerCase();
  
  // Analyser le type de poste pour adapter le style
  const letterStyle = analyzJobType(jobDescription);
  
  let content = '';
  
  // En-tête
  content += `${profile.nom}\n`;
  content += `${profile.adresse}\n`;
  content += `${profile.email} | ${profile.telephone}\n\n`;
  
  // Destinataire
  content += `${application.entreprise}\n`;
  if (application.lieu) {
    content += `${application.lieu}\n`;
  }
  content += `\n`;
  
  // Date
  const today = new Date();
  const dateStr = language === 'fr'
    ? today.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : today.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  content += `${language === 'fr' ? 'Genève, le' : 'Geneva,'} ${dateStr}\n\n`;
  
  // Objet
  content += `${language === 'fr' ? 'Objet' : 'Subject'}: ${language === 'fr' ? 'Candidature pour le poste de' : 'Application for the position of'} ${application.poste}\n\n`;
  
  // Corps de la lettre
  content += `${language === 'fr' ? 'Madame, Monsieur,' : 'Dear Sir or Madam,'}\n\n`;
  
  // Introduction punchy et personnalisée
  const intro = generatePersonalizedIntro(application, letterStyle, language);
  content += `${intro}\n\n`;
  
  // Paragraphe expérience avec storytelling
  const experience = generateExperienceStoryTelling(application, letterStyle, language);
  content += `${experience}\n\n`;
  
  // Points forts avec bullet points
  const highlights = generateHighlights(application, letterStyle, language);
  content += `${language === 'fr' ? 'Mes atouts pour ce poste :' : 'Key strengths for this position:'}\n\n`;
  highlights.forEach(point => {
    content += `• ${point}\n`;
  });
  content += `\n`;
  
  // Conclusion originale
  const conclusion = generateOriginalConclusion(application, letterStyle, language);
  content += `${conclusion}\n\n`;
  
  // Formule de politesse
  content += language === 'fr'
    ? `Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n`
    : `I look forward to hearing from you and remain at your disposal for any further information.\n\nYours sincerely,\n\n`;
  
  content += `${profile.nom}\n`;
  
  return {
    content,
    metadata: {
      type: 'letter',
      language,
      jobTitle: application.poste,
      company: application.entreprise
    }
  };
};

// Fonctions utilitaires

function selectRelevantSkills(jobDescription: string, competences: any): any {
  const result: any = {};
  
  // Prioriser les compétences en fonction des mots-clés
  if (jobDescription.includes('projet') || jobDescription.includes('project')) {
    result['Gestion de projets'] = competences.gestionProjet;
  }
  
  if (jobDescription.includes('équipe') || jobDescription.includes('team') || 
      jobDescription.includes('management') || jobDescription.includes('leader')) {
    result['Leadership et gestion d\'équipe'] = competences.leadership;
  }
  
  if (jobDescription.includes('communication') || jobDescription.includes('événement') || 
      jobDescription.includes('event')) {
    result['Communication et organisation d\'événements'] = competences.communication;
  }
  
  if (jobDescription.includes('partenariat') || jobDescription.includes('développement') ||
      jobDescription.includes('partnership')) {
    result['Développement de partenariats'] = competences.partenariats;
  }
  
  // Si aucune correspondance spécifique, inclure toutes les catégories
  if (Object.keys(result).length === 0) {
    return competences;
  }
  
  return result;
}

function selectRelevantExperiences(jobDescription: string, experiences: any[]): any[] {
  // Scorer chaque expérience en fonction de la pertinence
  const scored = experiences.map(exp => {
    let score = 0;
    const expText = `${exp.poste} ${exp.description}`.toLowerCase();
    
    // Mots-clés importants
    const keywords = jobDescription.split(' ').filter(w => w.length > 4);
    keywords.forEach(keyword => {
      if (expText.includes(keyword)) score += 2;
    });
    
    // Expériences récentes ont plus de poids
    const year = parseInt(exp.periode.split('—')[0].trim().split(' ')[1]);
    if (year >= 2019) score += 3;
    else if (year >= 2014) score += 2;
    else if (year >= 2010) score += 1;
    
    return { ...exp, score };
  });
  
  // Trier par score et retourner les 6 meilleures
  return scored.sort((a, b) => b.score - a.score).slice(0, 6);
}

function getAdaptedTitle(poste: string, language: 'fr' | 'en'): string {
  const posteLower = poste.toLowerCase();
  
  if (posteLower.includes('projet') || posteLower.includes('project')) {
    return language === 'fr' ? 'Chargée de projets' : 'Project Manager';
  }
  if (posteLower.includes('événement') || posteLower.includes('event')) {
    return language === 'fr' ? 'Chargée d\'événements' : 'Events Manager';
  }
  if (posteLower.includes('communication')) {
    return language === 'fr' ? 'Chargée de communication' : 'Communications Manager';
  }
  if (posteLower.includes('coordinat')) {
    return language === 'fr' ? 'Coordinatrice' : 'Coordinator';
  }
  
  return language === 'fr' ? 'Chargée de projets et événements' : 'Project and Events Manager';
}

function analyzJobType(jobDescription: string): 'social' | 'event' | 'education' | 'corporate' {
  if (jobDescription.includes('social') || jobDescription.includes('humanitaire') || 
      jobDescription.includes('ong')) {
    return 'social';
  }
  if (jobDescription.includes('événement') || jobDescription.includes('event')) {
    return 'event';
  }
  if (jobDescription.includes('éducation') || jobDescription.includes('école') || 
      jobDescription.includes('school')) {
    return 'education';
  }
  return 'corporate';
}

function generatePersonalizedIntro(
  application: Application, 
  style: string, 
  language: 'fr' | 'en'
): string {
  const intros: Record<string, Record<string, string>> = {
    social: {
      fr: `${application.poste} chez ${application.entreprise} : cette opportunité résonne profondément avec mon parcours et mes valeurs. Depuis plus de 15 ans, je mets mes compétences au service de projets à impact social, convaincue que chaque initiative peut transformer des vies.`,
      en: `The ${application.poste} position at ${application.entreprise} deeply resonates with my experience and values. For over 15 years, I have dedicated my skills to social impact projects, convinced that every initiative can transform lives.`
    },
    event: {
      fr: `Transformer une idée en expérience mémorable, un événement en moment d'exception : voilà ce qui m'anime. C'est avec cet état d'esprit que je vous adresse ma candidature pour le poste de ${application.poste} chez ${application.entreprise}.`,
      en: `Transforming an idea into a memorable experience, an event into an exceptional moment: this is what drives me. It is with this mindset that I apply for the ${application.poste} position at ${application.entreprise}.`
    },
    education: {
      fr: `L'excellence éducative et l'accompagnement des talents sont au cœur de mon parcours professionnel. Le poste de ${application.poste} chez ${application.entreprise} représente l'opportunité de mettre cette expertise au service de votre institution.`,
      en: `Educational excellence and talent development are at the heart of my professional journey. The ${application.poste} position at ${application.entreprise} represents an opportunity to bring this expertise to your institution.`
    },
    corporate: {
      fr: `Avec plus de 15 ans d'expérience en gestion de projets complexes et coordination d'équipes multiculturelles, je suis convaincue de pouvoir contribuer significativement au poste de ${application.poste} chez ${application.entreprise}.`,
      en: `With over 15 years of experience managing complex projects and coordinating multicultural teams, I am confident I can significantly contribute to the ${application.poste} position at ${application.entreprise}.`
    }
  };
  
  return intros[style][language];
}

function generateExperienceStoryTelling(
  application: Application,
  style: string,
  language: 'fr' | 'en'
): string {
  const stories: Record<string, Record<string, string>> = {
    social: {
      fr: `Mon parcours illustre cette approche concrète : à la Croix-Rouge genevoise, j'ai piloté la création d'un dispositif d'urgence qui a permis d'accompagner 1 400 personnes en situation précaire en pleine crise COVID. Cette expérience m'a appris l'importance de l'agilité, de l'empathie et de la capacité à mobiliser rapidement des ressources humaines et matérielles face à l'urgence.`,
      en: `My background illustrates this hands-on approach: at the Geneva Red Cross, I led the creation of an emergency service that supported 1,400 vulnerable people during the COVID crisis. This experience taught me the importance of agility, empathy, and the ability to quickly mobilize human and material resources in urgent situations.`
    },
    event: {
      fr: `À la Fête des Vignerons 2019, événement inscrit au patrimoine UNESCO, j'ai coordonné l'accueil d'un million de visiteurs avec une équipe de 200 bénévoles. De la logistique protocolaire aux situations d'urgence, cette expérience a consolidé ma capacité à gérer la complexité tout en préservant l'excellence du service.`,
      en: `At the 2019 Fête des Vignerons, a UNESCO heritage event, I coordinated the reception of one million visitors with a team of 200 volunteers. From protocol logistics to emergency situations, this experience strengthened my ability to manage complexity while maintaining service excellence.`
    },
    education: {
      fr: `Au sein de prestigieuses institutions comme l'Institut Le Rosey et St George's International School, j'ai piloté l'ensemble de la stratégie d'admissions et d'événements. Cette immersion dans l'excellence éducative m'a permis de développer une compréhension fine des attentes des familles internationales et des exigences académiques de haut niveau.`,
      en: `Within prestigious institutions such as Institut Le Rosey and St George's International School, I led the entire admissions and events strategy. This immersion in educational excellence allowed me to develop a deep understanding of international families' expectations and high-level academic requirements.`
    },
    corporate: {
      fr: `Mon expérience chez Defence for Children International et lors de la direction intérimaire de l'École Moderne de Neuchâtel démontre ma capacité à piloter des projets stratégiques dans des contextes exigeants. J'ai notamment assuré la transition digitale complète d'un établissement en pleine crise sanitaire, garantissant la continuité pédagogique pour 150 élèves.`,
      en: `My experience at Defence for Children International and as interim director of École Moderne de Neuchâtel demonstrates my ability to lead strategic projects in demanding contexts. I notably ensured the complete digital transition of an institution during the health crisis, guaranteeing educational continuity for 150 students.`
    }
  };
  
  return stories[style][language];
}

function generateHighlights(
  application: Application,
  style: string,
  language: 'fr' | 'en'
): string[] {
  const baseHighlights = {
    fr: [
      'Leadership éprouvé : coordination de 200+ bénévoles et gestion d\'équipes multiculturelles',
      'Excellence opérationnelle : pilotage de projets complexes avec résultats mesurables',
      'Polyvalence linguistique : 7 langues dont français, anglais, espagnol (natif)',
      'Certifications actuelles : IPMA Level D et Brevet fédéral AI Business Specialist (en cours)'
    ],
    en: [
      'Proven leadership: coordination of 200+ volunteers and multicultural team management',
      'Operational excellence: management of complex projects with measurable results',
      'Multilingual proficiency: 7 languages including French, English, Spanish (native)',
      'Current certifications: IPMA Level D and Federal AI Business Specialist Certificate (ongoing)'
    ]
  };
  
  // Adapter en fonction des compétences requises
  const keywords = application.keywords?.toLowerCase() || '';
  const additionalHighlights: Record<string, string[]> = {
    fr: [],
    en: []
  };
  
  if (keywords.includes('budget') || keywords.includes('financ')) {
    additionalHighlights.fr.push('Gestion budgétaire : suivi de budgets projets et reporting stratégique');
    additionalHighlights.en.push('Budget management: project budget tracking and strategic reporting');
  }
  
  if (keywords.includes('digital') || keywords.includes('innovation')) {
    additionalHighlights.fr.push('Innovation digitale : en formation sur l\'IA et la transformation numérique');
    additionalHighlights.en.push('Digital innovation: training in AI and digital transformation');
  }
  
  return [...baseHighlights[language], ...additionalHighlights[language]].slice(0, 5);
}

function generateOriginalConclusion(
  application: Application,
  style: string,
  language: 'fr' | 'en'
): string {
  const conclusions: Record<string, Record<string, string>> = {
    social: {
      fr: `Rejoindre ${application.entreprise}, c'est pour moi l'opportunité de mettre mon énergie et mon expérience au service d'une mission qui fait sens. Je serais honorée d'échanger avec vous sur la manière dont mon profil peut contribuer à vos projets.`,
      en: `Joining ${application.entreprise} represents an opportunity to dedicate my energy and experience to a meaningful mission. I would be honored to discuss how my profile can contribute to your projects.`
    },
    event: {
      fr: `Créer des expériences qui marquent et fédèrent : c'est ce que je fais depuis 15 ans, et c'est ce que je souhaite apporter à ${application.entreprise}. Je reste à votre disposition pour vous présenter mes réalisations en détail.`,
      en: `Creating memorable and unifying experiences: this is what I have been doing for 15 years, and what I wish to bring to ${application.entreprise}. I remain at your disposal to present my achievements in detail.`
    },
    education: {
      fr: `L'excellence éducative nécessite des professionnels passionnés et engagés. Je suis convaincue de pouvoir contribuer à la réputation et au développement de ${application.entreprise}. Au plaisir d'échanger avec vous.`,
      en: `Educational excellence requires passionate and committed professionals. I am convinced I can contribute to the reputation and development of ${application.entreprise}. I look forward to speaking with you.`
    },
    corporate: {
      fr: `Mon parcours polyvalent et mes résultats tangibles témoignent de ma capacité à relever les défis du poste de ${application.poste}. Je serais ravie de vous rencontrer pour approfondir ma candidature.`,
      en: `My versatile background and tangible results demonstrate my ability to meet the challenges of the ${application.poste} position. I would be delighted to meet you to discuss my application further.`
    }
  };
  
  return conclusions[style][language];
}
