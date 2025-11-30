/**
 * Règles d'exclusion pour le filtrage automatique des offres
 * Basées sur les critères de la candidate en Suisse romande
 */

export interface ExclusionFlags {
  isStage: boolean;
  isOutsideGEVD: boolean;
  requiresGerman: boolean;
}

/**
 * Détecte si une offre est un stage ou non rémunéré
 */
export function detectStageOrUnpaid(text: string): boolean {
  const stagePatterns = [
    /\bstage\b/i,
    /\bstagiaire\b/i,
    /\binternship\b/i,
    /\bintern\b/i,
    /\bnon[\s-]?rémunéré/i,
    /\bunpaid\b/i,
    /\bbénévole\b/i,
    /\bvolunteer\b/i
  ];
  
  return stagePatterns.some(pattern => pattern.test(text));
}

/**
 * Détecte si une offre est en dehors de la zone GE-VD (Suisse romande)
 */
export function detectOutsideGEVD(lieu: string): boolean {
  if (!lieu) return false;
  
  const lieuLower = lieu.toLowerCase();
  
  // Accepter uniquement Genève et Vaud
  const acceptedZones = [
    /genève/i,
    /geneva/i,
    /\bge\b/i,
    /vaud/i,
    /lausanne/i,
    /\bvd\b/i,
    /morges/i,
    /nyon/i,
    /yverdon/i,
    /montreux/i,
    /vevey/i
  ];
  
  // Si correspond à une zone acceptée, ce n'est PAS à exclure
  if (acceptedZones.some(pattern => pattern.test(lieu))) {
    return false;
  }
  
  // Rejeter explicitement d'autres cantons/villes suisses
  const rejectedZones = [
    /bern/i,
    /berne/i,
    /zürich/i,
    /zurich/i,
    /basel/i,
    /bâle/i,
    /lucern/i,
    /lucerne/i,
    /st[\.\s]gallen/i,
    /saint[\s-]gall/i,
    /neuchâtel/i,
    /fribourg/i,
    /valais/i,
    /wallis/i,
    /tessin/i,
    /ticino/i,
    /graubünden/i,
    /grisons/i,
    /\bbern\b/i,
    /\bzh\b/i,
    /\bbs\b/i,
    /\blu\b/i,
    /\bsg\b/i,
    /\bne\b/i,
    /\bfr\b/i,
    /\bvs\b/i,
    /\bti\b/i,
    /\bgr\b/i
  ];
  
  return rejectedZones.some(pattern => pattern.test(lieu));
}

/**
 * Détecte si l'offre requiert l'allemand
 */
export function detectGermanRequired(text: string): boolean {
  const germanPatterns = [
    /allemand\s+(courant|obligatoire|requis|exigé|indispensable)/i,
    /deutsch\s+(fließend|erforderlich|vorausgesetzt)/i,
    /german\s+(fluent|required|mandatory)/i,
    /langue\s+allemande\s+(requise|obligatoire)/i,
    /maîtrise\s+de\s+l'allemand/i,
    /bilingu[ea]\s+(français|fr)[\s\/-]allemand/i,
    /bilingu[ea]\s+allemand[\s\/-](français|fr)/i
  ];
  
  return germanPatterns.some(pattern => pattern.test(text));
}

/**
 * Évalue toutes les règles d'exclusion pour une offre
 */
export function evaluateExclusionRules(
  poste: string,
  lieu: string,
  keywords?: string,
  notes?: string
): ExclusionFlags {
  const fullText = `${poste} ${keywords || ''} ${notes || ''}`;
  
  return {
    isStage: detectStageOrUnpaid(fullText),
    isOutsideGEVD: detectOutsideGEVD(lieu),
    requiresGerman: detectGermanRequired(fullText)
  };
}

/**
 * Vérifie si une offre doit être exclue selon les règles
 */
export function shouldExcludeOffer(flags: ExclusionFlags): boolean {
  return flags.isStage || flags.isOutsideGEVD || flags.requiresGerman;
}

/**
 * Génère un message explicatif pour l'exclusion
 */
export function getExclusionReason(flags: ExclusionFlags): string {
  const reasons: string[] = [];
  
  if (flags.isStage) {
    reasons.push('Stage/non rémunéré');
  }
  if (flags.isOutsideGEVD) {
    reasons.push('Hors zone GE-VD');
  }
  if (flags.requiresGerman) {
    reasons.push('Allemand requis');
  }
  
  return reasons.join(', ');
}
