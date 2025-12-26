// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, docType } = req.body;

        if (mode === 'chat') {
            return await handleChat(res, message, history);
        }
        
        if (mode === 'generate') {
            return await handleGenerate(res, history, docType);
        }

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ==================== SUPER PMO PROMPT ====================
const SUPER_PMO_PROMPT = `Tu es Ark Intelligence, un facilitateur stratégique, un PMO senior mandaté par Ark Corporate Group.

Ton rôle est de conduire un entretien de cadrage structuré en 5 phases et 12 questions.

Tu ne dis jamais que tu es une IA.

---

RÈGLE CRITIQUE DE PROGRESSION :

Tu poses UNE SEULE question à la fois et attends la réponse avant de passer à la suivante.
Suis strictement l'ordre : Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → [GENERATE]

Regarde l'historique pour savoir quelle question tu as posée en dernier.

---

LES 5 PHASES ET 12 QUESTIONS :

=== PHASE 1 — Cadrage stratégique (4 questions) ===

Q1 - Contexte
Qu'est-ce qui déclenche ce projet maintenant ?
A) Un problème récurrent qui bloque les opérations
B) Une opportunité de marché identifiée
C) Une demande externe (client, partenaire, institution)
D) Une contrainte réglementaire ou légale
E) Autre raison (précisez)

Q2 - Problème principal
Quel problème cherchez-vous à résoudre ?
A) Aucune solution existante ne répond au besoin
B) Les solutions actuelles coûtent trop cher
C) Les outils existants sont trop complexes
D) L'organisation manque de structure
E) Autre problème (précisez)

Q3 - Bénéficiaire principal
Qui bénéficiera le plus de ce projet ?
A) Votre organisation
B) Vos clients
C) Vos partenaires
D) Autre (précisez)

Q4 - Objectif stratégique
Dans 12 mois, si tout se passe bien, qu'est-ce qui aura changé ?
A) Vous gagnez du temps
B) Vous gagnez plus d'argent
C) Votre organisation est mieux structurée
D) Vos coûts ont diminué
E) Autre changement (précisez)

=== PHASE 2 — Définition du problème réel (2 questions) ===

Q5 - Besoin réel
De quelles informations avez-vous besoin pour avancer ?
A) Comprendre le problème métier exact
B) Connaître les objectifs visés
C) Évaluer le niveau de maturité
D) Identifier les contraintes
E) Tout ce qui précède

Q6 - Limites actuelles
Pourquoi ce problème n'est-il pas encore résolu ?
A) Le besoin est difficile à formuler
B) Il n'y a pas de méthode établie
C) La communication est trop informelle
D) Le temps ou les ressources manquent
E) Autre raison (précisez)

=== PHASE 3 — Délimitation du périmètre (2 questions) ===

Q7 - Livrable attendu
Que voulez-vous obtenir concrètement à la fin ?
A) Un document de cadrage
B) Un outil fonctionnel
C) Une procédure standardisée
D) Une recommandation stratégique
E) Autre livrable (précisez)

Q8 - Hors périmètre
Que ne doit PAS faire ce projet ?
A) Concevoir la solution technique
B) Établir un budget détaillé
C) Exécuter ou implémenter
D) Remplacer l'expertise humaine
E) Autre exclusion (précisez)

=== PHASE 4 — Expression du besoin fonctionnel (1 question) ===

Q9 - Exigences fonctionnelles
Quelle capacité est prioritaire ?
A) Guider l'expression du besoin
B) Structurer les informations
C) Détecter les incohérences
D) Générer un document automatiquement
E) Autre capacité (précisez)

=== PHASE 5 — Contraintes, risques et critères de succès (3 questions) ===

Q10 - Contraintes
Quelle contrainte est la plus importante ?
A) Doit être simple et rapide
B) Budget serré
C) Délai court
D) Doit fonctionner sur mobile
E) Autre contrainte (précisez)

Q11 - Risques
Quel risque vous inquiète le plus ?
A) Les gens ne l'utiliseront pas
B) Les utilisateurs abandonneront en cours de route
C) Les réponses seront superficielles
D) Le système sera trop rigide
E) Autre risque (précisez)

Q12 - Critères de succès
Comment mesurerez-vous le succès ?
A) Par le taux d'utilisation
B) Par le temps gagné
C) Par la qualité des livrables
D) Par la satisfaction des utilisateurs
E) Autre indicateur (précisez)

---

FORMAT DE RÉPONSE :

[Reformulation courte de la réponse du client]

Phase [N] — [Titre de la phase]
Question [N] : [Titre de la question]

[Question]

A) [option]
B) [option]
C) [option]
D) [option]
E) [option]

---

PREMIER MESSAGE :

Au tout premier échange, commence TOUJOURS par te présenter :
"Bonjour ! Je suis Ark Intelligence de ARK Corporate Group."

Ensuite :
- Si le client a dit SEULEMENT "bonjour" / "salut" → ajoute "Quel projet souhaitez-vous clarifier aujourd'hui ?"
- Si le client a décrit son projet → enchaîne directement avec la reformulation et la Question 1

Cette présentation ne se fait qu'UNE SEULE FOIS (au premier message).

---

APRÈS LA QUESTION 12 :

Quand le client répond à la question 12, termine ainsi :

[GENERATE]
Cadrage terminé. Voici la synthèse de votre projet :

- **Contexte** : [Q1]
- **Problème** : [Q2]
- **Bénéficiaire** : [Q3]
- **Objectif** : [Q4]
- **Besoin réel** : [Q5]
- **Limites actuelles** : [Q6]
- **Livrable attendu** : [Q7]
- **Hors périmètre** : [Q8]
- **Exigence fonctionnelle** : [Q9]
- **Contrainte** : [Q10]
- **Risque** : [Q11]
- **Critère de succès** : [Q12]`;

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const fullPrompt = `${SUPER_PMO_PROMPT}

---
HISTORIQUE DE LA CONVERSATION :
${historyText}

---
NOUVEAU MESSAGE DU CLIENT :
"${message}"

---
INSTRUCTION : Analyse l'historique pour identifier la dernière question posée, puis passe à la question SUIVANTE.
- Si aucune question n'a été posée → pose la Question 1
- Si Q1 posée → pose Q2
- Si Q2 posée → pose Q3
- Si Q3 posée → pose Q4
- Si Q4 posée → pose Q5
- Si Q5 posée → pose Q6
- Si Q6 posée → pose Q7
- Si Q7 posée → pose Q8
- Si Q8 posée → pose Q9
- Si Q9 posée → pose Q10
- Si Q10 posée → pose Q11
- Si Q11 posée → pose Q12
- Si Q12 posée → termine avec [GENERATE]

NE RÉPÈTE JAMAIS une question déjà posée.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [{ role: 'user', content: fullPrompt }], 
            temperature: 0.7, 
            max_tokens: 600 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Détecter [GENERATE] n'importe où dans la réponse
    if (aiResponse.includes('[GENERATE]')) {
        const cleanResponse = aiResponse.replace('[GENERATE]', '').trim();
        return res.status(200).json({ 
            action: 'generate',
            response: cleanResponse
        });
    }
    
    return res.status(200).json({ 
        action: 'continue',
        response: aiResponse
    });
}

// ==================== PROMPTS DOCUMENTS ====================
const DOCUMENT_PROMPTS = {

// 1. PROJECT CHARTER CLIENT (ONE-PAGER)
charter_client: `Génère un PROJECT CHARTER CLIENT au format one-pager professionnel.

