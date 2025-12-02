# 🚀 Export SoSoFlow pour Gemini 3 Pro - Optimisation

**Date d'export**: 2025-12-02  
**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Supabase (Lovable Cloud)  
**IA**: Google Gemini 2.5 Flash via Lovable AI Gateway

---

## 📋 PROMPT D'OPTIMISATION POUR GEMINI 3 PRO

Copiez ce prompt complet dans Gemini 3 Pro :

```
Tu es un expert senior React/TypeScript spécialisé en optimisation de performances et UX. Analyse l'application SoSoFlow (suivi de candidatures) et fournis des recommandations actionnables.

## CONTEXTE APPLICATION

SoSoFlow est une PWA de gestion de candidatures pour chercheurs d'emploi en Suisse romande.

### Fonctionnalités principales :
1. Import multi-canal (email LinkedIn/JobUp, texte, PDF)
2. Analyse IA automatique (score compatibilité, compétences, mots-clés ATS)
3. Règles d'exclusion automatiques (stages, hors GE-VD, allemand requis)
4. Workflow de candidature en 4 étapes
5. Tri intelligent par priorité
6. Calendrier avec export ICS
7. Coaching contextuel

### Architecture :
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui
- State: LocalStorage (pas d'auth requise)
- Backend: Supabase Edge Functions
- IA: Lovable AI Gateway (Gemini 2.5 Flash)

## MÉTRIQUES ACTUELLES (à améliorer)

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Clics compléter dossier | < 5 | 8 ⚠️ |
| Taux passage ATS | > 80% | ~65% ⚠️ |
| Temps décision offre | < 30s | ~45s ⚠️ |
| Render 200 tâches | < 100ms | ~150ms ⚠️ |

## OBJECTIFS D'OPTIMISATION

1. **Performance** : Réduire re-renders, optimiser tri 100+ items, useMemo/useCallback
2. **UX** : Réduire workflow de 8 à 5 clics, actions rapides sur cartes
3. **Architecture** : Identifier composants trop gros (>300 lignes), code dupliqué
4. **Accessibilité** : ARIA labels, contraste, touch targets 44px+
5. **Sécurité** : Validation inputs (Zod), sanitisation imports

## CODE SOURCE À ANALYSER

### 1. Page principale (Index.tsx) - 507 lignes ⚠️

\`\`\`typescript
// Fichier trop long, candidat au refactoring
import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { useLocalApplications } from '@/hooks/useLocalApplications';
import { sortByPriority, getPriorityScore } from '@/lib/priorityEngine';

const Index = () => {
  const { applications, loading, addApplication, updateApplication, deleteApplication, importApplications } = useLocalApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [activeTab, setActiveTab] = useState<'dashboard' | 'offres' | 'candidatures' | 'calendrier' | 'taches' | 'productivite'>('dashboard');

  // ⚠️ Filtrage recalculé à chaque render - optimiser avec useMemo
  const offres = applications.filter(app => 
    app.statut === 'à compléter' || app.statut === 'en cours'
  );
  const candidatures = applications.filter(app => 
    app.statut === 'soumise' || app.statut === 'entretien'
  );

  const applyFilters = (apps: Application[]) => {
    return apps.filter(app => {
      if (filters.statut && app.statut !== filters.statut) return false;
      if (filters.prioriteMin !== undefined && app.priorite < filters.prioriteMin) return false;
      // ... autres filtres
      return true;
    });
  };

  // ⚠️ Tri recalculé à chaque render
  const sortedApplications = sortByPriority(filteredApplications);

  // ⚠️ Handlers recréés à chaque render - optimiser avec useCallback
  const handleSave = async (application: Application) => { /* ... */ };
  const handleEdit = (application: Application) => { /* ... */ };
  const handleDelete = async (id: string) => { /* ... */ };

  // Render avec 6 tabs différents...
};
\`\`\`

### 2. ApplicationCard.tsx - 378 lignes

\`\`\`typescript
// Composant carte avec coaching contextuel
export function ApplicationCard({ application, onEdit, onDelete, onGenerateCV, onGenerateLetter, onUpdate }) {
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Règles de coaching contextuel
  const getContextualCoaching = () => {
    const compatibility = application.compatibility || 0;
    
    // Règle 1: Documents manquants
    if (application.requiredDocuments?.length > 0 && application.statut === 'à compléter') {
      return { message: '📋 Documents requis...', icon: ClipboardList, color: 'warning' };
    }
    
    // Règle 2: Deadline ≤ 3 jours
    if (daysUntil <= 3 && daysUntil >= 0) {
      return { message: '⏰ Deadline proche...', icon: AlertTriangle, color: 'destructive' };
    }
    
    // ... autres règles
    return null;
  };

  return (
    <Card>
      {/* Header avec compatibilité */}
      {/* Checklist */}
      {/* Coaching contextuel */}
      {/* Workflow toggle */}
      {/* Actions */}
    </Card>
  );
}
\`\`\`

### 3. Edge Function analyse IA

\`\`\`typescript
// supabase/functions/analyze-job-offer/index.ts
serve(async (req) => {
  const { jobDescription, userProfile } = await req.json();
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${LOVABLE_API_KEY}\` },
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

  // Retourne: compatibility, matching_skills, missing_requirements, keywords, recommended_channel
});
\`\`\`

### 4. Moteur de priorité

\`\`\`typescript
// src/lib/priorityEngine.ts
export function getPriorityScore(app: Application): PriorityScore {
  let urgency = 0;
  let quality = 0;
  let statusBoost = 0;

  // Urgence basée sur deadline (40 pts max)
  if (app.deadline) {
    const daysUntil = Math.ceil((new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 0) urgency = 40;
    else if (daysUntil <= 3) urgency = 35;
    else if (daysUntil <= 7) urgency = 25;
    else if (daysUntil <= 14) urgency = 15;
    else urgency = 5;
  } else {
    urgency = 10; // Neutre si pas de deadline
  }

  // Qualité basée sur compatibilité (40 pts max)
  if (app.compatibility) {
    quality = Math.round(app.compatibility * 0.4);
  }

  // Boost statut (20 pts max)
  if (app.statut === 'entretien') statusBoost = 20;
  else if (app.statut === 'soumise') statusBoost = 15;
  else if (app.statut === 'en cours') statusBoost = 10;
  else if (app.statut === 'à compléter') statusBoost = 5;

  return { total: urgency + quality + statusBoost, urgency, quality, statusBoost };
}
\`\`\`

### 5. Règles d'exclusion

\`\`\`typescript
// src/lib/exclusionRules.ts
export interface ExclusionResult {
  shouldExclude: boolean;
  reasons: string[];
  flags: { isStage: boolean; isOutsideRegion: boolean; requiresGerman: boolean; };
}

export function evaluateExclusion(job: { poste?: string; lieu?: string; description?: string }): ExclusionResult {
  const flags = {
    isStage: /stage|internship|stagiaire|trainee|bénévol|volunteer|non[- ]?rémunéré/i.test(text),
    isOutsideRegion: !isInAllowedRegion(job.lieu || ''),
    requiresGerman: /allemand.*(requis|obligatoire|indispensable|courant|natif|c[12])/i.test(text),
  };
  
  return {
    shouldExclude: Object.values(flags).some(Boolean),
    reasons: [...],
    flags
  };
}

// Régions autorisées: Genève, Vaud, Lausanne, Nyon, Morges, Rolle, Gland
function isInAllowedRegion(location: string): boolean {
  const allowed = ['genève', 'geneva', 'ge', 'vaud', 'vd', 'lausanne', 'nyon', 'morges', 'rolle', 'gland', 'suisse romande'];
  const excluded = ['zurich', 'bern', 'basel', 'lucerne', 'st. gallen', 'winterthur'];
  // ...
}
\`\`\`

## TYPE APPLICATION

\`\`\`typescript
export interface Application {
  id: string;
  entreprise: string;
  poste: string;
  lieu: string;
  deadline: string;
  statut: 'à compléter' | 'en cours' | 'soumise' | 'entretien';
  priorite: number; // 1-10
  
  // Analyse IA
  compatibility?: number; // 0-100
  matchingSkills?: string[];
  missingRequirements?: string[];
  keywords?: string;
  recommendedChannel?: string;
  requiredDocuments?: string[];
  
  // Workflow
  cvTemplateId?: string;
  letterTemplateId?: string;
  contacts?: Contact[];
  isComplete?: boolean;
  atsCompliant?: boolean;
  
  // Métadonnées
  publicationDate?: string;
  applicationEmail?: string;
  applicationInstructions?: string;
  originalOfferUrl?: string;
  notes?: string;
  createdAt: string;
}
\`\`\`

## QUESTIONS D'OPTIMISATION

1. **Index.tsx (507 lignes)** : Comment refactorer en composants plus petits ? Quels custom hooks extraire ?

2. **Performance tri** : Avec 100+ applications, comment optimiser sortByPriority qui est appelé à chaque render ?

3. **Workflow UX** : Comment réduire les clics de 8 à 5 pour compléter un dossier ?

4. **ApplicationCard** : Quelles optimisations pour éviter re-renders inutiles (React.memo, useCallback) ?

5. **Edge Function** : Comment améliorer le prompt IA pour un meilleur taux de passage ATS (>80%) ?

6. **Accessibilité** : Quels ARIA labels et améliorations ajouter ?

7. **Architecture** : Faut-il un state manager (Zustand/Jotai) ou le pattern actuel (hooks + localStorage) suffit ?

## LIVRABLES ATTENDUS

Pour chaque optimisation, fournis :
1. **Problème identifié** (avec ligne de code si pertinent)
2. **Solution proposée** (avec extrait de code)
3. **Impact estimé** (performance, UX, maintenabilité)
4. **Priorité** (P0 = critique, P1 = important, P2 = nice-to-have)

Commence par les optimisations P0 avec le plus grand impact.
```

