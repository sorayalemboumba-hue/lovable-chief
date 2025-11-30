import { ParsedJob } from './emailParser';

export const parsePDFJobOffer = (pdfText: string): ParsedJob | null => {
  // Nettoyer le texte
  const cleanText = pdfText.replace(/\n\n+/g, '\n').trim();
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let entreprise = '';
  let poste = '';
  let lieu = '';
  let deadline = '';
  let contact = '';
  let description = '';
  
  // Patterns de détection
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const originalLine = lines[i];
    
    // Entreprise (souvent en début ou après "Association", "Fondation", etc.)
    if (!entreprise && (
      originalLine.match(/^[A-Z][a-zA-Z\s&'-]+$/i) && originalLine.length < 50 ||
      line.includes('association') || 
      line.includes('fondation') ||
      line.includes('entreprise') ||
      line.includes('organization')
    )) {
      entreprise = originalLine;
    }
    
    // Poste (souvent avec "recherche", "un·e", "un(e)", ou titre professionnel)
    if (!poste && (
      line.includes('recherche') ||
      line.includes('un·e') ||
      line.includes('un(e)') ||
      line.includes('we are looking') ||
      line.match(/responsable|manager|coordinat|director|chef|chargé|assistant/i)
    )) {
      poste = originalLine.replace(/^(recherche|un·e|un\(e\)|we are looking for)\s*/gi, '');
    }
    
    // Lieu (Genève, Vaud, Canton, etc.)
    if (!lieu && (
      line.includes('genève') ||
      line.includes('geneva') ||
      line.includes('lausanne') ||
      line.includes('vaud') ||
      line.includes('neuchâtel') ||
      line.includes('canton')
    )) {
      lieu = originalLine;
    }
    
    // Deadline
    if (!deadline && (
      line.includes('délai') ||
      line.includes('candidature') && lines[i+1]?.match(/\d{1,2}/) ||
      line.includes('deadline') ||
      line.includes('jusqu\'au') ||
      line.includes('avant le')
    )) {
      // Chercher la date dans la ligne ou la suivante
      const dateMatch = originalLine.match(/\d{1,2}\s+\w+\s+\d{4}/) || 
                       lines[i+1]?.match(/\d{1,2}\s+\w+\s+\d{4}/);
      if (dateMatch) {
        deadline = dateMatch[0];
      }
    }
    
    // Contact email
    if (!contact && originalLine.match(/[\w.-]+@[\w.-]+\.\w+/)) {
      const emailMatch = originalLine.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) contact = emailMatch[0];
    }
    
    // Description (missions, profil)
    if (line.includes('mission') || line.includes('profil') || line.includes('compétence')) {
      description += originalLine + ' ';
    }
  }
  
  // Si on n'a pas trouvé d'entreprise, utiliser le premier mot en caps
  if (!entreprise) {
    const firstCaps = lines.find(l => l.match(/^[A-Z][a-zA-Z\s]+$/));
    if (firstCaps) entreprise = firstCaps;
  }
  
  // Si on a au moins entreprise et poste, on retourne
  if (entreprise && poste) {
    return {
      entreprise,
      poste,
      lieu: lieu || 'À préciser',
      canal: 'pdf',
      motsCles: description.substring(0, 200),
      source: 'PDF Import',
    };
  }
  
  return null;
};
