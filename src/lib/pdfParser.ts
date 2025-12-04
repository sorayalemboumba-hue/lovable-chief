import * as pdfjsLib from 'pdfjs-dist';
import { ParsedJob } from './emailParser';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// OCE/ORP Detection patterns
const OCE_PATTERNS = [
  /office\s+cantonal\s+de\s+l['']?emploi/i,
  /\bOCE\b/,
  /\bORP\b/,
  /office\s+régional\s+de\s+placement/i,
  /service\s+public\s+de\s+l['']?emploi/i,
];

const detectOCE = (text: string): boolean => {
  return OCE_PATTERNS.some(pattern => pattern.test(text));
};

export const parsePDFFile = async (file: File): Promise<ParsedJob | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    console.log(`PDF parsing: ${numPages} pages detected`);
    
    // Extract text from ALL pages - don't skip any
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Better text extraction with proper spacing
        let pageText = '';
        let lastY = 0;
        
        textContent.items.forEach((item: any) => {
          if (item.str) {
            // Add newline if Y position changed significantly (new line)
            if (lastY && Math.abs(item.transform[5] - lastY) > 5) {
              pageText += '\n';
            }
            pageText += item.str + ' ';
            lastY = item.transform[5];
          }
        });
        
        // Only add if page has meaningful content
        const trimmedPage = pageText.trim();
        if (trimmedPage.length > 20) {
          fullText += `\n--- Page ${i} ---\n` + trimmedPage + '\n';
        }
      } catch (pageError) {
        console.warn(`Error extracting page ${i}:`, pageError);
        continue;
      }
    }
    
    console.log(`PDF total extracted text length: ${fullText.length} chars`);
    
    if (fullText.length < 50) {
      console.error('PDF text extraction failed - too little content');
      return null;
    }
    
    return parseJobOfferText(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
};

const parseJobOfferText = (text: string): ParsedJob | null => {
  // Clean text but preserve structure for better parsing
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const originalText = text; // Keep original for reference
  
  let entreprise = '';
  let poste = '';
  let lieu = '';
  let deadline = '';
  let applicationEmail = '';
  let publicationDate = '';
  let applicationInstructions = '';
  const requiredDocuments: string[] = [];
  
  // Detect if OCE/ORP document
  const isOCE = detectOCE(cleanText);
  
  // Extract company name
  const companyPatterns = [
    /(?:entreprise|company|organisation|société|employeur)[:\s]+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s&'-]{2,50})/i,
    /^([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s&'-]{2,50})(?:\s+(?:recherche|recrute|is hiring))/i,
    /(?:pour|pour le compte de|chez)\s+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s&'-]{2,50})/i,
    /(?:mandataire|client)[:\s]+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s&'-]{2,50})/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      entreprise = match[1].trim();
      break;
    }
  }
  
  // Extract position - enhanced patterns
  const positionPatterns = [
    /(?:poste|position|titre|fonction)[:\s]+([^.\n]{10,100})/i,
    /(?:recherche|recrute|hiring)[:\s]+(?:un|une|a)?\s*([^.\n]{10,100})/i,
    /(?:offre d['']?emploi)[:\s]+([^.\n]{10,100})/i,
    /(?:responsable|manager|coordinat|director|chef|chargé|assistant|secrétaire|comptable|conseiller)[^.\n]{5,80}/i,
  ];
  
  for (const pattern of positionPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      poste = match[1] ? match[1].trim() : match[0].trim();
      poste = poste.replace(/^(un|une|a|the)\s+/i, '');
      // Clean up common artifacts
      poste = poste.replace(/\s+/g, ' ').substring(0, 80);
      break;
    }
  }
  
  // If still no position found, try to find title-like patterns
  if (!poste) {
    const titleMatch = cleanText.match(/(?:^|\n)\s*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s\-\/]+(?:100%|80%|50%)?)\s*(?:\n|$)/);
    if (titleMatch && titleMatch[1].length > 10 && titleMatch[1].length < 80) {
      poste = titleMatch[1].trim();
    }
  }
  
  // Extract location - enhanced for Swiss cantons
  const locationPatterns = [
    /(?:lieu de travail|location|localisation|place of work)[:\s]+([^.\n]{3,50})/i,
    /(Genève|Geneva|Lausanne|Vaud|Neuchâtel|Fribourg|Valais|Zürich|Zurich|Bern|Berne|Basel|Bâle)/i,
    /(?:canton|region|région)[:\s]+(?:de\s+)?([A-ZÀ-Ÿ][a-zA-Zà-ÿ\s-]{2,30})/i,
    /(?:à|at|in)\s+(Genève|Geneva|Lausanne|Nyon|Morges|Vernier|Carouge|Vevey)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      lieu = match[1].trim();
      break;
    }
  }
  
  // Default to Geneva for OCE
  if (!lieu && isOCE) {
    lieu = 'Genève';
  }
  
  // Extract deadline - enhanced patterns
  const deadlinePatterns = [
    /(?:deadline|délai|date limite|candidature(?:s)? avant|envoye.*avant|postuler avant|à envoyer avant le|jusqu['']?au)[:\s]+(?:le\s+)?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
    /(?:deadline|délai|date limite)[:\s]+(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/i,
    /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\s*(?:au plus tard|dernier délai)/i,
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
    /(?:publié|published|posted|date de publication)[:\s]+(?:le\s+)?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
    /(?:annonce du|offre du)\s+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
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
    /(?:marche à suivre|candidature|application process|comment postuler|pour postuler)[:\s]+([^.]{20,300})/i,
    /(?:envoye|envoyez|send|submit|adresser|transmettre).*?(?:cv|curriculum|lettre|motivation|certificat|dossier).*?(?:à|to|at)[:\s]+([^.]{10,200})/i,
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
    /\b(attestation de travail|work certificate|reference|références)\b/i,
    /\b(extrait de casier|casier judiciaire)\b/i,
    /\b(permis de travail|autorisation de travail)\b/i,
  ];
  
  docPatterns.forEach(pattern => {
    const match = cleanText.match(pattern);
    if (match) {
      const doc = match[0].trim();
      if (!requiredDocuments.some(d => d.toLowerCase() === doc.toLowerCase())) {
        requiredDocuments.push(doc);
      }
    }
  });
  
  // For OCE documents, add proof of application requirement
  if (isOCE) {
    if (!requiredDocuments.includes('Preuve de candidature')) {
      requiredDocuments.push('Preuve de candidature');
    }
  }
  
  // Build result if we found at least something meaningful
  if (poste || entreprise) {
    const result: any = {
      entreprise: entreprise || (isOCE ? 'Via OCE' : 'À préciser'),
      poste: poste || 'Poste à identifier',
      lieu: lieu || 'À préciser',
      canal: isOCE ? 'OCE' : 'PDF',
      motsCles: cleanText.substring(0, 800),
      source: isOCE ? 'Office Cantonal de l\'Emploi' : 'PDF importé',
      deadline,
      applicationEmail,
      publicationDate,
      applicationInstructions,
      requiredDocuments,
      // OCE-specific fields
      isOCE,
      priority: isOCE ? 1 : undefined, // Priority 1 = URGENT for OCE
      notes: isOCE ? '⚠️ OFFRE OCE - Preuve de candidature requise pour validation ORP' : undefined,
    };
    
    return result as ParsedJob;
  }
  
  return null;
};
