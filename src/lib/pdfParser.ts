import * as pdfjsLib from 'pdfjs-dist';
import { ParsedJob } from './emailParser';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parsePDFFile = async (file: File): Promise<ParsedJob | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return parseJobOfferText(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
};

const parseJobOfferText = (text: string): ParsedJob | null => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  let entreprise = '';
  let poste = '';
  let lieu = '';
  let deadline = '';
  let applicationEmail = '';
  let publicationDate = '';
  let applicationInstructions = '';
  const requiredDocuments: string[] = [];
  
  // Extract company name
  const companyPatterns = [
    /(?:entreprise|company|organisation|société)[:\s]+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s&'-]{2,50})/i,
    /^([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s&'-]{2,50})(?:\s+(?:recherche|recrute|is hiring))/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      entreprise = match[1].trim();
      break;
    }
  }
  
  // Extract position
  const positionPatterns = [
    /(?:poste|position|titre)[:\s]+([^.\n]{10,100})/i,
    /(?:recherche|recrute|hiring)[:\s]+(?:un|une|a)?\s*([^.\n]{10,100})/i,
    /(?:responsable|manager|coordinat|director|chef|chargé|assistant)[^.\n]{5,80}/i,
  ];
  
  for (const pattern of positionPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      poste = match[1] ? match[1].trim() : match[0].trim();
      poste = poste.replace(/^(un|une|a|the)\s+/i, '');
      break;
    }
  }
  
  // Extract location
  const locationPatterns = [
    /(?:lieu|location|localisation)[:\s]+([^.\n]{3,50})/i,
    /(Genève|Geneva|Lausanne|Vaud|Neuchâtel|Fribourg|Valais|Zürich|Bern|Basel)/i,
    /(?:canton|region)[:\s]+(?:de\s+)?([A-ZÀ-Ÿ][a-zA-Zà-ÿ\s-]{2,30})/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      lieu = match[1].trim();
      break;
    }
  }
  
  // Extract deadline
  const deadlinePatterns = [
    /(?:deadline|délai|date limite|candidature avant|envoye.*avant)[:\s]+(?:le\s+)?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
    /(?:deadline|délai|date limite|candidature avant)[:\s]+(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/i,
  ];
  
  for (const pattern of deadlinePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      deadline = match[1].trim();
      break;
    }
  }
  
  // Extract email
  const emailMatch = cleanText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    applicationEmail = emailMatch[1];
  }
  
  // Extract publication date
  const pubDatePatterns = [
    /(?:publié|published|posted)[:\s]+(?:le\s+)?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
    /(?:date de publication)[:\s]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
  ];
  
  for (const pattern of pubDatePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      publicationDate = match[1].trim();
      break;
    }
  }
  
  // Extract application instructions
  const instructionPatterns = [
    /(?:marche à suivre|candidature|application process|comment postuler)[:\s]+([^.]{20,300})/i,
    /(?:envoye|envoyez|send|submit).*?(?:cv|curriculum|lettre|motivation|certificat).*?(?:à|to|at)[:\s]+([^.]{10,200})/i,
  ];
  
  for (const pattern of instructionPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      applicationInstructions = match[0].trim();
      break;
    }
  }
  
  // Extract required documents
  const docPatterns = [
    /\b(cv|curriculum vitae|resume)\b/i,
    /\b(lettre de motivation|cover letter|motivation letter)\b/i,
    /\b(certificat|certificate|diplom|diploma)\b/i,
    /\b(attestation de travail|work certificate|reference)\b/i,
  ];
  
  docPatterns.forEach(pattern => {
    const match = cleanText.match(pattern);
    if (match) {
      const doc = match[0].trim();
      if (!requiredDocuments.includes(doc)) {
        requiredDocuments.push(doc);
      }
    }
  });
  
  // If we found at least a position, return the parsed job
  if (poste) {
    return {
      entreprise: entreprise || 'À préciser',
      poste,
      lieu: lieu || 'À préciser',
      canal: 'PDF',
      motsCles: cleanText.substring(0, 500),
      source: 'PDF importé',
      deadline,
      applicationEmail,
      publicationDate,
      applicationInstructions,
      requiredDocuments,
    } as any;
  }
  
  return null;
};
