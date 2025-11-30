import { ParsedJob } from './emailParser';

export const parseTextJobOffer = (text: string): ParsedJob | null => {
  // Nettoyer le texte
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  let entreprise = '';
  let poste = '';
  let lieu = '';
  let deadline = '';
  let contact = '';
  
  // LinkedIn pattern: "En prévision... Autonomia est à la recherche d'un·e Responsable..."
  const linkedInMatch = cleanText.match(/(\w+(?:\s+\w+)?)\s+(?:est|recherche|is looking|are looking).*?(?:un·e|un\(e\)|a)\s+([^.]+?)(?:\s+en\s+CDI|\s+à|\s+\(|\.)/i);
  if (linkedInMatch) {
    entreprise = linkedInMatch[1].trim();
    poste = linkedInMatch[2].trim();
  }
  
  // Pattern alternatif: chercher "Responsable de..." au début
  if (!poste) {
    const posteMatch = cleanText.match(/^.*?((?:Responsable|Manager|Coordinat|Director|Chef|Chargé|Assistant).*?)(?:\s+en\s+CDI|\s+à|\()/i);
    if (posteMatch) {
      poste = posteMatch[1].trim();
    }
  }
  
  // Extraire entreprise si pas trouvée
  if (!entreprise) {
    const nameMatch = cleanText.match(/^([A-Z][a-zA-Zé\s&'-]+?)(?:\s+est|\s+recherche|\s+-)/);
    if (nameMatch) entreprise = nameMatch[1].trim();
  }
  
  // Lieu (Genève, Vaud, etc.)
  const lieuMatch = cleanText.match(/(Genève|Geneva|Lausanne|Vaud|Neuchâtel|Fribourg|Valais|canton de \w+)/i);
  if (lieuMatch) lieu = lieuMatch[1];
  
  // Deadline
  const deadlineMatch = cleanText.match(/(?:Délai|deadline|jusqu'au|avant le|by).*?(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i);
  if (deadlineMatch) deadline = deadlineMatch[1];
  
  // Contact email
  const emailMatch = cleanText.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) contact = emailMatch[0];
  
  // URL LinkedIn ou autre
  let url = '';
  const urlMatch = cleanText.match(/https?:\/\/[^\s]+/);
  if (urlMatch) url = urlMatch[0];
  
  // Si on a au moins un poste
  if (poste) {
    return {
      entreprise: entreprise || 'À préciser',
      poste,
      lieu: lieu || 'À préciser',
      canal: 'texte-libre',
      motsCles: cleanText.substring(0, 300),
      source: 'Texte libre',
    };
  }
  
  return null;
};
