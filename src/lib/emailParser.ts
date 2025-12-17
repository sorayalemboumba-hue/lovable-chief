export interface ParsedJob {
  entreprise: string;
  poste: string;
  lieu: string;
  canal: string;
  motsCles?: string;
  source: string;
  url?: string; // URL extracted from HTML links
  description?: string; // Full job description for AI analysis
  exclusionFlags?: {
    isStage: boolean;
    isOutsideGEVD: boolean;
    requiresGerman: boolean;
  };
  shouldExclude?: boolean;
}

const isUnsubscribeLine = (line: string): boolean => {
  const unsubscribePatterns = [
    'se désabonner',
    'unsubscribe',
    'désinscrire',
    'désinscription',
    'modifier les paramètres',
    'click here if you no longer',
    'vous êtes inscrit comme',
    'contactez-nous'
  ];
  return unsubscribePatterns.some(pattern => line.toLowerCase().includes(pattern));
};

const parseLinkedInFormat = (lines: string[]): ParsedJob[] => {
  const jobs: ParsedJob[] = [];
  
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    if (isUnsubscribeLine(currentLine) || isUnsubscribeLine(nextLine)) continue;
    
    if (currentLine.length > 5 && nextLine && nextLine.includes('·')) {
      const parts = nextLine.split('·');
      if (parts.length >= 2) {
        const entreprise = parts[0].trim();
        const lieu = parts[1].trim();
        
        if (entreprise.length > 2 && lieu.length > 2) {
          jobs.push({
            entreprise,
            poste: currentLine,
            lieu,
            canal: 'linkedin',
            motsCles: `${currentLine}, ${entreprise}`,
            source: 'LinkedIn Alert'
          });
        }
      }
    }
  }
  
  return jobs;
};

const parseJobUpFormat = (lines: string[]): ParsedJob[] => {
  const jobs: ParsedJob[] = [];
  
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    if (isUnsubscribeLine(currentLine) || isUnsubscribeLine(nextLine)) continue;
    
    // JobUp pattern: "Un(e) Chef de Projet..." puis "Entreprise, Lieu"
    if (currentLine.length > 10 && nextLine && nextLine.includes(',')) {
      const parts = nextLine.split(',');
      if (parts.length >= 2) {
        const entreprise = parts[0].trim();
        const lieu = parts.slice(1).join(',').trim();
        
        // Éviter les lignes de footer
        if (!entreprise.includes('jobup.ch') && !entreprise.includes('www.') && 
            entreprise.length > 2 && lieu.length > 2) {
          jobs.push({
            entreprise,
            poste: currentLine,
            lieu,
            canal: 'jobup',
            motsCles: `${currentLine}, ${entreprise}`,
            source: 'JobUp Alert'
          });
        }
      }
    }
  }
  
  return jobs;
};

const parseCAGIFormat = (lines: string[]): ParsedJob[] => {
  const jobs: ParsedJob[] = [];
  
  for (let i = 0; i < lines.length - 3; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    const line3 = lines[i + 2];
    const line4 = lines[i + 3];
    
    if (isUnsubscribeLine(line1)) continue;
    
    // CAGI pattern: Titre / Catégorie / Lieu / Type de contrat
    if (line1.length > 5 && line2.length > 2 && line3.length > 2 && 
        (line4.includes('contract') || line4.includes('Stage') || line4.includes('Internship'))) {
      
      // Éviter les lignes de footer
      if (!line1.includes('CAGI') && !line1.includes('jobs.cagi') && 
          !line1.toLowerCase().includes('click here')) {
        jobs.push({
          entreprise: 'CAGI',
          poste: line1,
          lieu: line3,
          canal: 'cagi',
          motsCles: `${line1}, ${line2}, ${line3}`,
          source: 'CAGI Alert'
        });
      }
    }
  }
  
  return jobs;
};

export const parseJobAlert = (emailContent: string): ParsedJob[] => {
  const lines = emailContent.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  let allJobs: ParsedJob[] = [];
  
  // Détecter le format et parser en conséquence
  const contentLower = emailContent.toLowerCase();
  
  if (contentLower.includes('linkedin')) {
    allJobs = [...allJobs, ...parseLinkedInFormat(lines)];
  }
  
  if (contentLower.includes('jobup')) {
    allJobs = [...allJobs, ...parseJobUpFormat(lines)];
  }
  
  if (contentLower.includes('cagi')) {
    allJobs = [...allJobs, ...parseCAGIFormat(lines)];
  }
  
  // Si aucun format détecté, essayer tous les parsers
  if (allJobs.length === 0) {
    allJobs = [
      ...parseLinkedInFormat(lines),
      ...parseJobUpFormat(lines),
      ...parseCAGIFormat(lines)
    ];
  }
  
  // Déduplication basée sur poste + entreprise
  const uniqueJobs = allJobs.filter((job, index, self) => 
    index === self.findIndex(j => 
      j.poste.toLowerCase() === job.poste.toLowerCase() && 
      j.entreprise.toLowerCase() === job.entreprise.toLowerCase()
    )
  );
  
  return uniqueJobs;
};
