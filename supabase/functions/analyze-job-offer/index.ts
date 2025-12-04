import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to calculate default deadline (today + 2 days)
function getDefaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().split('T')[0];
}

// Detect OCE/ORP documents
function detectOCE(text: string): boolean {
  const patterns = [
    /office\s+cantonal\s+de\s+l['']?emploi/i,
    /\bOCE\b/,
    /\bORP\b/,
    /office\s+régional\s+de\s+placement/i,
    /REPUBLIQUE\s+ET\s+CANTON\s+DE\s+GENEVE/i,
    /assignation/i,
    /demande\s+de\s+candidature/i,
  ];
  return patterns.some(pattern => pattern.test(text));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, userProfile } = await req.json();
    
    // Handle empty or missing job description gracefully
    if (!jobDescription || jobDescription.trim().length < 20) {
      console.log('Job description too short or empty, returning extraction_failed warning');
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'extraction_failed',
          text: '',
          compatibility: 50,
          matching_skills: [],
          missing_requirements: [],
          keywords: '',
          recommended_channel: 'direct',
          required_documents: ['CV', 'Lettre de motivation'],
          deadline: getDefaultDeadline(),
          urgent_no_deadline: true,
          contacts: [],
          excluded: false,
          exclusion_reason: null,
          reasoning: 'Extraction automatique impossible. Veuillez compléter manuellement.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultDeadline = getDefaultDeadline();
    
    // Check if OCE document - special handling
    const isOCE = detectOCE(jobDescription);
    console.log('OCE document detected:', isOCE);

    const systemPrompt = `Tu es un RECRUTEUR EXPERT et analyste ATS senior. Tu dois extraire TOUTES les informations d'une offre d'emploi avec une précision absolue.

## RÈGLES D'EXTRACTION STRICTES

### 1. DATES (CRITIQUE)
- **publication_date**: Cherche "Publié le", "Date de publication", "Posted on", dates dans l'en-tête. Format: YYYY-MM-DD
- **deadline**: Cherche "Date limite", "Délai", "Postuler avant", "Deadline". 
  - Si AUCUNE deadline trouvée → utilise "${defaultDeadline}" et mets urgent_no_deadline: true
  - Si deadline trouvée → urgent_no_deadline: false

### 2. CANAL & PROCESS
- **recommended_channel**: Identifie le canal de candidature parmi:
  - "email" (si adresse email de contact)
  - "linkedin" (si LinkedIn mentionné)
  - "portal" (si portail de recrutement: JobUp, Indeed, etc.)
  - "spontaneous" (si candidature spontanée suggérée)
  - "OCE" (si document Office Cantonal de l'Emploi/ORP)

### 3. DOCUMENTS REQUIS
- **required_documents**: Liste TOUS les documents demandés:
  - CV, Lettre de motivation (standards)
  - Casier judiciaire, Extrait de poursuites
  - Certificats de travail, Diplômes
  - Permis de travail, Portfolio, etc.
  - Pour OCE: ajoute "Preuve de candidature"

### 4. CONTACTS
- **contacts**: Extrais les informations de contact:
  - Nom du recruteur/RH
  - Email de contact
  - Téléphone si disponible

### 5. RÈGLES D'EXCLUSION AUTOMATIQUE
Marque excluded: true si UNE de ces conditions est vraie:
- Le poste est un STAGE ou contient "stagiaire", "internship", "apprenti"
- Position NON RÉMUNÉRÉE ou "bénévole"
- ALLEMAND REQUIS explicitement (B2+, courant, indispensable)
- Lieu HORS Genève/Vaud (pas GE, VD, Genève, Lausanne, Nyon, Morges, Vevey, etc.)

### 6. ANALYSE COMPATIBILITÉ
- **compatibility**: Score 0-100 basé sur correspondance profil/offre
- **matching_skills**: Compétences du candidat qui matchent
- **missing_requirements**: Compétences manquantes (POINTS SENSIBLES à améliorer)
- **keywords**: Mots-clés ATS importants pour le CV

### 7. DOCUMENTS OCE SPÉCIAUX
${isOCE ? `ATTENTION: Ce document provient de l'Office Cantonal de l'Emploi (OCE/ORP).
- La description du poste est souvent sur la PAGE 2 ou après "Concerne: demande de candidature"
- Force recommended_channel: "OCE"
- Ajoute "Preuve de candidature" aux required_documents
- Ce type d'offre est PRIORITAIRE` : ''}`;

    const userPrompt = `## PROFIL CANDIDAT
${userProfile}

## OFFRE D'EMPLOI À ANALYSER
${jobDescription}

## INSTRUCTION
Analyse cette offre et retourne un JSON STRICT avec cette structure:

{
  "compatibility": <number 0-100>,
  "matching_skills": [<array de strings>],
  "missing_requirements": [<array de strings - POINTS SENSIBLES>],
  "keywords": "<string de mots-clés ATS séparés par virgules>",
  "recommended_channel": "<email|linkedin|portal|spontaneous|OCE>",
  "required_documents": [<array de strings>],
  "publication_date": "<YYYY-MM-DD ou null>",
  "deadline": "<YYYY-MM-DD>",
  "urgent_no_deadline": <boolean>,
  "contacts": [{"nom": "<string>", "email": "<string>", "telephone": "<string ou null>"}],
  "excluded": <boolean>,
  "exclusion_reason": "<string ou null - raison si excluded=true>",
  "reasoning": "<explication brève du score et de l'analyse>"
}

RAPPEL: Si aucune deadline n'est trouvée, utilise "${defaultDeadline}" et urgent_no_deadline: true.
Date du jour: ${today}`;

    console.log('Analyzing job offer with Expert Recruiter prompt...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (response.status === 429) {
      console.error('Rate limit reached');
      return new Response(
        JSON.stringify({ error: 'Rate limit atteint. Réessayez dans quelques instants.' }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      console.error('Credits exhausted');
      return new Response(
        JSON.stringify({ error: 'Crédits Lovable AI épuisés. Ajoutez des crédits dans Settings → Usage.' }), 
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      // Return graceful fallback instead of error
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'ai_analysis_failed',
          compatibility: 50,
          matching_skills: [],
          missing_requirements: [],
          keywords: '',
          recommended_channel: isOCE ? 'OCE' : 'direct',
          required_documents: isOCE ? ['CV', 'Lettre de motivation', 'Preuve de candidature'] : ['CV', 'Lettre de motivation'],
          deadline: defaultDeadline,
          urgent_no_deadline: true,
          contacts: [],
          excluded: false,
          exclusion_reason: null,
          reasoning: 'Analyse IA indisponible. Données de base utilisées.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log('No content in AI response, returning fallback');
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'empty_response',
          compatibility: 50,
          matching_skills: [],
          missing_requirements: [],
          keywords: '',
          recommended_channel: isOCE ? 'OCE' : 'direct',
          required_documents: isOCE ? ['CV', 'Lettre de motivation', 'Preuve de candidature'] : ['CV', 'Lettre de motivation'],
          deadline: defaultDeadline,
          urgent_no_deadline: true,
          contacts: [],
          excluded: false,
          exclusion_reason: null,
          reasoning: 'Réponse IA vide. Veuillez compléter manuellement.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response received, parsing...');
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'parse_error',
          compatibility: 50,
          matching_skills: [],
          missing_requirements: [],
          keywords: '',
          recommended_channel: isOCE ? 'OCE' : 'direct',
          required_documents: isOCE ? ['CV', 'Lettre de motivation', 'Preuve de candidature'] : ['CV', 'Lettre de motivation'],
          deadline: defaultDeadline,
          urgent_no_deadline: true,
          contacts: [],
          excluded: false,
          exclusion_reason: null,
          reasoning: 'Erreur de parsing. Veuillez compléter manuellement.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Post-processing: Ensure deadline is set
    if (!analysis.deadline) {
      analysis.deadline = defaultDeadline;
      analysis.urgent_no_deadline = true;
    }

    // Force OCE settings if detected
    if (isOCE) {
      analysis.recommended_channel = 'OCE';
      if (!analysis.required_documents) {
        analysis.required_documents = [];
      }
      if (!analysis.required_documents.includes('Preuve de candidature')) {
        analysis.required_documents.push('Preuve de candidature');
      }
    }

    // Ensure required fields have defaults
    analysis.success = true;
    analysis.required_documents = analysis.required_documents || ['CV', 'Lettre de motivation'];
    analysis.contacts = analysis.contacts || [];
    analysis.matching_skills = analysis.matching_skills || [];
    analysis.missing_requirements = analysis.missing_requirements || [];
    analysis.excluded = analysis.excluded || false;

    console.log('Analysis complete:', {
      compatibility: analysis.compatibility,
      excluded: analysis.excluded,
      deadline: analysis.deadline,
      urgent: analysis.urgent_no_deadline,
      isOCE
    });
    
    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-job-offer:', error);
    
    // Return graceful fallback instead of 500 error
    return new Response(
      JSON.stringify({ 
        success: true,
        warning: 'server_error',
        compatibility: 50,
        matching_skills: [],
        missing_requirements: [],
        keywords: '',
        recommended_channel: 'direct',
        required_documents: ['CV', 'Lettre de motivation'],
        deadline: getDefaultDeadline(),
        urgent_no_deadline: true,
        contacts: [],
        excluded: false,
        exclusion_reason: null,
        reasoning: 'Erreur serveur. Veuillez compléter les informations manuellement.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});