---

## 📁 FICHIERS CLÉS COMPLÉMENTAIRES

Si Gemini a besoin de plus de contexte, voici les fichiers additionnels :

### Hook useLocalApplications

```typescript
// src/hooks/useLocalApplications.ts
const STORAGE_KEY = 'sosoflow_applications';

export function useLocalApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadFromStorage<Application[]>(STORAGE_KEY, []);
    setApplications(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEY, applications);
    }
  }, [applications, loading]);

  const addApplication = async (app: Omit<Application, 'id' | 'createdAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newApp = { ...app, id, createdAt: new Date().toISOString() };
    setApplications(prev => [...prev, newApp]);
    return id;
  };

  const importApplications = async (apps: Partial<Application>[]): Promise<string[]> => {
    const ids: string[] = [];
    const newApps = apps.filter(app => {
      // Déduplication par entreprise + poste
      const exists = applications.some(
        existing => existing.entreprise === app.entreprise && existing.poste === app.poste
      );
      return !exists && app.entreprise && app.poste;
    }).map(app => {
      const id = crypto.randomUUID();
      ids.push(id);
      return { ...app, id, createdAt: new Date().toISOString() } as Application;
    });
    
    if (newApps.length > 0) {
      setApplications(prev => [...prev, ...newApps]);
    }
    return ids;
  };

  // ... updateApplication, deleteApplication
}
```

### Config Tailwind

```typescript
// tailwind.config.ts - Design tokens
colors: {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
  warning: "hsl(var(--warning))",
  success: "hsl(var(--success))",
}
```

---

## 🔗 RESSOURCES

- **Lien preview Lovable** : [À récupérer dans l'interface Lovable]
- **Guide complet** : Voir `GUIDE_IA.md` dans le projet
- **Audit détaillé** : Voir `AUDIT_SOSOFLOW.md` dans le projet

---

## ✅ CHECKLIST APRÈS ANALYSE GEMINI

- [ ] Refactoring Index.tsx en composants
- [ ] Optimisation useMemo/useCallback
- [ ] Actions rapides ApplicationCard
- [ ] Amélioration prompt IA
- [ ] ARIA labels et accessibilité
- [ ] Pagination/virtualisation si >100 items
- [ ] Tests de non-régression
