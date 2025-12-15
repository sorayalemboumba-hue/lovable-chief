/**
 * Smart Text Analyzer - Semantic analysis for job offer imports
 * Extracts deadline, documents, contact, language, and expiration status
 */

import { ApplicationMethod, OfferLanguage } from '@/types/application';

export interface SmartAnalysisResult {
  deadline: string | null;
  deadlineMissing: boolean;
  requiredDocuments: string[];
  contactPerson: string | null;
  language: OfferLanguage;
  isExpired: boolean;
  applicationMethod: ApplicationMethod;
  applicationEmail: string | null;
}

// Deadline detection patterns
const DEADLINE_PATTERNS = [
  // French patterns
  /(?:délai|deadline|date limite|avant le|jusqu'au|d'ici le)\s*[:\-]?\s*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/gi,
  /(?:délai|deadline|date limite|avant le|jusqu'au|d'ici le)\s*[:\-]?\s*(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/gi,
  // English patterns
  /(?:deadline|apply by|before|until)\s*[:\-]?\s*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/gi,
  /(?:deadline|apply by|before|until)\s*[:\-]?\s*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/gi,
];

// Document keywords
const DOCUMENT_KEYWORDS = {
  'CV': ['cv', 'curriculum vitae', 'resume', 'lebenslauf'],
  'Lettre de motivation': ['lettre de motivation', 'lettre', 'motivation letter', 'cover letter', 'motivationsschreiben'],
  'Certificats': ['certificat', 'certificates', 'zertifikat', 'attestation', 'certificats de travail'],
  'Diplômes': ['diplôme', 'diploma', 'degree', 'zeugnis', 'diplômes'],
  'Références': ['référence', 'references', 'referenzen'],
  'Photo': ['photo', 'bild', 'portrait'],
};

// Contact patterns
const CONTACT_PATTERNS = [
  /(?:contact|contacter)\s*[:\-]?\s*([A-ZÀ-Ü][a-zà-ÿ]+\s+[A-ZÀ-Ü][a-zà-ÿ]+)/gi,
  /(?:mme|m\.|mr|mrs|ms)\s+([A-ZÀ-Ü][a-zà-ÿ]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ]+)?)/gi,
  /(?:responsable|manager|hr|rh)\s*[:\-]?\s*([A-ZÀ-Ü][a-zà-ÿ]+\s+[A-ZÀ-Ü][a-zà-ÿ]+)/gi,
];

// Email pattern
const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

// Expiration patterns
const EXPIRATION_PATTERNS = [
  /(?:annonce expirée|candidatures closes|poste pourvu|offre fermée|position filled|closed|expired)/gi,
];

// Application method patterns
const METHOD_PATTERNS = {
  Email: [/(?:envoyer|envoyez|postuler)\s*(?:par|via)?\s*e?-?mail/gi, /candidature@/gi, /hr@/gi, /recrutement@/gi],
  Formulaire: [/(?:postuler|candidater)\s*(?:en ligne|online)/gi, /(?:formulaire|form)/gi, /(?:portail|portal)/gi],
  Simplifiée: [/(?:candidature simplifiée|easy apply|postuler facilement)/gi, /linkedin.*apply/gi],
};

/**
 * Detect language of text content
 */
function detectLanguage(text: string): OfferLanguage {
  const lowerText = text.toLowerCase();
  
  // German indicators
  const germanWords = ['und', 'oder', 'für', 'mit', 'wir', 'suchen', 'stelle', 'arbeit', 'aufgaben', 'anforderungen'];
  const germanCount = germanWords.filter(word => lowerText.includes(word)).length;
  
  // French indicators
  const frenchWords = ['nous', 'vous', 'pour', 'avec', 'recherchons', 'poste', 'travail', 'missions', 'profil'];
  const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length;
  
  // English indicators
  const englishWords = ['we', 'you', 'for', 'with', 'looking', 'position', 'work', 'tasks', 'requirements', 'apply'];
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
  
  if (germanCount > frenchCount && germanCount > englishCount) {
    return 'Allemand';
  } else if (englishCount > frenchCount && englishCount >= germanCount) {
    return 'Anglais';
  }
  
  return 'Français';
}

