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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, userProfile } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultDeadline = getDefaultDeadline();

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

### 3. DOCUMENTS REQUIS
- **required_documents**: Liste TOUS les documents demandés:
  - CV, Lettre de motivation (standards)
  - Casier judiciaire, Extrait de poursuites
  - Certificats de travail, Diplômes
  - Permis de travail, Portfolio, etc.

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
- **keywords**: Mots-clés ATS importants pour le CV`;

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
  "recommended_channel": "<email|linkedin|portal|spontaneous>",
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response received, parsing...');
    const analysis = JSON.parse(content);
    
    // Post-processing: Ensure deadline is set
    if (!analysis.deadline) {
      analysis.deadline = defaultDeadline;
      analysis.urgent_no_deadline = true;
    }

    // Ensure required fields have defaults
    analysis.required_documents = analysis.required_documents || ['CV', 'Lettre de motivation'];
    analysis.contacts = analysis.contacts || [];
    analysis.matching_skills = analysis.matching_skills || [];
    analysis.missing_requirements = analysis.missing_requirements || [];
    analysis.excluded = analysis.excluded || false;

    console.log('Analysis complete:', {
      compatibility: analysis.compatibility,
      excluded: analysis.excluded,
      deadline: analysis.deadline,
      urgent: analysis.urgent_no_deadline
    });
    
    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-job-offer:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Erreur lors de l\'analyse de l\'offre'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
