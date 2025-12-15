import { ParsedJob } from './emailParser';

interface ExtractedLink {
  text: string;
  url: string;
}

/**
 * Parse HTML email content to extract job offers with their links
 */
export function parseHtmlEmailContent(htmlContent: string): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  
  // Create a DOM parser to extract links
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Extract all links with their text and URLs
  const links: ExtractedLink[] = [];
  const anchors = doc.querySelectorAll('a[href]');
  
  anchors.forEach(anchor => {
    const url = anchor.getAttribute('href') || '';
    const text = anchor.textContent?.trim() || '';
    
    // Filter out unsubscribe and tracking links
    if (isValidJobLink(url, text)) {
      links.push({ text, url });
    }
  });
  
  // Group links by proximity (job title + apply button)
  const jobGroups = groupLinksIntoJobs(doc, links);
  
  for (const group of jobGroups) {
    const job = extractJobFromGroup(group, htmlContent);
    if (job) {
      jobs.push(job);
    }
  }
  
  // If no structured jobs found, try line-by-line extraction
  if (jobs.length === 0) {
    const fallbackJobs = extractJobsFromText(doc, links);
    jobs.push(...fallbackJobs);
  }
  
  // Deduplicate by poste + entreprise
  return deduplicateJobs(jobs);
}

function isValidJobLink(url: string, text: string): boolean {
  const excludePatterns = [
    'unsubscribe', 'désabonner', 'désinscription',
    'mailto:', 'tel:', '#', 'javascript:',
    'privacy', 'confidentialité', 'terms', 'conditions',
    'facebook.com', 'twitter.com', 'instagram.com',
    'linkedin.com/company', 'linkedin.com/feed',
    'google.com/maps', 'maps.google',
    'tracking', 'click.', 'open.',
  ];
  
  const urlLower = url.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exclude short or empty text
  if (text.length < 3) return false;
  
  // Exclude common footer/nav links
  for (const pattern of excludePatterns) {
    if (urlLower.includes(pattern) || textLower.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

interface JobGroup {
  titleLink?: ExtractedLink;
  applyLink?: ExtractedLink;
  companyLink?: ExtractedLink;
  contextText: string;
}

function groupLinksIntoJobs(doc: Document, links: ExtractedLink[]): JobGroup[] {
  const groups: JobGroup[] = [];
  const usedLinks = new Set<string>();
  
  // Keywords that indicate an apply button
  const applyKeywords = [
    'postuler', 'apply', 'candidater', 'voir', 'view', 
    'détails', 'details', 'lire', 'read', 'more', 'plus',
    'consulter', 'découvrir'
  ];
  
  // Look for job patterns: Title followed by Apply link
  for (const link of links) {
    if (usedLinks.has(link.url)) continue;
    
    const textLower = link.text.toLowerCase();
    const isApplyButton = applyKeywords.some(kw => textLower.includes(kw));
    
    // If it's a job title (longer text, not an action button)
    if (!isApplyButton && link.text.length > 10) {
      const group: JobGroup = {
        titleLink: link,
        contextText: extractContextAroundLink(doc, link.url)
      };
      
      // Look for a nearby apply button
      const nearbyApply = findNearbyApplyLink(doc, link.url, links, applyKeywords);
      if (nearbyApply) {
        group.applyLink = nearbyApply;
        usedLinks.add(nearbyApply.url);
      }
      
      usedLinks.add(link.url);
      groups.push(group);
    }
  }
  
  // Also look for apply buttons that might be standalone
  for (const link of links) {
    if (usedLinks.has(link.url)) continue;
    
    const textLower = link.text.toLowerCase();
    const isApplyButton = applyKeywords.some(kw => textLower.includes(kw));
    
    if (isApplyButton) {
      // This is an apply button without a detected title
      const contextText = extractContextAroundLink(doc, link.url);
      groups.push({
        applyLink: link,
        contextText
      });
      usedLinks.add(link.url);
    }
  }
  
  return groups;
}

function extractContextAroundLink(doc: Document, url: string): string {
  const anchor = doc.querySelector(`a[href="${url}"]`);
  if (!anchor) return '';
  
  // Get parent elements up to 3 levels for context
  let context = '';
  let current = anchor.parentElement;
  for (let i = 0; i < 3 && current; i++) {
    context = current.textContent || '';
    if (context.length > 50) break;
    current = current.parentElement;
  }
  
  return context.trim();
}

function findNearbyApplyLink(
  doc: Document, 
  titleUrl: string, 
  links: ExtractedLink[],
  applyKeywords: string[]
): ExtractedLink | undefined {
  const titleAnchor = doc.querySelector(`a[href="${titleUrl}"]`);
  if (!titleAnchor) return undefined;
  
  const parent = titleAnchor.parentElement?.parentElement || titleAnchor.parentElement;
  if (!parent) return undefined;
  
  // Look for apply links in the same container
  for (const link of links) {
    if (link.url === titleUrl) continue;
    
    const textLower = link.text.toLowerCase();
    const isApplyButton = applyKeywords.some(kw => textLower.includes(kw));
    
    if (isApplyButton) {
      const linkAnchor = doc.querySelector(`a[href="${link.url}"]`);
      if (linkAnchor && parent.contains(linkAnchor)) {
        return link;
      }
    }
  }
  
  return undefined;
}

function extractJobFromGroup(group: JobGroup, originalHtml: string): ParsedJob | null {
  let poste = '';
  let url = '';
  let entreprise = 'À déterminer';
  let lieu = 'Suisse';
  
  // Extract job title
  if (group.titleLink) {
    poste = cleanJobTitle(group.titleLink.text);
    url = group.titleLink.url;
  } else if (group.applyLink) {
    // Try to extract title from context
    poste = extractTitleFromContext(group.contextText);
    url = group.applyLink.url;
  }
  
  if (!poste || poste.length < 5) return null;
  
  // Extract company and location from context
  const { company, location } = extractCompanyAndLocation(group.contextText);
  if (company) entreprise = company;
  if (location) lieu = location;
  
  // Detect source from URL
  const source = detectSource(url);
  
  return {
    entreprise,
    poste,
    lieu,
    canal: source.toLowerCase(),
    source,
    motsCles: `${poste}, ${entreprise}`,
    url
  } as ParsedJob & { url: string };
}

function cleanJobTitle(text: string): string {
  return text
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

function extractTitleFromContext(context: string): string {
  const lines = context.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 10);
  
  // First line is often the title
  if (lines.length > 0) {
    return cleanJobTitle(lines[0]);
  }
  
  return '';
}

function extractCompanyAndLocation(context: string): { company?: string; location?: string } {
  const result: { company?: string; location?: string } = {};
  
  // Common Swiss locations
  const locations = [
    'Genève', 'Geneva', 'Lausanne', 'Zürich', 'Zurich', 'Berne', 'Bern',
    'Vaud', 'Neuchâtel', 'Fribourg', 'Valais', 'Sion', 'Montreux',
    'Nyon', 'Morges', 'Yverdon', 'Suisse', 'Switzerland', 'Basel', 'Bâle',
    'Tessin', 'Lugano', 'Remote', 'Télétravail', 'Hybrid', 'Hybride'
  ];
  
  const contextLower = context.toLowerCase();
  
  for (const loc of locations) {
    if (contextLower.includes(loc.toLowerCase())) {
      result.location = loc;
      break;
    }
  }
  
  // Try to extract company from patterns like "at Company" or "chez Entreprise"
  const companyPatterns = [
    /(?:at|chez|@)\s+([A-Z][A-Za-zÀ-ÿ\s&.']+?)(?:\s*[,·\-|]|$)/,
    /([A-Z][A-Za-zÀ-ÿ]{2,}(?:\s+[A-Z][A-Za-zÀ-ÿ]+)*)\s*[·•|]\s*(?:Genève|Geneva|Lausanne|Zürich)/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = context.match(pattern);
    if (match && match[1]) {
      result.company = match[1].trim().substring(0, 50);
      break;
    }
  }
  
  return result;
}

function detectSource(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('linkedin.com')) return 'LinkedIn';
  if (urlLower.includes('jobup.ch')) return 'JobUp';
  if (urlLower.includes('indeed.com')) return 'Indeed';
  if (urlLower.includes('cagi.ch') || urlLower.includes('jobs.cagi')) return 'CAGI';
  if (urlLower.includes('jobs.ch')) return 'Jobs.ch';
  if (urlLower.includes('jobcloud')) return 'JobCloud';
  if (urlLower.includes('monster')) return 'Monster';
  if (urlLower.includes('glassdoor')) return 'Glassdoor';
  
  return 'Email Alert';
}

function extractJobsFromText(doc: Document, links: ExtractedLink[]): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  const bodyText = doc.body?.textContent || '';
  const lines = bodyText.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 10);
  
  // LinkedIn format: Title followed by "Company · Location"
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    if (nextLine && nextLine.includes('·')) {
      const parts = nextLine.split('·');
      if (parts.length >= 2) {
        const entreprise = parts[0].trim();
        const lieu = parts[1].trim();
        
        if (entreprise.length > 2 && lieu.length > 2 && currentLine.length > 5) {
          // Find matching URL if exists
          const matchingLink = links.find(l => 
            l.text.includes(currentLine.substring(0, 20)) || 
            currentLine.includes(l.text.substring(0, 20))
          );
          
          jobs.push({
            entreprise,
            poste: currentLine,
            lieu,
            canal: 'linkedin',
            source: 'LinkedIn Alert',
            motsCles: `${currentLine}, ${entreprise}`,
            url: matchingLink?.url
          } as ParsedJob & { url?: string });
        }
      }
    }
  }
  
  return jobs;
}

function deduplicateJobs(jobs: ParsedJob[]): ParsedJob[] {
  return jobs.filter((job, index, self) => 
    index === self.findIndex(j => 
      j.poste.toLowerCase() === job.poste.toLowerCase() && 
      j.entreprise.toLowerCase() === job.entreprise.toLowerCase()
    )
  );
}

/**
 * Extract plain text from HTML while preserving structure
 */
export function htmlToCleanText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Replace br and block elements with newlines
  const blockElements = doc.querySelectorAll('br, p, div, li, tr');
  blockElements.forEach(el => {
    el.insertAdjacentText('afterend', '\n');
  });
  
  return doc.body?.textContent?.trim() || '';
}
