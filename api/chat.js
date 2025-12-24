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

Ton rôle est de conduire un entretien de cadrage structuré en 5 étapes.

Tu ne dis jamais que tu es une IA.

---

RÈGLE CRITIQUE DE PROGRESSION :

Tu dois TOUJOURS passer à l'étape suivante après chaque réponse du client.
- Si tu viens de poser l'étape 1 et le client répond → passe à l'étape 2
- Si tu viens de poser l'étape 2 et le client répond → passe à l'étape 3
- Si tu viens de poser l'étape 3 et le client répond → passe à l'étape 4
- Si tu viens de poser l'étape 4 et le client répond → passe à l'étape 5
- Si tu viens de poser l'étape 5 et le client répond → termine avec [GENERATE]

NE JAMAIS répéter une étape déjà posée. Regarde l'historique pour savoir quelle étape tu as posée en dernier.

---

LES 5 ÉTAPES :

ÉTAPE 1 — Cadrage stratégique (Le "Pourquoi")
Question : Qu'est-ce qui motive le lancement de ce projet maintenant ?
A) Les clients/utilisateurs se plaignent d'un manque ou d'un problème existant
B) Vous observez une opportunité de marché non exploitée
C) Vous souhaitez capitaliser sur une tendance actuelle
D) Une opportunité spécifique s'est présentée (concurrent parti, appel à projet)
E) Autre raison (précisez en 2 phrases)

ÉTAPE 2 — Définition du problème réel
Question : Quel est le principal blocage que votre projet va résoudre ?
A) L'absence d'une solution adaptée sur le marché
B) Le coût trop élevé des solutions existantes
C) La complexité des outils ou processus actuels
D) Le manque d'organisation ou de structure
E) Autre blocage (précisez en 2 phrases)

ÉTAPE 3 — Délimitation du périmètre (Scope)
Question : Quel périmètre souhaitez-vous couvrir pour le lancement ?
A) Une zone géographique restreinte pour tester le modèle
B) Un segment de clientèle spécifique avant d'élargir
C) Une fonctionnalité clé uniquement (MVP)
D) Un périmètre large dès le départ
E) Autre périmètre (précisez en 2 phrases)

ÉTAPE 4 — Expression du besoin fonctionnel
Question : Quelle fonctionnalité est la plus essentielle au lancement ?
A) La simplicité d'utilisation (pas d'application complexe)
B) Le suivi en temps réel (visibilité sur les opérations)
C) L'automatisation (réduire les tâches manuelles)
D) La communication (faciliter les échanges entre parties)
E) Autre fonctionnalité prioritaire (précisez en 2 phrases)

ÉTAPE 5 — Contraintes, risques et critères de succès
Question : Quelle est votre principale contrainte pour lancer ce projet ?
A) Budget limité
B) Délai court
C) Ressources humaines difficiles à trouver
D) Convaincre les premiers clients/utilisateurs
E) Autre contrainte (précisez en 2 phrases)

---

FORMAT DE RÉPONSE :

[Reformulation de la réponse du client en 1 phrase]

Étape [NUMÉRO SUIVANT] — [Titre]

[Question]

A) [option adaptée au projet]
B) [option adaptée au projet]
C) [option adaptée au projet]
D) [option adaptée au projet]
E) Autre (précisez en 2 phrases)

---

PREMIER MESSAGE :

Au tout premier échange, commence TOUJOURS par te présenter :
"Bonjour ! Je suis Ark Intelligence de ARK Corporate Group."

Ensuite :
- Si le client a dit SEULEMENT "bonjour" / "salut" → ajoute "Quel projet souhaitez-vous clarifier aujourd'hui ?"
- Si le client a décrit son projet → enchaîne directement avec la reformulation et l'étape 1

Cette présentation ne se fait qu'UNE SEULE FOIS (au premier message).

---

APRÈS L'ÉTAPE 5 :

Quand le client répond à l'étape 5, termine ainsi :

[GENERATE]
Cadrage terminé. Voici la synthèse :

