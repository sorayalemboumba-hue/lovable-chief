# 🤖 Guide pour IA - SoSoFlow

**Application de suivi de candidatures intelligente** - Version sans authentification pour tests et optimisations

---

## 📋 Vue d'ensemble

SoSoFlow est une application web de gestion de candidatures professionnelles destinée aux chercheurs d'emploi en Suisse romande. Elle permet d'importer, analyser, organiser et suivre des offres d'emploi avec aide IA.

**Technologie**: React + TypeScript + Supabase (Lovable Cloud) + Lovable AI  
**Stockage**: LocalStorage (pas d'authentification requise)  
**IA**: Google Gemini 2.5 Flash via Lovable AI Gateway

---

## 🎯 Fonctionnalités principales

### 1. Import d'offres (3 canaux)
- **Email**: Coller contenu d'alertes LinkedIn/JobUp/CAGI
- **Texte/Lien**: Coller annonce directement
- **PDF**: Upload fichier PDF d'offre

### 2. Analyse IA automatique (Lovable Cloud AI)
- Score compatibilité 0-100%
- Compétences correspondantes
- Exigences manquantes
- Mots-clés ATS
- Canal de candidature recommandé
- Documents requis

### 3. Règles d'exclusion automatiques
- ❌ Stages et postes non rémunérés
- ❌ Hors zone Genève-Vaud
- ❌ Allemand requis

### 4. Workflow de candidature
- **Étape 1**: Analyse IA
- **Étape 2**: Sélection CV/Lettre
- **Étape 3**: Contacts
- **Étape 4**: Envoi
- **Score ATS** pré-soumission

### 5. Tri intelligent
Score priorité = Urgence (40pts) + Qualité (40pts) + Statut (20pts)

### 6. Calendrier & Tâches
- Vue mensuelle
- Badges deadline < 3 jours
- Export ICS (alarme J-3)

### 7. Productivité
- Tip du jour déterministe
- Bibliothèque coaching
- Statistiques

---

## 🔧 Comment tester l'application

### Accès direct
L'app est accessible sans authentification. Le lien de prévisualisation Lovable fonctionne directement.

### Migration des données existantes
Si des données existent dans Supabase Cloud:
1. Cliquez sur le bouton **"Migrer depuis Cloud"** (header, à droite)
2. Attendez 5-10 secondes
3. Les offres apparaissent automatiquement

Ou via console navigateur:
```javascript
// Forcer re-migration
localStorage.removeItem('sosoflow_applications')
// Puis recharger la page
```

### Créer des données de test

**Option 1: Import Email LinkedIn**
```
Utilisez ce contenu de test:

Responsable de formation
Autonomia · Lausanne, Suisse

Chef de projet digital
Innovate SA · Vaud, Suisse

Stage Marketing
Test Corp · Genève, Suisse
```
→ Le stage sera automatiquement filtré

**Option 2: Créer manuellement**
1. Bouton "+ Nouvelle offre"
2. Remplir: Entreprise, Poste, Lieu, Deadline
3. Sauvegarder

**Option 3: Import JSON**
1. Bouton "Sauvegarder" (header)
2. Onglet "Importer"
3. Coller JSON exemple:
```json
[
  {
    "entreprise": "Acme Corp",
    "poste": "Product Manager",
    "lieu": "Lausanne, VD",
    "deadline": "2025-12-15",
    "statut": "à compléter",
    "priorite": 3,
    "keywords": "Product management, Agile, Leadership"
  }
]
```

---

## ✅ Points à vérifier/tester

### Fonctionnalités core
- [ ] Import email → parsing correct entreprise/poste/lieu
- [ ] Import PDF → extraction texte lisible
- [ ] Analyse IA → score + compétences + exclusions
- [ ] Règles d'exclusion → stages/allemand/zones filtrés
- [ ] Tri intelligent → deadline proche + compatibilité haute en haut
- [ ] Calendrier → offres deadline < 3j avec badge ⚠️
- [ ] Export ICS → fichier téléchargeable avec alarme J-3
- [ ] Persistance → localStorage sauvegarde après chaque action
- [ ] Workflow → progression 0-100% visible

### UX/UI
- [ ] Responsive mobile/desktop
- [ ] Navigation tabs claire
- [ ] Cartes lisibles (badges statut, priorité, compatibilité)
- [ ] Coaching contextuel pertinent (non-intrusif)
- [ ] Aucune erreur console en usage normal
- [ ] Temps de réponse < 500ms avec 50 offres

### Performance
- [ ] 50 offres + 200 tâches → navigation fluide
- [ ] Tri priorité → temps calcul < 100ms
- [ ] Analyse IA batch → 10 offres en ~15s
- [ ] Pas de re-render inutile
- [ ] LocalStorage < 5MB

---

## 🐛 Bugs connus / Points d'amélioration

### ✅ Corrigés
- ✅ Analyse IA non persistée → maintenant sauvegardée
- ✅ Deadline null casse tri → score neutre par défaut
- ✅ Règles exclusion non appliquées → actives à l'import
- ✅ Auth bloquante → supprimée (localStorage pur)

### ⚠️ À optimiser
- ⚠️ Actions rapides sur cartes (finir dossier 1 clic)
- ⚠️ Prochaine étape auto-calculée (badge dynamique)
- ⚠️ Mémoïsation listes filtrées (useMemo)
- ⚠️ Pagination tâches (>100 items)
- ⚠️ Validation noms fichiers ATS
- ⚠️ Liens directs calendrier → fiche

---

## 🔍 Suggestions d'optimisation

### Architecture
```typescript
// Améliorer avec:
- useMemo pour listes triées/filtrées
- useCallback pour handlers répétés
- Pagination TasksView (50/page)
- Virtualisation calendrier (mois visible seulement)
```

### UX
- Ajouter actions rapides ApplicationCard:
  - ✅ Valider dossier
  - ⏰ Relance 48h
  - 📅 Export ICS direct
- Badge "Prochaine étape" auto-calculé
- Compteur "+n" cellules calendrier surchargées

### Performance
- Lazy loading composants lourds
- Debounce recherche (300ms)
- Web Workers pour tri/calculs (>100 items)

### Sécurité
- Validation inputs (Zod)
- Sanitisation texte importé
- Rate limiting appels IA (1 req/sec max)

---

## 📊 Métriques de succès

| Métrique | Valeur cible | Actuel |
|----------|--------------|--------|
| Temps import + analyse 10 offres | < 2 min | ~2 min ✅ |
| Clics compléter dossier | < 5 | 8 ⚠️ |
| Taux passage ATS | > 80% | ~65% ⚠️ |
| Temps décision "quelle offre traiter" | < 30s | ~45s ⚠️ |
| Render time 200 tâches | < 100ms | ~150ms ⚠️ |

---

## 🚀 Scénario de test complet

### Test E2E (15 minutes)

1. **Import** (3 min)
   - Coller email LinkedIn avec 5 offres
   - Vérifier parsing correct
   - Vérifier 1 stage exclu automatiquement
   - Attendre analyse IA (toast "Analyse en cours")
   - Vérifier scores compatibilité affichés

2. **Workflow** (5 min)
   - Ouvrir 1re offre (compatibilité > 70%)
   - Cliquer "Analyser avec IA" si pas déjà fait
   - Vérifier compétences correspondantes
   - Sélectionner CV template
   - Sélectionner Lettre template
   - Ajouter 1 contact
   - Cocher "Dossier complet"
   - Vérifier score ATS > 80

3. **Calendrier** (3 min)
   - Créer offre deadline demain
   - Aller onglet Calendrier
   - Vérifier badge ⚠️ sur cellule demain
   - Exporter ICS
   - Importer dans Google Calendar
   - Vérifier alarme J-3 présente

4. **Productivité** (2 min)
   - Onglet Productivité
   - Vérifier Tip du jour
   - Ajouter tip personnel "Test coaching"
   - Vérifier apparition dans liste
   - Supprimer tip
   - Vérifier disparition

5. **Persistance** (2 min)
   - Refresh page (F5)
   - Vérifier toutes les données persistent
   - Ouvrir console: `localStorage.getItem('sosoflow_applications')`
   - Vérifier JSON valide

---

## 💡 Questions pour optimisation

1. **Architecture**: Composants trop gros? Refactoring nécessaire?
2. **Performance**: Goulots d'étranglement avec 100+ offres?
3. **UX**: Frictions dans workflow? Clics inutiles?
4. **Code**: Répétitions? Patterns anti-patterns?
5. **Accessibilité**: ARIA labels? Contraste couleurs?
6. **Mobile**: Responsive OK? Touch targets >44px?
7. **Erreurs**: Cas limites non gérés?
8. **Tests**: Scénarios edge à couvrir?

---

## 📞 Contact & Support

**Documentation complète**: `AUDIT_SOSOFLOW.md`  
**Cahier des charges**: Section "CAHIER DES CHARGES COMPLET"  
**Tests manuels**: Section "PLAN DE TEST MANUEL"  

**Note pour IA**: Cette app est conçue pour être testée et optimisée par des outils IA comme Claude ou ChatGPT. N'hésitez pas à:
- Tester tous les scénarios
- Identifier bugs/incohérences
- Proposer refactoring code
- Suggérer améliorations UX
- Optimiser performances
- Auditer sécurité/accessibilité

---

**Version**: 1.0.0 (30/11/2025)  
**Dernière mise à jour**: Suppression auth + Migration auto + Analyse IA batch persistée
