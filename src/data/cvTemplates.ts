// CV Templates et instructions basés sur les documents fournis
export const cvInstructions = {
  formats: [
    {
      id: 'professional',
      name: 'Professionnel & Élégant',
      description: 'Format pour postes de management, 2 pages max, aéré'
    },
    {
      id: 'innovative',
      name: 'Innovant & Original',
      description: 'Format créatif qui démarque, visuel moderne'
    },
    {
      id: 'standard',
      name: 'Standard Suisse',
      description: 'Basé sur vos modèles CV existants, format classique'
    }
  ],
  
  profile: {
    nom: 'Soraya Koité',
    adresse: '6, rond-point de Plainpalais - 1205 Genève',
    telephone: '079 853 15 73',
    email: 'soraya.lemboumba@ehl.ch',
    dateNaissance: '27.01.1985',
    nationalite: 'Espagnole',
    permis: 'Permis C - Permis de conduire',
    
    profil: {
      fr: 'Professionnelle polyvalente avec plus de 15 ans d\'expérience en gestion de projet, communication, et événementiel. Experte en leadership d\'équipes multiculturelles et optimisation de services à impact social. Reconnue pour la capacité à gérer des projets complexes, tout en assurant des résultats mesurables.',
      en: 'Accomplished and solutions-oriented event management professional with over 15 years of experience orchestrating small- and large-scale events locally and internationally. Known for creativity, strategic planning, and exceptional organizational skills.'
    },
    
    langues: [
      { langue: 'Français', niveau: 'Langue maternelle' },
      { langue: 'Espagnol', niveau: 'Langue maternelle' },
      { langue: 'Anglais', niveau: 'Langue maternelle' },
      { langue: 'Italien', niveau: 'Professionnel complet' },
      { langue: 'Portugais', niveau: 'Professionnel' },
      { langue: 'Bambara', niveau: 'Basique' },
      { langue: 'Mandarin', niveau: 'Élémentaire' }
    ]
  },
  
  competences: {
    gestionProjet: [
      'Création et pilotage du service d\'urgence DIPER à la Croix-Rouge genevoise, avec mise en place de processus efficaces pour les personnes sans statut légal. Plus de 1400 bénéficiaires en 4 semaines.',
      'Mise en œuvre de projets sous contrainte budgétaire, respectant des échéances serrées, et assurant des résultats tangibles.',
      'Organisation et gestion d\'activités locales et internationales promotionnelles au Collège du Léman, y compris salons et conférences allant de 20 à 300 participants.',
      'Gestion de plans d\'action, objectifs budgétaires et rapports KPI à l\'Institut le Rosey, Collège du Léman, St George\'s et l\'Ecole Moderne de Neuchâtel.'
    ],
    
    leadership: [
      'Recrutement, formation et supervision de plus de 200 bénévoles lors de la Fête des Vignerons, garantissant un accueil de qualité.',
      'Direction d\'une équipe de 15 personnes à l\'Ecole Moderne, avec des initiatives ayant augmenté la productivité de 15%.',
      'Responsable des admissions et de la coordination d\'équipes pour 3 prestigieuses écoles internationales basées en Suisse.',
      'Création et direction d\'une start-up avec My Sweet Days, incluant la gestion de personnel et d\'événements autour de la petite enfance.'
    ],
    
    communication: [
      'Organisation d\'événements internationaux pour Defence for Children International, y compris des campagnes de sensibilisation à grande échelle.',
      'Conception et gestion du 90ème anniversaire de St Georges International School, incluant la coordination de plus de 10 activités simultanées.',
      'Organisation de galas de charité, ventes aux enchères et soirées d\'information pour des institutions renommées.',
      'Conduite de campagnes marketing internationales pour promouvoir l\'Institut le Rosey et Arcoligne.'
    ],
    
    partenariats: [
      'Établissement de partenariats stratégiques pour la mobilisation de fonds, augmentant les ressources de l\'organisation.',
      'Collaboration avec des réseaux internationaux pour renforcer l\'image de marque et assurer un engagement global.',
      'Établissement de relations avec des agences éducatives et ambassades à l\'échelle mondiale.',
      'Développement de partenariats pour des événements de prestige, renforçant la reconnaissance institutionnelle.'
    ]
  },
  
  experiences: [
    {
      poste: 'Chargée de projets',
      entreprise: 'Croix Rouge genevoise',
      lieu: 'Genève, Suisse',
      periode: 'Mar 2021 — Juin 2024',
      description: 'Pilotage de projets humanitaires et sociaux, coordination de dispositifs d\'urgence COVID, gestion de plus de 100 bénévoles.'
    },
    {
      poste: 'Directrice Ad Interim',
      entreprise: 'Ecole Moderne',
      lieu: 'Neuchâtel, Suisse',
      periode: 'Déc 2019 — Fév 2021',
      description: 'Direction d\'établissement scolaire privé bilingue, gestion de crise COVID, digitalisation pédagogique.'
    },
    {
      poste: 'Responsable projet Accueil et Protocole',
      entreprise: 'Fête des Vignerons',
      lieu: 'Vevey, Suisse',
      periode: 'Juin 2019 — Nov 2019',
      description: 'Coordination de 200 bénévoles, accueil d\'1 million de visiteurs, gestion protocolaire UNESCO.'
    },
    {
      poste: 'Chargée communication et événements',
      entreprise: 'Defence for Children International',
      lieu: 'Genève, Suisse',
      periode: '2018 — 2019',
      description: 'Organisation d\'événements internationaux, campagnes de sensibilisation, plaidoyer ONU.'
    },
    {
      poste: 'Directrice Marketing et Admissions',
      entreprise: 'St Georges International School',
      lieu: 'Montreux, Suisse',
      periode: 'Jan 2016 — Déc 2017',
      description: 'Direction admissions, événements prestigieux, campagnes internationales.'
    },
    {
      poste: 'Responsable admissions et événements',
      entreprise: 'Collège du Léman',
      lieu: 'Versoix, Suisse',
      periode: 'Jan 2014 — Déc 2016',
      description: 'Organisation salons internationaux, gestion événements promotionnels, coordination équipes.'
    },
    {
      poste: 'Co-fondatrice',
      entreprise: 'My Sweet Days',
      lieu: 'Genève, Suisse',
      periode: '2012 — 2014',
      description: 'Création et direction start-up événementiel petite enfance.'
    },
    {
      poste: 'Responsable administrative et marketing',
      entreprise: 'Arcoligne',
      lieu: 'Renens, Suisse',
      periode: '2010 — 2012',
      description: 'Gestion administrative, campagnes marketing internationales.'
    },
    {
      poste: 'Responsable admissions et marketing',
      entreprise: 'Institut le Rosey',
      lieu: 'Rolle et Gstaad, Suisse',
      periode: '2007 — 2010',
      description: 'Gestion admissions prestigieuse école internationale, événements VIP.'
    },
    {
      poste: 'Coordinatrice des banquets et des ventes',
      entreprise: 'Hôtel de la Paix',
      lieu: 'Genève, Suisse',
      periode: '2006 — 2007',
      description: 'Coordination banquets, négociation fournisseurs, augmentation revenus 12%.'
    }
  ],
  
  formations: [
    {
      diplome: 'Brevet fédéral AI Business Specialist',
      institution: 'En cours',
      annee: '2025-2026'
    },
    {
      diplome: 'Certification IPMA Level D',
      institution: 'Gestion de projets',
      annee: '2024'
    },
    {
      diplome: 'Certificat Marketing et Réseaux Sociaux',
      institution: 'CADSCHOOL',
      annee: '2012'
    },
    {
      diplome: 'Certificat Gestion et Management',
      institution: 'IFAGE',
      annee: '2012'
    },
    {
      diplome: 'Bachelor Hospitality Management',
      institution: 'École hôtelière de Lausanne (EHL)',
      annee: '2003-2006'
    }
  ]
};