UTILISE CE FORMAT TABLEAU :

# PROJECT CHARTER

| Champ | Information |
|-------|-------------|
| Project Name | [nom du projet] |
| Project Manager | [à définir] |
| Project Sponsor | [client ou à définir] |
| Date | ${new Date().toLocaleDateString('fr-FR')} |

## Business Case
[Pourquoi ce projet ? Quel problème résout-il ? En 3-4 phrases max]

## Expected Deliveries
[Liste des livrables attendus - 3 à 5 points]

## Team Members

| Role | Name | Hours |
|------|------|-------|
| [role] | [nom ou À définir] | [estimation] |

## Milestones

| Date | Goal |
|------|------|
| [date] | [jalon] |

## Risks and Constraints
[2-3 risques ou contraintes identifiés]

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 2. PROJECT CHARTER ARK (INTERNE)
charter_ark: `Génère un PROJECT CHARTER ARK (version interne avec scoring).

# PROJECT CHARTER ARK (INTERNE)

## Identification
- Projet : [nom]
- Client : [nom]
- Consultant ARK : [à définir]
- Date : ${new Date().toLocaleDateString('fr-FR')}

## Scoring Projet

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Urgence | [1-5] | [justification] |
| Maturité client | [1-5] | [justification] |
| Complexité | [1-5] | [justification] |
| Potentiel commercial | [1-5] | [justification] |

Légende : 1=Faible, 3=Moyen, 5=Élevé

## Synthèse du besoin
[Résumé en 5 lignes max]

## Diagnostic maturité client

| Domaine | Niveau |
|---------|--------|
| Organisation | Faible / Moyen / Élevé |
| Processus | Faible / Moyen / Élevé |
| Digital | Faible / Moyen / Élevé |
| Pilotage | Faible / Moyen / Élevé |

## Recommandation ARK

Option recommandée :
- [ ] Diagnostic approfondi
- [ ] Mission de cadrage structurée
- [ ] Offre opérationnelle ciblée
- [ ] Mise en attente / réorientation

Priorité : Faible / Moyenne / Élevée

## Notes internes
[Observations pour l'équipe ARK]

---
Document interne ARK Corporate Group - Ne pas diffuser`,

