export interface ParsedJob {
  entreprise: string;
  poste: string;
  lieu: string;
  canal: string;
  motsCles?: string;
  source: string;
}

export const parseJobAlert = (emailContent: string): ParsedJob[] => {
  const jobs: ParsedJob[] = [];
  const lines = emailContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Simple parser for job alerts (LinkedIn, Jobup format)
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    // Detect job title and company/location pattern
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
            source: 'Email Alert'
          });
        }
      }
    }
  }
  
  return jobs;
};