export const letterInstructions = {
  style: {
    maxLength: '1 page A4',
    tone: 'Engagée, expérimentée, avec storytelling',
    structure: 'Intro punchy, bullet points, conclusion originale',
    format: 'Aéré, lecture fluide, ATS-friendly'
  },
  
  mandatory: [
    'Phrase d\'accroche innovante et personnalisée',
    'Story telling avec exemples concrets et percutants',
    'Mots-clés du poste et compréhension des défis',
    'Chiffres et résultats mesurables',
    'Intro et conclusion originales qui démarquent'
  ],
  
  examples: {
    stopSuicide: {
      intro: 'Imaginer, structurer et coordonner des événements qui rassemblent, sensibilisent et mobilisent me passionne. Lorsqu\'ils s\'inscrivent dans une mission de prévention du suicide des jeunes, cette passion devient un engagement.',
      highlights: [
        'À la Croix-Rouge genevoise, j\'ai participé activement au développement de services de proximité durant la crise COVID',
        'À la Fête des Vignerons 2019, j\'ai coordonné plus de 200 bénévoles',
        'Chez Defence for Children International, j\'ai mené des projets de plaidoyer international'
      ],
      closing: 'Ce poste résonne profondément avec mon parcours comme avec mes valeurs.'
    },
    
    hug: {
      intro: 'Votre Centre de l\'innovation incarne une vision de l\'hôpital tournée vers l\'intelligence collective, l\'expérimentation concrète et la transformation du système de santé. C\'est précisément cet esprit que je partage.',
      highlights: [
        'À la Croix-Rouge, j\'ai co-construit un dispositif d\'urgence pour 1 400 personnes (réponse agile, mobilisation de 30 bénévoles)',
        'À la Fête des Vignerons 2019, j\'ai assuré la coordination de plus de 200 bénévoles pour un million de visiteurs',
        'Dans les ONG et écoles internationales, j\'ai conçu et piloté l\'ensemble des campagnes de communication'
      ],
      closing: 'Rejoindre votre Centre, c\'est pour moi l\'opportunité de mettre mes compétences au service d\'un lieu où l\'audace, la rigueur et la co-construction transforment l\'hôpital de demain.'
    }
  }
};