// 3. CAHIER DES CHARGES
cahier_charge: `Génère un CAHIER DES CHARGES basé UNIQUEMENT sur les 12 questions du cadrage.

RÈGLES STRICTES :
- Utilise UNIQUEMENT les réponses des 12 questions collectées
- NE PAS inventer d'informations supplémentaires
- Développe chaque réponse en un paragraphe fluide et professionnel
- Pas de mention de source (Q1, Q2...) dans le document final
- Style professionnel, phrases complètes

MAPPING DES 12 QUESTIONS :
- Q1 (Contexte) → Section 1
- Q2 (Problème) → Section 2
- Q3 (Bénéficiaire) → Section 3
- Q4 (Objectif) → Section 4
- Q5 (Besoin réel) → Section 5
- Q6 (Limites actuelles) → Section 6
- Q7 (Livrable) → Section 7
- Q8 (Hors périmètre) → Section 8
- Q9 (Exigences fonctionnelles) → Section 9
- Q10 (Contraintes) → Section 10
- Q11 (Risques) → Section 11
- Q12 (Critères de succès) → Section 12

---

# CAHIER DES CHARGES
## [Nom du projet]

Date : ${new Date().toLocaleDateString('fr-FR')}

---

### 1. CONTEXTE

[Développe la réponse Q1 en un paragraphe expliquant ce qui déclenche ce projet maintenant, le contexte général et pourquoi c'est le bon moment pour agir.]

---

### 2. PROBLÈME À RÉSOUDRE

[Développe la réponse Q2 en un paragraphe décrivant le problème principal que ce projet cherche à résoudre, ses manifestations et ses impacts sur l'activité.]

---

### 3. BÉNÉFICIAIRE PRINCIPAL

[Développe la réponse Q3 en un paragraphe identifiant clairement qui bénéficiera le plus de ce projet et comment ce bénéficiaire sera impacté positivement.]

---

### 4. OBJECTIF STRATÉGIQUE

[Développe la réponse Q4 en un paragraphe décrivant ce qui aura concrètement changé dans 12 mois si le projet réussit, les résultats attendus et leur impact.]

---

### 5. BESOIN RÉEL

[Développe la réponse Q5 en un paragraphe expliquant les informations nécessaires pour bien cadrer ce projet et pourquoi elles sont essentielles.]

---

### 6. LIMITES ACTUELLES

[Développe la réponse Q6 en un paragraphe expliquant pourquoi ce problème n'a pas encore été résolu, les obstacles rencontrés et les blocages actuels.]

---

### 7. LIVRABLE ATTENDU

[Développe la réponse Q7 en un paragraphe décrivant précisément ce que le projet doit produire concrètement à la fin, le format et l'utilisation prévue.]

---

### 8. HORS PÉRIMÈTRE

[Développe la réponse Q8 en un paragraphe listant ce que ce projet ne fera PAS, les exclusions explicites et les limites posées pour éviter les dérives.]

---

### 9. EXIGENCES FONCTIONNELLES

[Développe la réponse Q9 en un paragraphe décrivant la ou les fonctionnalités prioritaires que le projet doit absolument permettre.]

---

### 10. CONTRAINTES

[Développe la réponse Q10 en un paragraphe détaillant les contraintes principales qui encadrent ce projet et doivent être respectées.]

---

### 11. RISQUES

[Développe la réponse Q11 en un paragraphe identifiant les risques principaux qui pourraient compromettre le succès du projet et leurs impacts potentiels.]

---

### 12. CRITÈRES DE SUCCÈS

[Développe la réponse Q12 en un paragraphe définissant comment le succès du projet sera mesuré, les indicateurs clés et les seuils attendus.]

---

Document généré par Ark Intelligence - ARK Corporate Group
Basé sur le cadrage en 5 étapes`,

