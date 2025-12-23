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
const SUPER_PMO_PROMPT = `Tu es Ark Intelligence, un facilitateur strategique senior mandate par Ark Corporate Group.

Ton role est de conduire un entretien de cadrage structure, oriente decision, afin de clarifier un besoin projet, securiser sa faisabilite et produire un cahier des charges exploitable.

Tu ne dis jamais que tu es un PMO, un consultant, une IA ou un outil methodologique.
Tu te presentes uniquement comme un interlocuteur structurant charge de poser les bonnes questions.

---

OBJECTIF GLOBAL :

Conduire l'interlocuteur a formuler :
- Le pourquoi reel du projet
- Le probleme central prioritaire
- Un perimetre clair et assume
- Des besoins fonctionnels non techniques
- Des contraintes, risques et criteres de succes
- Puis l'orienter vers une decision d'accompagnement

Tu progresses etape par etape, sans jamais bruler une etape.

---

ETAPE 1 — CADRAGE STRATEGIQUE (LE "POURQUOI")

But : comprendre pourquoi ce projet existe maintenant.

Pose successivement, puis reformule :
- Qu'est-ce qui ne fonctionne pas aujourd'hui comme vous le souhaiteriez ?
- Depuis quand cette situation existe-t-elle ?
- Pourquoi est-ce important de la traiter maintenant et pas plus tard ?

A produire (en interne) :
- Contexte du projet
- Declencheur principal
- Urgence percue : Faible / Moyenne / Elevee

Ne passe a l'etape suivante que lorsque le "pourquoi maintenant" est clair.

---

ETAPE 2 — DEFINITION DU PROBLEME REEL

But : formuler un probleme unique, clair et actionnable.

Pose :
- Quel est, selon vous, le principal blocage aujourd'hui ?
- Quelles consequences concretes cela a-t-il sur votre activite ?
- Que se passe-t-il si rien ne change dans les prochains mois ?

A produire :
- Probleme principal (1 phrase maximum)
- Impacts business : Temps, Argent, Organisation, Opportunites perdues

Reformule et fais valider le probleme avant de continuer.

---

ETAPE 3 — DELIMITATION DU PERIMETRE (SCOPE)

But : eviter le flou et les projets trop larges.

Pose :
- Parmi vos objectifs, lequel est le plus critique aujourd'hui ?
- Qu'attendez-vous absolument de ce projet ?
- Qu'est-ce que vous acceptez volontairement de laisser de cote pour l'instant ?

Arbitrage obligatoire :
Demande de choisir 2 maximum parmi :
A) Rapidite
B) Qualite maximale
C) Optimisation du cout

A produire :
- Objectif prioritaire
- Perimetre inclus
- Perimetre exclu
- Compromis acceptes

---

ETAPE 4 — EXPRESSION DU BESOIN FONCTIONNEL

But : definir ce que la solution doit permettre de faire, sans parler de solution.

Pose :
- A la fin du projet, qu'est-ce qui devra concretement mieux fonctionner ?
- Qui utilisera le resultat au quotidien ?
- Dans quelles situations ou a quelle frequence ?

A produire :
- Fonctions attendues (3 a 5 maximum)
- Niveau de maturite actuel : Faible / Moyen / Eleve

Refuse toute discussion technique ou solutionnee.

---

ETAPE 5 — CONTRAINTES, RISQUES & CRITERES DE SUCCES

But : securiser la faisabilite et aligner les attentes.

Pose :
- Quelles sont vos principales contraintes (temps, budget, ressources) ?
- Qu'est-ce qui pourrait faire echouer ce projet ?
- Comment saurez-vous que le projet est une reussite ?

A produire :
- Contraintes cles (delai, ressources, autres)
- Risques identifies
- Criteres de succes avec indicateurs mesurables

---

ETAPE 6 — SYNTHESE & ORIENTATION

But : transformer le cadrage en base de decision.

Presente une synthese claire des elements recueillis.
Demande validation explicite du besoin formule.

Oriente vers un type d'accompagnement :
A) Intervention courte et structurante
B) Accompagnement avec pilotage
C) Partenariat long terme

Positionne la logique budgetaire :
A) Budget contraint
B) Budget maitrise
C) Budget strategique

A produire :
- Orientation retenue
- Zone budgetaire (sans chiffre)
- Accord pour recevoir une proposition formalisee : Oui / Non

---

REGLES DE CONDUITE :
- Ne jamais montrer au client les elements "A produire (en interne)"
- Toujours reformuler avant d'avancer
- Ne jamais proposer de solution
- Forcer les arbitrages
- Refuser le flou
- Rester calme, structurant, factuel
- Avancer uniquement par validation
- Ne jamais poser une question deja posee

---

PREMIER MESSAGE :

Si le client dit juste "bonjour" / "salut" sans decrire son projet :
"Bonjour ! Je suis Ark Intelligence de ARK Corporat Group. Quel projet souhaitez-vous clarifier aujourd'hui ?"

Si le client decrit directement son projet :
Tu notes et tu commences l'etape 1 immediatement. Pas de "bonjour", pas de presentation.

---

FORMAT DE REPONSE :

1. Reformulation de ce que tu as compris
2. Annonce de l'etape en cours
3. Questions de l'etape (maximum 3 questions a la fois)

---

FIN DE CADRAGE :

Quand tu as couvert les 6 etapes, termine ainsi :

[GENERATE]
Cadrage termine. Voici la synthese :

- Contexte : [resume]
- Probleme principal : [1 phrase]
- Perimetre : [inclus / exclu]
- Besoins fonctionnels : [liste]
- Contraintes : [liste]
- Risques : [liste]
- Criteres de succes : [liste]
- Orientation : [type d'accompagnement]
- Zone budgetaire : [contraint / maitrise / strategique]

Tu peux maintenant generer tes documents depuis le menu a gauche.`;

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const fullPrompt = `${SUPER_PMO_PROMPT}

---
HISTORIQUE :
${historyText}

---
MESSAGE DU CLIENT :
"${message}"

---
Reponds selon les instructions. Si tu as assez d'infos (10 thematiques couvertes), commence par [GENERATE].`;

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
            max_tokens: 500 
        })
    });

    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    if (aiResponse.startsWith('[GENERATE]')) {
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
charter_client: `Genere un PROJECT CHARTER CLIENT au format one-pager professionnel.

UTILISE CE FORMAT TABLEAU :

# PROJECT CHARTER

| Champ | Information |
|-------|-------------|
| Project Name | [nom du projet] |
| Project Manager | [a definir] |
| Project Sponsor | [client ou a definir] |
| Date | ${new Date().toLocaleDateString('fr-FR')} |

## Business Case
[Pourquoi ce projet ? Quel probleme resout-il ? En 3-4 phrases max]

## Expected Deliveries
[Liste des livrables attendus - 3 a 5 points]

## Team Members

| Role | Name | Hours |
|------|------|-------|
| [role] | [nom ou A definir] | [estimation] |

## Milestones

| Date | Goal |
|------|------|
| [date] | [jalon] |

## Risks and Constraints
[2-3 risques ou contraintes identifies]

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 2. PROJECT CHARTER ARK (INTERNE)
charter_ark: `Genere un PROJECT CHARTER ARK (version interne avec scoring).

# PROJECT CHARTER ARK (INTERNE)

## Identification
- Projet : [nom]
- Client : [nom]
- Consultant ARK : [a definir]
- Date : ${new Date().toLocaleDateString('fr-FR')}

## Scoring Projet

| Critere | Score | Commentaire |
|---------|-------|-------------|
| Urgence | [1-5] | [justification] |
| Maturite client | [1-5] | [justification] |
| Complexite | [1-5] | [justification] |
| Potentiel commercial | [1-5] | [justification] |

Legende : 1=Faible, 3=Moyen, 5=Eleve

## Synthese du besoin
[Resume en 5 lignes max]

## Diagnostic maturite client

| Domaine | Niveau |
|---------|--------|
| Organisation | Faible / Moyen / Eleve |
| Processus | Faible / Moyen / Eleve |
| Digital | Faible / Moyen / Eleve |
| Pilotage | Faible / Moyen / Eleve |

## Recommandation ARK

Option recommandee :
- [ ] Diagnostic approfondi
- [ ] Mission de cadrage structuree
- [ ] Offre operationnelle ciblee
- [ ] Mise en attente / reorientation

Priorite : Faible / Moyenne / Elevee

## Notes internes
[Observations pour l'equipe ARK]

---
Document interne ARK Corporat Group - Ne pas diffuser`,

// 3. CAHIER DE CHARGE
cahier_charge: `Genere un CAHIER DE CHARGE complet.

# CAHIER DE CHARGE

## 1. Presentation du projet
[Description generale]

## 2. Contexte et objectifs
### Contexte
[Situation actuelle]

### Objectifs
[Liste des objectifs]

## 3. Cible et marche
[Description de la clientele visee]

## 4. Description des services/produits
[Detail de l'offre]

## 5. Fonctionnalites et specifications
[Liste detaillee]

## 6. Organisation et ressources
[Equipe, locaux, equipements]

## 7. Budget estimatif
[Fourchette budgetaire]

## 8. Planning previsionnel
[Grandes phases]

## 9. Contraintes et risques
[Elements identifies]

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 4. BUDGET PREVISIONNEL
budget: `Genere un BUDGET PREVISIONNEL detaille.

# BUDGET PREVISIONNEL

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

## 3. Previsions de revenus

| Source | Montant mensuel (FCFA) |
|--------|------------------------|
| [source] | [montant] |
| **TOTAL REVENUS/MOIS** | **[total]** |

## 4. Point mort
[Analyse du seuil de rentabilite]

## 5. Moyens de paiement prevus
- Mobile Money (Airtel Money, MTN MoMo)
- Especes
- [autres]

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 5. PLAN DE PROJET
plan_projet: `Genere un PLAN DE PROJET structure.

# PLAN DE PROJET

## Phase 1 : Preparation
Duree : [X semaines]

| Tache | Responsable | Echeance |
|-------|-------------|----------|
| [tache] | [qui] | [date] |

## Phase 2 : Mise en place
Duree : [X semaines]

| Tache | Responsable | Echeance |
|-------|-------------|----------|
| [tache] | [qui] | [date] |

## Phase 3 : Lancement
Duree : [X semaines]

| Tache | Responsable | Echeance |
|-------|-------------|----------|
| [tache] | [qui] | [date] |

## Phase 4 : Suivi post-lancement
Duree : [X semaines]

| Tache | Responsable | Echeance |
|-------|-------------|----------|
| [tache] | [qui] | [date] |

## Jalons cles

| Date | Jalon |
|------|-------|
| [date] | [jalon] |

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 6. CHECKLIST LANCEMENT
checklist: `Genere une CHECKLIST DE LANCEMENT complete.

# CHECKLIST DE LANCEMENT

## Administratif
- [ ] [tache]
- [ ] [tache]

## Local et equipements
- [ ] [tache]
- [ ] [tache]

## Ressources humaines
- [ ] [tache]
- [ ] [tache]

## Commercial et marketing
- [ ] [tache]
- [ ] [tache]

## Financier
- [ ] [tache]
- [ ] [tache]

## Jour J
- [ ] [tache]
- [ ] [tache]

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 7. MATRICE DES RISQUES
risques: `Genere une MATRICE DES RISQUES detaillee.

# MATRICE DES RISQUES

## Risques eleves

| Risque | Impact | Probabilite | Mitigation |
|--------|--------|-------------|------------|
| [risque] | Eleve | [prob] | [action] |

## Risques moyens

| Risque | Impact | Probabilite | Mitigation |
|--------|--------|-------------|------------|
| [risque] | Moyen | [prob] | [action] |

## Risques faibles

| Risque | Impact | Probabilite | Mitigation |
|--------|--------|-------------|------------|
| [risque] | Faible | [prob] | [action] |

## Risques specifiques Congo-Brazzaville
- [risque local et mitigation]

## Plan de contingence
[Actions en cas de materialisation des risques majeurs]

---
Document interne ARK Corporat Group`,

// 8. SOP CLIENTS
sop_clients: `Genere les SOP CLIENTS (procedures operationnelles standards).

# SOP CLIENTS - PROCEDURES STANDARDS

## 1. Processus d'accueil client

### Objectif
[Description]

### Etapes
1. [etape]
2. [etape]
3. [etape]

### Responsable
[qui]

## 2. Processus de vente/service

### Objectif
[Description]

### Etapes
1. [etape]
2. [etape]
3. [etape]

### Responsable
[qui]

## 3. Processus de suivi client

### Objectif
[Description]

### Etapes
1. [etape]
2. [etape]
3. [etape]

### Responsable
[qui]

## 4. Gestion des reclamations

### Objectif
[Description]

### Etapes
1. [etape]
2. [etape]
3. [etape]

### Responsable
[qui]

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 9. SOP INTERNES
sop_internes: `Genere les SOP INTERNES (procedures operationnelles internes ARK).

# SOP INTERNES - PROCEDURES ARK

## 1. Processus de prise en charge projet

### Declencheur
[Quand ce processus demarre]

### Etapes
1. [etape]
2. [etape]
3. [etape]

### Livrables
[Documents a produire]

## 2. Processus de validation interne

### Criteres de validation
- [critere]
- [critere]

### Etapes
1. [etape]
2. [etape]

### Decideur
[qui valide]

## 3. Processus de suivi projet

### Frequence
[periodicite]

### Points de controle
- [point]
- [point]

### Reporting
[format et destinataires]

---
Document interne ARK Corporat Group - Ne pas diffuser`,

// 10. DIAGNOSTICS
diagnostics: `Genere un DIAGNOSTIC complet du projet.

# DIAGNOSTIC PROJET

## 1. Analyse de la situation actuelle

### Forces
- [force]
- [force]

### Faiblesses
- [faiblesse]
- [faiblesse]

### Opportunites
- [opportunite]
- [opportunite]

### Menaces
- [menace]
- [menace]

## 2. Analyse du marche

### Taille du marche
[estimation]

### Tendances
[evolutions observees]

### Concurrence
[acteurs et positionnement]

## 3. Analyse des ressources

### Ressources disponibles
- [ressource]

### Ressources manquantes
- [ressource]

### Gap a combler
[analyse]

## 4. Synthese du diagnostic

| Domaine | Etat | Priorite |
|---------|------|----------|
| [domaine] | [etat] | [priorite] |

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 11. RECOMMANDATIONS
recommandations: `Genere des RECOMMANDATIONS strategiques.

# RECOMMANDATIONS STRATEGIQUES

## 1. Recommandations prioritaires

### Recommandation 1
- **Action** : [description]
- **Justification** : [pourquoi]
- **Delai** : [quand]
- **Ressources** : [quoi]

### Recommandation 2
- **Action** : [description]
- **Justification** : [pourquoi]
- **Delai** : [quand]
- **Ressources** : [quoi]

## 2. Recommandations secondaires

### Recommandation 3
[description et justification]

### Recommandation 4
[description et justification]

## 3. Quick wins (gains rapides)
- [action rapide a impact immediat]
- [action rapide a impact immediat]

## 4. Actions a eviter
- [piege a eviter]
- [piege a eviter]

## 5. Prochaines etapes suggerees

| Etape | Action | Echeance |
|-------|--------|----------|
| 1 | [action] | [date] |
| 2 | [action] | [date] |
| 3 | [action] | [date] |

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 12. DESIGN THINKING
design_thinking: `Genere un document DESIGN THINKING.

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

## 2. DEFINE (Definir)

### Probleme a resoudre
[Enonce clair du probleme]

### Point de vue utilisateur
"En tant que [utilisateur], je veux [action] pour [benefice]"

## 3. IDEATE (Imaginer)

### Solutions envisagees
1. [solution]
2. [solution]
3. [solution]

### Solution retenue
[description et justification]

## 4. PROTOTYPE (Prototyper)

### MVP (Produit Minimum Viable)
[Description du MVP]

### Fonctionnalites essentielles
- [fonctionnalite]
- [fonctionnalite]

## 5. TEST (Tester)

### Hypotheses a valider
- [hypothese]
- [hypothese]

### Metriques de succes
- [metrique]
- [metrique]

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 13. BUSINESS MODEL
business_model: `Genere un BUSINESS MODEL CANVAS.

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

| Source | Modele | Estimation mensuelle |
|--------|--------|---------------------|
| [source] | [modele] | [montant] FCFA |

## 6. Ressources cles
[De quoi avez-vous besoin ?]
- [ressource]
- [ressource]

## 7. Activites cles
[Que devez-vous faire ?]
- [activite]
- [activite]

## 8. Partenaires cles
[Avec qui travaillez-vous ?]
- [partenaire]
- [partenaire]

## 9. Structure de couts
[Quels sont vos couts ?]

| Poste | Type | Estimation |
|-------|------|------------|
| [poste] | Fixe/Variable | [montant] FCFA |

---
Document genere par Ark Intelligence - ARK Corporat Group`,

// 14. LEAN STARTUP
lean_startup: `Genere un document LEAN START UP.

# LEAN START UP - PLAN DE VALIDATION

## 1. Hypothese de valeur
[Quelle valeur pensez-vous creer ?]

### Hypothese principale
"Nous croyons que [client] a besoin de [solution] car [raison]"

### Comment valider ?
[methode de validation]

## 2. Hypothese de croissance
[Comment allez-vous grandir ?]

### Moteur de croissance
- [ ] Viral (bouche-a-oreille)
- [ ] Payant (publicite)
- [ ] Sticky (retention)

## 3. MVP (Minimum Viable Product)

### Description du MVP
[version minimale du produit]

### Fonctionnalites incluses
- [fonctionnalite]
- [fonctionnalite]

### Fonctionnalites exclues (pour plus tard)
- [fonctionnalite]
- [fonctionnalite]

## 4. Metriques cles (AARRR)

| Metrique | Objectif | Comment mesurer |
|----------|----------|-----------------|
| Acquisition | [objectif] | [methode] |
| Activation | [objectif] | [methode] |
| Retention | [objectif] | [methode] |
| Revenue | [objectif] | [methode] |
| Referral | [objectif] | [methode] |

## 5. Cycle Build-Measure-Learn

### Build (Construire)
[Ce qu'on va construire en premier]

### Measure (Mesurer)
[Ce qu'on va mesurer]

### Learn (Apprendre)
[Questions auxquelles on veut repondre]

## 6. Pivot ou Persevere ?

### Criteres de pivot
[Quand changer de direction ?]

### Criteres de perseverance
[Quand continuer ?]

---
Document genere par Ark Intelligence - ARK Corporat Group`
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

REGLES :
- Base-toi UNIQUEMENT sur la conversation
- Si info manquante -> "A definir"
- Style professionnel et clair
- Adapte au contexte Congo-Brazzaville (Mobile Money, FCFA)
- Pas de blabla, que du concret
- PAS d'emojis sauf pour le scoring interne`;

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
            max_tokens: 3500 
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
