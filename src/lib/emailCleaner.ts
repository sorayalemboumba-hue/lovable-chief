/**
 * Email content cleaner - removes signatures, footers, and other parasitic content
 */

// Patterns to identify signature blocks and junk content
const SIGNATURE_PATTERNS = [
  /^-{2,}$/m, // -- separator
  /^_{3,}$/m, // ___ separator
  /sent from (?:my )?(?:iphone|ipad|android|samsung|mobile)/i,
  /envoyé depuis (?:mon )?(?:iphone|ipad|android|samsung|mobile)/i,
  /get outlook for/i,
  /télécharger outlook/i,
  /^cordialement,?\s*$/mi,
  /^best regards,?\s*$/mi,
  /^meilleures salutations,?\s*$/mi,
  /^salutations,?\s*$/mi,
  /^sincerely,?\s*$/mi,
];

const FOOTER_PATTERNS = [
  /se désabonner/i,
  /unsubscribe/i,
  /désinscrire/i,
  /désinscription/i,
  /modifier les paramètres/i,
  /click here if you no longer/i,
  /vous êtes inscrit comme/i,
  /cliquez ici pour/i,
  /to stop receiving/i,
  /pour ne plus recevoir/i,
  /gestion des préférences/i,
  /manage preferences/i,
  /privacy policy/i,
  /politique de confidentialité/i,
  /©\s*\d{4}/i, // Copyright lines
  /^this email was sent to/i,
  /cet email a été envoyé/i,
  /powered by/i,
  /propulsé par/i,
];

const HEADER_PATTERNS = [
  /^(?:de|from)\s*:/i,
  /^(?:à|to)\s*:/i,
  /^(?:date|sent)\s*:/i,
  /^(?:objet|subject)\s*:/i,
  /^(?:cc|cci|bcc)\s*:/i,
  /^(?:re|fw|tr|fwd)\s*:/i,
];

/**
 * Clean email content by removing signatures, footers, and other parasitic content
 */
export function cleanEmailContent(content: string): string {
  let lines = content.split('\n');
  let cleanedLines: string[] = [];
  let foundSignature = false;
  let skipNextLines = 0;
  
  // First pass: remove obvious headers at the start
  let startIndex = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (HEADER_PATTERNS.some(p => p.test(line))) {
      startIndex = i + 1;
    }
  }
  lines = lines.slice(startIndex);
  
  // Second pass: process remaining lines
  for (let i = 0; i < lines.length; i++) {
    if (skipNextLines > 0) {
      skipNextLines--;
      continue;
    }
    
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for signature start
    if (!foundSignature && SIGNATURE_PATTERNS.some(p => p.test(trimmedLine))) {
      foundSignature = true;
      continue;
    }
    
    // Check for footer content
    if (FOOTER_PATTERNS.some(p => p.test(trimmedLine))) {
      // Skip this and potentially following lines
      skipNextLines = 3;
      continue;
    }
    
    // Skip after signature detected
    if (foundSignature) {
      // Allow adding content again if we hit a clear job listing indicator
      if (/(?:poste|emploi|offre|job|position|entreprise)/i.test(trimmedLine) && trimmedLine.length > 20) {
        foundSignature = false;
        cleanedLines.push(line);
      }
      continue;
    }
    
    // Skip empty lines at the beginning
    if (cleanedLines.length === 0 && trimmedLine === '') {
      continue;
    }
    
    // Skip very short standalone lines that look like signatures
    if (trimmedLine.length > 0 && trimmedLine.length < 30) {
      // Check if it looks like a name signature
      if (/^[A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?$/.test(trimmedLine)) {
        const nextLine = lines[i + 1]?.trim() || '';
        const prevLine = lines[i - 1]?.trim() || '';
        // If surrounded by empty lines, it's probably a signature
        if (prevLine === '' || nextLine === '' || /^\+?\d/.test(nextLine) || /@/.test(nextLine)) {
          foundSignature = true;
          continue;
        }
      }
    }
    
    cleanedLines.push(line);
  }
  
  // Final cleanup: remove trailing empty lines
  while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
    cleanedLines.pop();
  }
  
  return cleanedLines.join('\n');
}

/**
 * Extract the job-relevant content from an email, removing all email-specific noise
 */
export function extractJobContent(emailContent: string): string {
  let content = cleanEmailContent(emailContent);
  
  // Remove URLs that are clearly tracking/unsubscribe links
  content = content.replace(/https?:\/\/[^\s]*(?:unsubscribe|track|click|email)[^\s]*/gi, '');
  
  // Remove email addresses that look like system/noreply addresses
  content = content.replace(/\b(?:noreply|no-reply|donotreply|mailer|newsletter)@[^\s]+/gi, '');
  
  // Clean up excessive whitespace
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.replace(/[ \t]+/g, ' ');
  
  return content.trim();
}