// 4. BUDGET PRÉVISIONNEL
budget: `Génère un BUDGET PRÉVISIONNEL détaillé.

# BUDGET PRÉVISIONNEL

## 1. Investissements initiaux

| Poste | Montant (FCFA) |
|-------|----------------|
| [poste] | [montant] |
| **TOTAL INVESTISSEMENTS** | **[total]** |

## 2. Charges mensuelles

| Poste | Montant (FCFA) |
|-------|----------------|
| [poste] | [montant] |
| **TOTAL CHARGES/MOIS** | **[total]** |

## 3. Prévisions de revenus

| Source | Montant mensuel (FCFA) |
|--------|------------------------|
| [source] | [montant] |
| **TOTAL REVENUS/MOIS** | **[total]** |

## 4. Point mort
[Analyse du seuil de rentabilité]

## 5. Moyens de paiement prévus
- Mobile Money (Airtel Money, MTN MoMo)
- Espèces
- [autres]

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 5. PLAN DE PROJET
plan_projet: `Génère un PLAN DE PROJET structuré.

# PLAN DE PROJET

## Phase 1 : Préparation
Durée : [X semaines]

| Tâche | Responsable | Échéance |
|-------|-------------|----------|
| [tâche] | [qui] | [date] |

## Phase 2 : Mise en place
Durée : [X semaines]

| Tâche | Responsable | Échéance |
|-------|-------------|----------|
| [tâche] | [qui] | [date] |

## Phase 3 : Lancement
Durée : [X semaines]

| Tâche | Responsable | Échéance |
|-------|-------------|----------|
| [tâche] | [qui] | [date] |

## Phase 4 : Suivi post-lancement
Durée : [X semaines]

| Tâche | Responsable | Échéance |
|-------|-------------|----------|
| [tâche] | [qui] | [date] |

## Jalons clés

| Date | Jalon |
|------|-------|
| [date] | [jalon] |

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 6. CHECKLIST LANCEMENT
checklist: `Génère une CHECKLIST DE LANCEMENT complète.

# CHECKLIST DE LANCEMENT

## Administratif
- [ ] [tâche]
- [ ] [tâche]

## Local et équipements
- [ ] [tâche]
- [ ] [tâche]

## Ressources humaines
- [ ] [tâche]
- [ ] [tâche]

## Commercial et marketing
- [ ] [tâche]
- [ ] [tâche]

## Financier
- [ ] [tâche]
- [ ] [tâche]

## Jour J
- [ ] [tâche]
- [ ] [tâche]

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 7. MATRICE DES RISQUES
risques: `Génère une MATRICE DES RISQUES détaillée.

# MATRICE DES RISQUES

## Risques élevés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| [risque] | Élevé | [prob] | [action] |

## Risques moyens

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| [risque] | Moyen | [prob] | [action] |

## Risques faibles

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| [risque] | Faible | [prob] | [action] |

## Risques spécifiques Congo-Brazzaville
- [risque local et mitigation]

## Plan de contingence
[Actions en cas de matérialisation des risques majeurs]

---
Document interne ARK Corporate Group`,

// 8. SOP CLIENTS
sop_clients: `Génère les SOP CLIENTS (procédures opérationnelles standards).

# SOP CLIENTS - PROCÉDURES STANDARDS

## 1. Processus d'accueil client

### Objectif
[Description]

### Étapes
1. [étape]
2. [étape]
3. [étape]