/**
 * Parse date string to ISO format
 */
function parseDeadlineDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  try {
    // Clean the date string
    const cleaned = dateStr.trim().replace(/\s+/g, ' ');
    
    // Try different date formats
    const monthNames: Record<string, number> = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    
    // Check for "DD month YYYY" format
    const monthMatch = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (monthMatch) {
      const day = parseInt(monthMatch[1]);
      const monthName = monthMatch[2].toLowerCase();
      const year = parseInt(monthMatch[3]);
      
      if (monthNames[monthName] !== undefined) {
        const date = new Date(year, monthNames[monthName], day);
        return date.toISOString().split('T')[0];
      }
    }
    
    // Check for DD/MM/YYYY or DD.MM.YYYY format
    const numericMatch = cleaned.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (numericMatch) {
      const day = parseInt(numericMatch[1]);
      const month = parseInt(numericMatch[2]) - 1;
      let year = parseInt(numericMatch[3]);
      if (year < 100) year += 2000;
      
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract required documents from text
 */
function extractDocuments(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  for (const [docType, keywords] of Object.entries(DOCUMENT_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      found.push(docType);
    }
  }
  
  // If nothing found, default to CV
  if (found.length === 0) {
    found.push('CV');
  }
  
  return found;
}

/**
 * Extract contact person from text
 */
function extractContact(text: string): string | null {
  for (const pattern of CONTACT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | null {
  const match = text.match(EMAIL_PATTERN);
  if (match && match[0]) {
    // Filter out common non-application emails
    const email = match[0].toLowerCase();
    if (!email.includes('unsubscribe') && !email.includes('noreply') && !email.includes('no-reply')) {
      return match[0];
    }
  }
  return null;
}

/**
 * Check if offer is expired
 */
function checkExpired(text: string): boolean {
  return EXPIRATION_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Detect application method
 */
function detectMethod(text: string): ApplicationMethod {
  const lowerText = text.toLowerCase();
  
  for (const [method, patterns] of Object.entries(METHOD_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(lowerText))) {
      return method as ApplicationMethod;
    }
  }
  
  // Check for email in text
  if (extractEmail(text)) {
    return 'Email';
  }
  
  return 'Inconnu';
}

/**
 * Extract deadline from text
 */
function extractDeadline(text: string): { deadline: string | null; deadlineMissing: boolean } {
  for (const pattern of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseDeadlineDate(match[1]);
      if (parsed) {
        return { deadline: parsed, deadlineMissing: false };
      }
    }
  }
  
  return { deadline: null, deadlineMissing: true };
}

/**
 * Main analysis function - analyzes text content for job offer metadata
 */
export function analyzeJobText(text: string): SmartAnalysisResult {
  const { deadline, deadlineMissing } = extractDeadline(text);
  
  return {
    deadline,
    deadlineMissing,
    requiredDocuments: extractDocuments(text),
    contactPerson: extractContact(text),
    language: detectLanguage(text),
    isExpired: checkExpired(text),
    applicationMethod: detectMethod(text),
    applicationEmail: extractEmail(text),
  };
}

/**
 * Check for duplicates based on title + company
 */
export function checkDuplicate(
  poste: string, 
  entreprise: string, 
  existingApplications: { poste: string; entreprise: string }[]
): boolean {
  const normalizedPoste = poste.toLowerCase().trim();
  const normalizedEntreprise = entreprise.toLowerCase().trim();
  
  return existingApplications.some(app => 
    app.poste.toLowerCase().trim() === normalizedPoste &&
    app.entreprise.toLowerCase().trim() === normalizedEntreprise
  );
}

/**
 * Clean and validate title - if it's a URL, return empty string
 */
export function cleanTitle(title: string | undefined): string {
  if (!title) return '';
  const trimmed = title.trim();
  
  // If title starts with http(s), it's a URL, not a title
  if (trimmed.toLowerCase().startsWith('http')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Extract company name from text using semantic patterns
 * Priority: Line after title with "·" or "-" separator, then fallback patterns
 */
export function extractCompany(text: string): string | null {
  // Split text into lines
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // PRIORITY 1: Look for "Company · Location" or "Company - Location" pattern
  // This is the common format in job alert emails (e.g., "Explora Journeys · Genève")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for separator patterns (middle dot, dash, pipe)
    const separatorMatch = line.match(/^([^·\-|]+)\s*[·\-|]\s*(.+)$/);
    if (separatorMatch) {
      const leftPart = separatorMatch[1].trim();
      const rightPart = separatorMatch[2].trim();
      
      // Check if right part looks like a location (city names)
      const locationPatterns = /^(Genève|Lausanne|Zurich|Berne|Bâle|Fribourg|Paris|Lyon|Remote|Suisse|Switzerland|France|Geneva|Vaud)/i;
      if (locationPatterns.test(rightPart) && leftPart.length > 1 && leftPart.length < 50) {
        // Left part is company, right part is location
        return leftPart;
      }
      
      // If left part looks like location, right part might be company
      if (locationPatterns.test(leftPart) && rightPart.length > 1 && rightPart.length < 50) {
        return rightPart;
      }
      
      // If neither is obvious location, assume left is company
      if (leftPart.length > 1 && leftPart.length < 50 && !leftPart.toLowerCase().startsWith('http')) {
        return leftPart;
      }
    }
  }
  
  // PRIORITY 2: Look for explicit patterns
  const explicitPatterns = [
    /(?:chez|entreprise|société|employeur)\s*[:\-]?\s*([A-ZÀ-Ü][A-Za-zÀ-ÿ\s&.-]+?)(?:\s*[,.\n]|$)/gi,
    /(?:rejoindre|rejoignez)\s+([A-ZÀ-Ü][A-Za-zÀ-ÿ\s&.-]+?)(?:\s*[,.\n!]|$)/gi,
  ];
  
  for (const pattern of explicitPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const company = match[1].trim();
        const excludedWords = ['cv', 'lettre', 'motivation', 'poste', 'candidature', 'offre', 'emploi', 'job', 'cdi', 'cdd', 'nous', 'notre', 'équipe'];
        if (!excludedWords.includes(company.toLowerCase()) && company.length > 1 && company.length < 50) {
          return company;
        }
      }
    }
  }
  
  // PRIORITY 3: Look for ALL CAPS company names (common pattern)
  const capsMatches = text.match(/\b([A-Z][A-Z\s&.-]{2,25})\b/g);
  if (capsMatches) {
    for (const match of capsMatches) {
      const company = match.trim();
      const excludedCaps = ['CV', 'CDI', 'CDD', 'CEO', 'CFO', 'HR', 'PDF', 'URL', 'URGENT', 'NOUVEAU', 'NEW', 'JOB', 'OFFRE', 'EMPLOI'];
      if (!excludedCaps.includes(company) && company.length > 2 && company.length < 30) {
        return company;
      }
    }
  }
  
  return null;
}

/**
 * Extract location from a line with separator
 */
export function extractLocationFromLine(text: string): string | null {
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    const separatorMatch = line.match(/^([^·\-|]+)\s*[·\-|]\s*(.+)$/);
    if (separatorMatch) {
      const rightPart = separatorMatch[2].trim();
      const locationPatterns = /^(Genève|Lausanne|Zurich|Berne|Bâle|Fribourg|Paris|Lyon|Remote|Suisse|Switzerland|France|Geneva|Vaud)/i;
      if (locationPatterns.test(rightPart)) {
        return rightPart;
      }
    }
  }
  
  return null;
}