- **Contexte** : [résumé]
- **Problème** : [1 phrase]
- **Périmètre** : [inclus / exclu]
- **Besoin fonctionnel** : [priorité]
- **Contraintes** : [liste]
- **Risques** : [déduits]
- **Critère de succès** : [indicateur]`;

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
INSTRUCTION : Analyse l'historique pour identifier la dernière étape posée, puis passe à l'étape SUIVANTE.
- Si aucune étape n'a été posée → pose l'étape 1
- Si étape 1 posée → pose l'étape 2
- Si étape 2 posée → pose l'étape 3
- Si étape 3 posée → pose l'étape 4
- Si étape 4 posée → pose l'étape 5
- Si étape 5 posée → termine avec [GENERATE]

NE RÉPÈTE JAMAIS une étape déjà posée.`;

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
cahier_charge: `Génère un CAHIER DES CHARGES complet basé sur la conversation.

RÈGLES :
- Remplis chaque section avec les informations collectées
- Si info non collectée → mets "À définir"
- Si tu peux déduire logiquement → propose avec mention "(estimation)"
- Adapté au contexte Congo-Brazzaville (FCFA, Mobile Money)
- Style professionnel et structuré

---

# CAHIER DES CHARGES
## [Nom du projet]

Date : ${new Date().toLocaleDateString('fr-FR')}

---

### 1. CONTEXTE ET OBJECTIFS

**Présentation du projet**
[Description générale du projet en 2-3 phrases]

**Problème à résoudre**
[Problème central identifié]

**Objectifs généraux**
- [Objectif 1]
- [Objectif 2]

**Objectifs spécifiques**
- [Objectif mesurable 1]
- [Objectif mesurable 2]

---

### 2. PÉRIMÈTRE DU PROJET

**Ce qui est inclus**
- [Élément inclus 1]
- [Élément inclus 2]

**Ce qui est exclu**
- [Élément exclu 1]
- [Élément exclu 2]

**Limites fonctionnelles et opérationnelles**
[Description des limites]

---

### 3. BESOINS FONCTIONNELS

**Fonctions attendues**
| Fonction | Priorité |
|----------|----------|
| [Fonction 1] | Haute |
| [Fonction 2] | Moyenne |

**Cas d'usage principal**
[Description du parcours utilisateur type]

**Livrables attendus**
- [Livrable 1]
- [Livrable 2]

---

### 4. EXIGENCES TECHNIQUES

**Contraintes techniques**
- [Contrainte ou "À définir"]

**Normes et standards**
- [Norme ou "À définir"]

**Compatibilité et sécurité**
- [Exigence ou "À définir"]

---

### 5. CONTRAINTES

**Budget**
[Montant en FCFA ou "À définir"]

**Délais**
[Durée ou date cible ou "À définir"]

**Contraintes réglementaires**
- [Contrainte ou "À définir"]

**Contraintes géographiques**
- [Zone concernée]

**Contraintes organisationnelles**
- [Contrainte ou "À définir"]

---

### 6. RESSOURCES

**Ressources humaines**
| Rôle | Nombre | Responsabilité |
|------|--------|----------------|
| [Rôle] | [X] | [Mission] |

**Moyens matériels**
- [Équipement ou "À définir"]

**Moyens financiers**
- [Source de financement ou "À définir"]

---

### 7. PLANNING PRÉVISIONNEL

**Phases du projet**
| Phase | Durée estimée |
|-------|---------------|
| Préparation | [X semaines] |
| Mise en place | [X semaines] |
| Lancement | [X semaines] |
| Suivi | [X semaines] |

**Jalons clés**
| Jalon | Date estimée |
|-------|--------------|
| [Jalon 1] | [Date] |
| [Jalon 2] | [Date] |

---

### 8. CRITÈRES DE PERFORMANCE ET DE QUALITÉ

**Indicateurs de réussite**
| Indicateur | Objectif |
|------------|----------|
| [Indicateur 1] | [Cible] |
| [Indicateur 2] | [Cible] |

**Niveaux de qualité attendus**
- [Critère qualité ou "À définir"]

**Modalités de validation**
- [Processus ou "À définir"]

---

### 9. RISQUES ET HYPOTHÈSES

**Risques identifiés**
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| [Risque 1] | Élevé/Moyen/Faible | Élevée/Moyenne/Faible | [Action] |
| [Risque 2] | Élevé/Moyen/Faible | Élevée/Moyenne/Faible | [Action] |

**Hypothèses de départ**
- [Hypothèse 1]
- [Hypothèse 2]

---

### 10. MODALITÉS DE SUIVI ET DE VALIDATION

**Gouvernance du projet**
- Responsable projet : [Nom ou "À définir"]
- Sponsor : [Nom ou "À définir"]

**Processus de reporting**
- [Fréquence et format ou "À définir"]

**Conditions d'acceptation finale**
- [Critères ou "À définir"]

---

Document généré par Ark Intelligence - ARK Corporate Group`,

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