### Responsable
[qui]

## 2. Processus de vente/service

### Objectif
[Description]

### Étapes
1. [étape]
2. [étape]
3. [étape]

### Responsable
[qui]

## 3. Processus de suivi client

### Objectif
[Description]

### Étapes
1. [étape]
2. [étape]
3. [étape]

### Responsable
[qui]

## 4. Gestion des réclamations

### Objectif
[Description]

### Étapes
1. [étape]
2. [étape]
3. [étape]

### Responsable
[qui]

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 9. SOP INTERNES
sop_internes: `Génère les SOP INTERNES (procédures opérationnelles internes ARK).

# SOP INTERNES - PROCÉDURES ARK

## 1. Processus de prise en charge projet

### Déclencheur
[Quand ce processus démarre]

### Étapes
1. [étape]
2. [étape]
3. [étape]

### Livrables
[Documents à produire]

## 2. Processus de validation interne

### Critères de validation
- [critère]
- [critère]

### Étapes
1. [étape]
2. [étape]

### Décideur
[qui valide]

## 3. Processus de suivi projet

### Fréquence
[périodicité]

### Points de contrôle
- [point]
- [point]

### Reporting
[format et destinataires]

---
Document interne ARK Corporate Group - Ne pas diffuser`,

// 10. DIAGNOSTICS
diagnostics: `Génère un DIAGNOSTIC complet du projet.

# DIAGNOSTIC PROJET

## 1. Analyse de la situation actuelle

### Forces
- [force]
- [force]

### Faiblesses
- [faiblesse]
- [faiblesse]

### Opportunités
- [opportunité]
- [opportunité]

### Menaces
- [menace]
- [menace]

## 2. Analyse du marché

### Taille du marché
[estimation]

### Tendances
[évolutions observées]

### Concurrence
[acteurs et positionnement]

## 3. Analyse des ressources

### Ressources disponibles
- [ressource]

### Ressources manquantes
- [ressource]

### Gap à combler
[analyse]

## 4. Synthèse du diagnostic

| Domaine | État | Priorité |
|---------|------|----------|
| [domaine] | [état] | [priorité] |

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 11. RECOMMANDATIONS
recommandations: `Génère des RECOMMANDATIONS stratégiques.

# RECOMMANDATIONS STRATÉGIQUES

## 1. Recommandations prioritaires

### Recommandation 1
- **Action** : [description]
- **Justification** : [pourquoi]
- **Délai** : [quand]
- **Ressources** : [quoi]

### Recommandation 2
- **Action** : [description]
- **Justification** : [pourquoi]
- **Délai** : [quand]
- **Ressources** : [quoi]

## 2. Recommandations secondaires

### Recommandation 3
[description et justification]

### Recommandation 4
[description et justification]

## 3. Quick wins (gains rapides)
- [action rapide à impact immédiat]
- [action rapide à impact immédiat]

## 4. Actions à éviter
- [piège à éviter]
- [piège à éviter]

## 5. Prochaines étapes suggérées

| Étape | Action | Échéance |
|-------|--------|----------|
| 1 | [action] | [date] |
| 2 | [action] | [date] |
| 3 | [action] | [date] |

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 12. DESIGN THINKING
design_thinking: `Génère un document DESIGN THINKING.

# DESIGN THINKING - ANALYSE PROJET

## 1. EMPATHIZE (Comprendre)

### Qui est l'utilisateur ?
[Description du persona principal]

### Quels sont ses besoins ?
- [besoin]
- [besoin]

### Quelles sont ses frustrations ?
- [frustration]
- [frustration]

## 2. DEFINE (Définir)

### Problème à résoudre
[Énoncé clair du problème]

### Point de vue utilisateur
"En tant que [utilisateur], je veux [action] pour [bénéfice]"

## 3. IDEATE (Imaginer)

### Solutions envisagées
1. [solution]
2. [solution]
3. [solution]

### Solution retenue
[description et justification]

## 4. PROTOTYPE (Prototyper)

### MVP (Produit Minimum Viable)
[Description du MVP]

### Fonctionnalités essentielles
- [fonctionnalité]
- [fonctionnalité]

## 5. TEST (Tester)

### Hypothèses à valider
- [hypothèse]
- [hypothèse]

### Métriques de succès
- [métrique]
- [métrique]

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 13. BUSINESS MODEL
business_model: `Génère un BUSINESS MODEL CANVAS.

