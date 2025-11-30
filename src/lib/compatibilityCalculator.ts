import { Application } from '@/types/application';
import { sorayaProfile } from '@/data/profile';

export interface CompatibilityResult {
  score: number;
  matchingSkills: string[];
  missingRequirements: string[];
  recommendation: 'excellent' | 'good' | 'fair' | 'low';
  shouldApply: boolean;
}

export const calculateCompatibility = (application: Application): CompatibilityResult => {
  const keywords = (application.keywords || '').toLowerCase();
  const poste = application.poste.toLowerCase();
  const allText = `${keywords} ${poste}`;
  
  // Collecter toutes les compétences du profil
  const allSkills = [
    ...Object.values(sorayaProfile.competencesExpertises).flat(),
    ...Object.values(sorayaProfile.competencesTechniques).flat()
  ];
  
  // Compétences correspondantes
  const matchingSkills = allSkills.filter(skill => 
    allText.includes(skill.toLowerCase())
  );
  
  // Mots-clés du poste qui pourraient être des pré-requis
  const jobKeywords = allText.split(/[,;\s]+/).filter(word => word.length > 3);
  
  // Identifier les pré-requis manquants (mots-clés importants non couverts par les compétences)
  const potentialRequirements = jobKeywords.filter(keyword => 
    !allSkills.some(skill => skill.toLowerCase().includes(keyword)) &&
    !sorayaProfile.experiences.some(exp => 
      exp.poste.toLowerCase().includes(keyword)
    )
  );
  
  // Critères de correspondance
  const experienceMatch = sorayaProfile.experiences.some(exp =>
    allText.includes(exp.entreprise.toLowerCase()) ||
    exp.poste.toLowerCase().split(' ').some(word => 
      allText.includes(word) && word.length > 5
    )
  );
  
  const educationMatch = allText.includes('hospitality') || 
                         allText.includes('communication') ||
                         allText.includes('marketing') ||
                         allText.includes('événementiel');
  
  // Calcul du score
  let score = 0;
  
  // Compétences correspondantes (jusqu'à 50 points)
  score += Math.min(matchingSkills.length * 5, 50);
  
  // Expérience pertinente (20 points)
  if (experienceMatch) score += 20;
  
  // Formation pertinente (15 points)
  if (educationMatch) score += 15;
  
  // Longueur de la description (indique une bonne analyse) (15 points)
  if (keywords.length > 50) score += 15;
  
  // Normaliser sur 100
  score = Math.min(score, 100);
  
  // Déterminer la recommandation
  let recommendation: CompatibilityResult['recommendation'];
  let shouldApply: boolean;
  
  if (score >= 80) {
    recommendation = 'excellent';
    shouldApply = true;
  } else if (score >= 70) {
    recommendation = 'good';
    shouldApply = true;
  } else if (score >= 60) {
    recommendation = 'fair';
    shouldApply = true;
  } else {
    recommendation = 'low';
    shouldApply = false;
  }
  
  // Limiter les pré-requis manquants aux plus pertinents
  const missingRequirements = potentialRequirements
    .filter(req => req.length > 4)
    .slice(0, 5);
  
  return {
    score,
    matchingSkills: matchingSkills.slice(0, 10),
    missingRequirements,
    recommendation,
    shouldApply
  };
};
