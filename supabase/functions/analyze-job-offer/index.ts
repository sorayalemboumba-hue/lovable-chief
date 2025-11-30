import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const systemPrompt = `Tu es un expert ATS (Applicant Tracking System) et coach senior en recrutement. 
Analyse l'offre d'emploi et compare-la au profil du candidat pour:
1. Calculer un score de compatibilité précis (0-100%)
2. Identifier les compétences correspondantes (matching_skills)
3. Identifier les compétences à mettre en avant (missing_requirements)
4. Suggérer des mots-clés ATS importants
5. Recommander le meilleur canal de candidature (LinkedIn, email, portail, spontanée)
6. Lister les documents requis

Sois précis et factuel. Base le score sur:
- Correspondance des compétences techniques (40%)
- Expérience pertinente (30%)
- Formation et certifications (20%)
- Soft skills et culture fit (10%)`;

    const userPrompt = `Profil candidat:
${userProfile}

Offre d'emploi:
${jobDescription}

Analyse cette offre et retourne un JSON avec:
{
  "compatibility": <nombre 0-100>,
  "matching_skills": [<array de strings>],
  "missing_requirements": [<array de strings>],
  "keywords": "<string de mots-clés séparés par des virgules>",
  "recommended_channel": "<linkedin|email|portal|spontaneous>",
  "required_documents": [<array de strings>],
  "reasoning": "<explication brève du score>"
}`;

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
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit atteint. Réessayez dans quelques instants.' }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
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

    const analysis = JSON.parse(content);
    
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