# BUSINESS MODEL CANVAS

## 1. Segments de clients
[Qui sont vos clients ?]
- [segment 1]
- [segment 2]

## 2. Proposition de valeur
[Quelle valeur apportez-vous ?]
- [valeur 1]
- [valeur 2]

## 3. Canaux de distribution
[Comment atteignez-vous vos clients ?]
- [canal 1]
- [canal 2]

## 4. Relations clients
[Quel type de relation ?]
- [type de relation]

## 5. Sources de revenus
[Comment gagnez-vous de l'argent ?]

| Source | Modèle | Estimation mensuelle |
|--------|--------|---------------------|
| [source] | [modèle] | [montant] FCFA |

## 6. Ressources clés
[De quoi avez-vous besoin ?]
- [ressource]
- [ressource]

## 7. Activités clés
[Que devez-vous faire ?]
- [activité]
- [activité]

## 8. Partenaires clés
[Avec qui travaillez-vous ?]
- [partenaire]
- [partenaire]

## 9. Structure de coûts
[Quels sont vos coûts ?]

| Poste | Type | Estimation |
|-------|------|------------|
| [poste] | Fixe/Variable | [montant] FCFA |

---
Document généré par Ark Intelligence - ARK Corporate Group`,

// 14. LEAN STARTUP
lean_startup: `Génère un document LEAN START UP.

# LEAN START UP - PLAN DE VALIDATION

## 1. Hypothèse de valeur
[Quelle valeur pensez-vous créer ?]

### Hypothèse principale
"Nous croyons que [client] a besoin de [solution] car [raison]"

### Comment valider ?
[méthode de validation]

## 2. Hypothèse de croissance
[Comment allez-vous grandir ?]

### Moteur de croissance
- [ ] Viral (bouche-à-oreille)
- [ ] Payant (publicité)
- [ ] Sticky (rétention)

## 3. MVP (Minimum Viable Product)

### Description du MVP
[version minimale du produit]

### Fonctionnalités incluses
- [fonctionnalité]
- [fonctionnalité]

### Fonctionnalités exclues (pour plus tard)
- [fonctionnalité]
- [fonctionnalité]

## 4. Métriques clés (AARRR)

| Métrique | Objectif | Comment mesurer |
|----------|----------|-----------------|
| Acquisition | [objectif] | [méthode] |
| Activation | [objectif] | [méthode] |
| Rétention | [objectif] | [méthode] |
| Revenue | [objectif] | [méthode] |
| Referral | [objectif] | [méthode] |

## 5. Cycle Build-Measure-Learn

### Build (Construire)
[Ce qu'on va construire en premier]

### Measure (Mesurer)
[Ce qu'on va mesurer]

### Learn (Apprendre)
[Questions auxquelles on veut répondre]

## 6. Pivot ou Persévère ?

### Critères de pivot
[Quand changer de direction ?]

### Critères de persévérance
[Quand continuer ?]

---
Document généré par Ark Intelligence - ARK Corporate Group`
};

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history, docType = 'cahier_charge') {
    const conversationText = history.map(h => 
        `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`
    ).join('\n\n');

    const docPrompt = DOCUMENT_PROMPTS[docType] || DOCUMENT_PROMPTS.cahier_charge;

    const generatePrompt = `Tu es un expert en gestion de projet PMI.

CONVERSATION AVEC LE CLIENT :
---
${conversationText}
---

MISSION :
${docPrompt}

RÈGLES :
- Base-toi UNIQUEMENT sur la conversation
- Si info manquante → "À définir"
- Style professionnel et clair
- Adapté au contexte Congo-Brazzaville (Mobile Money, FCFA)
- Pas de blabla, que du concret
- PAS d'émojis sauf pour le scoring interne`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` 
        },
        body: JSON.stringify({ 
            model: 'deepseek-chat', 
            messages: [{ role: 'user', content: generatePrompt }], 
            temperature: 0.7, 
            max_tokens: 4000 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const document = data.choices[0].message.content.trim();
    
    return res.status(200).json({ 
        success: true,
        document: document
    });
}
