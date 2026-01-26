import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://kolwacpvfxdrptldipzj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHdhY3B2ZnhkcnB0bGRpcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYzOTMsImV4cCI6MjA3NzQwMjM5M30.cXXOxBkX9KaddhfY5JoAvMGz-ohxdCoh5iQlHMUGHqE'
);

// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, docType, userId, projetNom } = req.body;

        if (mode === 'chat') {
            return await handleChat(res, message, history);
        }
        
        if (mode === 'generate') {
            return await handleGenerate(res, history, docType, userId, projetNom);
        }

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ==================== SUPER PMO PROMPT MINIMALISTE ====================
const SUPER_PMO_PROMPT = `Tu es Ark Intelligence, expert en cadrage de projet.

RÈGLE N°1 - INTERDIT ABSOLU :
❌ JAMAIS de format A) B) C) D) E)
❌ JAMAIS de "Exemples de réponses possibles"
❌ JAMAIS de liste à choix multiples

RÈGLE N°2 - CE QUE TU DOIS FAIRE :
✅ Pose des questions conversationnelles
✅ Adapte chaque question au projet de l'utilisateur  
✅ Une question à la fois

---

PROGRESSION : Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → [GENERATE]

---

FORMAT DE RÉPONSE :

**Je reformule** : [reformulation]

**Phase [N] — [Titre]**

**Question [N] : [Titre]**

[Ta question personnalisée - voir exemples ci-dessous]

---

LES 12 QUESTIONS AVEC EXEMPLES CONCRETS :

**Q1 - Contexte**

MAUVAIS ❌ :
"Qu'est-ce qui déclenche ce projet ?
A) Problème récurrent
B) Opportunité  
C) Demande externe"

BON ✅ :
"Qu'est-ce qui vous pousse à lancer cette boulangerie maintenant ? Une difficulté que vous rencontrez, une opportunité que vous voyez, ou autre chose ?"

**Q2 - Problème**

MAUVAIS ❌ :
"Quel problème ?
A) Pas de solution
B) Trop cher
C) Trop complexe"

BON ✅ :
"Pour votre boulangerie, c'est quoi le vrai problème à résoudre ? Les clients n'ont pas accès facilement à du pain frais, ou c'est autre chose ?"

**Q3 - Bénéficiaire**

BON ✅ :
"Qui va bénéficier de cette boulangerie ? Vous directement, vos clients du quartier, ou d'autres personnes ?"

**Q4 - Objectif (12 mois)**

BON ✅ :
"Dans un an, si tout marche bien, qu'est-ce qui aura changé ? Vous aurez plus de revenus, une meilleure réputation, ou autre chose ?"

**Q5 - Besoin réel**

BON ✅ :
"De quelles informations vous avez besoin pour avancer ? Mieux comprendre le marché local, définir vos offres, ou identifier les contraintes ?"

**Q6 - Limites actuelles**

BON ✅ :
"Pourquoi cette boulangerie n'existe pas encore ? Manque de financement, pas d'emplacement, ou autre raison ?"

**Q7 - Livrable**

BON ✅ :
"Concrètement, vous attendez quoi à la fin ? Un local équipé et prêt, un business plan, ou autre chose ?"

**Q8 - Hors périmètre**

BON ✅ :
"Qu'est-ce que ce projet ne doit PAS faire ? Par exemple, gérer la livraison à domicile dès le début ?"

**Q9 - Capacité prioritaire**

BON ✅ :
"Quelle est la capacité la plus importante pour votre boulangerie ? Produire du pain frais tous les jours, attirer des clients, ou fidéliser ?"

**Q10 - Contrainte principale**

BON ✅ :
"C'est quoi votre contrainte principale ? Budget limité, local à trouver rapidement, ou autre chose ?"

**Q11 - Risque**

BON ✅ :
"Qu'est-ce qui vous inquiète le plus ? Que les clients ne viennent pas, que la qualité ne soit pas au rendez-vous, ou autre chose ?"

**Q12 - Critère de succès**

BON ✅ :
"Comment vous saurez que c'est un succès ? Nombre de clients par jour, chiffre d'affaires mensuel, ou satisfaction des clients ?"

---

PREMIER MESSAGE :
"Bonjour ! Je suis Ark Intelligence."
Puis pose Q1.

APRÈS Q12 :
[GENERATE]
Cadrage terminé. Synthèse :
- Contexte : [Q1]
- Problème : [Q2]
...

---

RAPPEL FINAL :
- Jamais de A) B) C) D) E)
- Questions conversationnelles uniquement  
- Adapte au projet de l'utilisateur`;
**Je reformule** : [court]

**Phase X — [titre]**

**Question X : [titre]**

[Question ouverte conversationnelle]

---

PREMIER MESSAGE :
"Bonjour ! Je suis Ark Intelligence."
Puis reformule et pose Q1.

---

APRÈS Q12 :
[GENERATE]
Synthèse avec les 12 réponses.`;

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    // Extraire le projet de l'utilisateur depuis le premier message
    const firstUserMessage = history && history.length > 0 
        ? history.find(h => h.type === 'user')?.content 
        : message;

    const fullPrompt = `${SUPER_PMO_PROMPT}

---
PROJET DU CLIENT : "${firstUserMessage}"

CONTEXTE À ANALYSER :
- Type de projet (e-commerce, app, service, plateforme, etc.)
- Secteur d'activité
- Zone géographique (si mentionnée)
- Public cible probable

INSTRUCTIONS CRITIQUES :
1. Analyse le projet du client pour comprendre son contexte
2. Identifie le type de projet et le secteur
3. Pose des questions ADAPTÉES et CONVERSATIONNELLES
4. Mentionne les spécificités locales (Mobile Money, FCFA, Congo)
5. INTERDIT ABSOLU : Jamais de liste A) B) C) D) E)
6. Si tu veux donner des exemples, intègre-les dans ta question de manière fluide

---
HISTORIQUE DE LA CONVERSATION :
${historyText}

---
NOUVEAU MESSAGE DU CLIENT :
"${message}"

---
INSTRUCTION : 
Analyse l'historique pour identifier où tu en es, puis pose la question SUIVANTE de manière personnalisée et conversationnelle.

NE RÉPÈTE JAMAIS une question déjà posée.
JAMAIS de format QCM (A, B, C, D, E).
Questions ouvertes et naturelles uniquement.

Progression : Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → [GENERATE]`;

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

// ==================== FONCTION DATE ====================
function getFormattedDate() {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
}

// ==================== PROMPTS DOCUMENTS ====================
const DOCUMENT_PROMPTS = {

// 1. DÉFINITION DE PROJET (12 sections)
definition_projet: `Génère une DÉFINITION DE PROJET basée UNIQUEMENT sur les 12 questions du cadrage.

RÈGLES STRICTES :
- Utilise UNIQUEMENT les réponses des 12 questions collectées
- NE PAS inventer d'informations supplémentaires
- Développe chaque réponse en un paragraphe fluide et professionnel
- Pas de mention de source (Q1, Q2...) dans le document final
- Style professionnel, phrases complètes
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

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

# DÉFINITION DE PROJET
## [Nom du projet]

Date : {{DATE}}

---

### 1. Contexte

[Développe la réponse Q1 en un paragraphe expliquant ce qui déclenche ce projet maintenant, le contexte général et pourquoi c'est le bon moment pour agir.]

---

### 2. Problème à résoudre

[Développe la réponse Q2 en un paragraphe décrivant le problème principal que ce projet cherche à résoudre, ses manifestations et ses impacts sur l'activité.]

---

### 3. Bénéficiaire principal

[Développe la réponse Q3 en un paragraphe identifiant clairement qui bénéficiera le plus de ce projet et comment ce bénéficiaire sera impacté positivement.]

---

### 4. Objectif stratégique

[Développe la réponse Q4 en un paragraphe décrivant ce qui aura concrètement changé dans 12 mois si le projet réussit, les résultats attendus et leur impact.]

---

### 5. Besoin réel

[Développe la réponse Q5 en un paragraphe expliquant les informations nécessaires pour bien cadrer ce projet et pourquoi elles sont essentielles.]

---

### 6. Limites actuelles

[Développe la réponse Q6 en un paragraphe expliquant pourquoi ce problème n'a pas encore été résolu, les obstacles rencontrés et les blocages actuels.]

---

### 7. Livrable attendu

[Développe la réponse Q7 en un paragraphe décrivant précisément ce que le projet doit produire concrètement à la fin, le format et l'utilisation prévue.]

---

### 8. Hors périmètre

[Développe la réponse Q8 en un paragraphe listant ce que ce projet ne fera pas, les exclusions explicites et les limites posées pour éviter les dérives.]

---

### 9. Exigences fonctionnelles

[Développe la réponse Q9 en un paragraphe décrivant la ou les fonctionnalités prioritaires que le projet doit absolument permettre.]

---

### 10. Contraintes

[Développe la réponse Q10 en un paragraphe détaillant les contraintes principales qui encadrent ce projet et doivent être respectées.]

---

### 11. Risques

[Développe la réponse Q11 en un paragraphe identifiant les risques principaux qui pourraient compromettre le succès du projet et leurs impacts potentiels.]

---

### 12. Critères de succès

[Développe la réponse Q12 en un paragraphe définissant comment le succès du projet sera mesuré, les indicateurs clés et les seuils attendus.]

---

Document généré par Ark Intelligence`,

// 2. ORIENTATION DE SOLUTION (10 sections)
orientation_solution: `Génère un document ORIENTATION DE SOLUTION basé sur les réponses du cadrage.

RÈGLES :
- Style professionnel et orienté décision
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

---

# ORIENTATION DE SOLUTION
## [Nom du projet]

Date : {{DATE}}

---

### 1. Problème validé

[Développe en un paragraphe rappelant le problème principal validé lors des phases précédentes. Explique pourquoi ce problème est réel, prioritaire et mérite une solution maintenant.]

---

### 2. Utilisateur prioritaire

[Développe en un paragraphe décrivant l'utilisateur sur lequel la solution va se concentrer en priorité. Explique pourquoi ce segment est choisi maintenant, même s'il en existe d'autres.]

---

### 3. Solution envisagée (orientation principale)

[Développe en un paragraphe décrivant la solution retenue. Explique ce que c'est, ce que ça fait concrètement et pourquoi cette solution est choisie parmi toutes les options possibles.]

---

### 4. Phrase d'orientation de solution

**Pour** [utilisateur prioritaire]
**qui a besoin de** [besoin critique]
**nous choisissons de développer** [solution retenue]
**afin de** [résultat mesurable attendu]

[Explique ensuite en un paragraphe pourquoi cette orientation est claire, réaliste et alignée avec le problème.]

---

### 5. Alternatives écartées (et pourquoi)

[Développe en un paragraphe listant les autres solutions envisagées mais volontairement écartées. Explique pourquoi elles ne sont pas prioritaires maintenant (coût, complexité, timing, dépendances…).]

---

### 6. Niveau de complexité de la solution

[Développe en un paragraphe évaluant la complexité de la solution choisie (faible / moyenne / élevée). Explique les raisons de cette évaluation.]

---

### 7. Faisabilité immédiate

[Développe en un paragraphe expliquant si cette solution est faisable immédiatement avec les ressources actuelles. Précise ce qui est déjà disponible et ce qui manque.]

---

### 8. Premier pas concret (action n°1)

[Développe en un paragraphe décrivant la toute première action concrète à réaliser pour matérialiser cette solution. Cette action doit être simple, claire et réalisable rapidement.]

---

### 9. Critère de bon choix

[Développe en un paragraphe expliquant comment tu sauras que cette orientation était la bonne. Décris les signaux rapides qui confirmeront ou invalideront le choix.]

---

### 10. Décision formelle

[Développe en un paragraphe actant la décision : on s'engage sur cette solution, pour une période donnée, avec un objectif clair.]

---

Document généré par Ark Intelligence`,

// 3. FORMULATION DE SOLUTION (8 sections)
formulation_solution: `Génère un document FORMULATION DE SOLUTION basé sur les réponses du cadrage.

RÈGLES :
- Style clair, sans jargon technique
- Centré utilisateur
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

---

# FORMULATION DE SOLUTION
## [Nom du projet]

Date : {{DATE}}

---

### 1. Rappel du problème ciblé

[Développe en un paragraphe rappelant le problème précis que la solution vise à résoudre. Le problème doit être clair, concret, centré utilisateur et déjà validé lors des étapes précédentes.]

---

### 2. Utilisateur cible de la solution

[Développe en un paragraphe décrivant l'utilisateur exact pour lequel la solution est formulée. Explique son contexte, son besoin prioritaire et pourquoi il est le cœur de la solution.]

---

### 3. Formulation centrale de la solution

**Pour** [utilisateur]
**qui rencontre** [problème / besoin critique]
**nous proposons** [solution formulée clairement]
**afin de** [bénéfice principal mesurable ou observable]

⚠️ La solution est formulée sans jargon, sans technologie imposée, et compréhensible par un non-expert.

---

### 4. Explication de la solution

[Développe en un paragraphe expliquant simplement comment la solution fonctionne. Décris ce que fait la solution, comment l'utilisateur l'utilise et ce qui change concrètement pour lui.]

---

### 5. Résultat attendu pour l'utilisateur

[Développe en un paragraphe décrivant ce que l'utilisateur obtient réellement grâce à la solution. Explique le "avant / après" de manière concrète.]

---

### 6. Frontières de la solution (ce qu'elle ne fait pas)

[Développe en un paragraphe listant clairement ce que la solution ne couvre pas volontairement. L'objectif est d'éviter la dispersion et la surcharge fonctionnelle.]

---

### 7. Critère de bonne formulation

[Développe en un paragraphe expliquant comment savoir si la solution est bien formulée. Exemples de signaux : compréhension immédiate, capacité à la reformuler, adhésion rapide de l'utilisateur.]

---

### 8. Version courte (pitch 1 phrase)

[Réécris la formulation centrale de la solution en une seule phrase simple, utilisable dans un pitch oral, un chatbot ou une présentation.]

---

Document généré par Ark Intelligence
Rôle : Clarifier → Aligner → Préparer l'exécution`,

// 4. DESIGN THINKING (5 phases, 12 sections)
design_thinking: `Génère un document DESIGN THINKING basé sur les réponses du cadrage.

RÈGLES :
- Structure en 5 phases
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

---

# DESIGN THINKING
## [Nom du projet]

Date : {{DATE}}

---

## Phase 1 — Empathie

### 1. Utilisateur cible

[Développe en un paragraphe décrivant précisément pour qui cette solution est conçue. Explique qui est cet utilisateur, son contexte, son quotidien, ses contraintes et pourquoi il est concerné par ce projet.]

### 2. Problèmes et frustrations

[Développe en un paragraphe expliquant les difficultés réelles rencontrées par cet utilisateur. Décris ce qui le bloque aujourd'hui, ce qui lui fait perdre du temps, de l'argent ou de l'énergie.]

### 3. Comportements et habitudes

[Développe en un paragraphe décrivant comment l'utilisateur agit aujourd'hui pour résoudre son problème. Explique ses habitudes, ses solutions actuelles et leurs limites.]

---

## Phase 2 — Définition du problème

### 4. Problème central à résoudre

[Développe en un paragraphe formulant clairement le problème principal à résoudre. Le problème doit être spécifique, centré sur l'utilisateur et formulé de manière actionnable.]

### 5. Impact si le problème persiste

[Développe en un paragraphe expliquant ce qui se passe si ce problème n'est pas résolu. Décris les conséquences pour l'utilisateur, son activité ou son quotidien.]

---

## Phase 3 — Idéation

### 6. Idée de solution principale

[Développe en un paragraphe décrivant l'idée de solution envisagée. Explique comment cette idée répond au problème défini et en quoi elle améliore la situation de l'utilisateur.]

### 7. Alternatives envisagées

[Développe en un paragraphe présentant d'autres idées possibles ou variantes de la solution principale. Explique pourquoi certaines sont écartées ou mises en second plan.]

---

## Phase 4 — Prototypage

### 8. Forme du prototype

[Développe en un paragraphe décrivant ce que sera concrètement le prototype. Explique le format choisi (maquette, formulaire, landing page, service manuel, MVP, etc.) et pourquoi ce format est pertinent.]

### 9. Objectif du prototype

[Développe en un paragraphe expliquant ce que ce prototype doit permettre de vérifier. Décris ce que tu cherches à apprendre ou à valider auprès des utilisateurs.]

---

## Phase 5 — Test

### 10. Utilisateurs testeurs

[Développe en un paragraphe décrivant qui testera le prototype. Explique pourquoi ces personnes sont pertinentes et comment elles seront sélectionnées.]

### 11. Méthode de test

[Développe en un paragraphe expliquant comment le prototype sera testé. Décris le déroulé du test, les interactions prévues et les retours attendus.]

### 12. Critères de validation

[Développe en un paragraphe définissant comment tu sauras si la solution est validée ou non. Explique les signaux positifs, négatifs et les décisions qui en découleront.]

---

Document généré par Ark Intelligence
Méthode : Comprendre → Définir → Imaginer → Tester → Décider`,

// 5. BUSINESS MODEL CANVAS (9 sections)
business_model: `Génère un BUSINESS MODEL CANVAS basé sur les réponses du cadrage.

RÈGLES :
- Les 9 blocs classiques du BMC
- Adapté au contexte local (Mobile Money, FCFA si pertinent)
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

---

# BUSINESS MODEL CANVAS
## [Nom du projet]

Date : {{DATE}}

---

### 1. Segments de clients

[Développe en un paragraphe décrivant précisément qui sont les clients visés par ce projet. Explique leur profil, leur situation actuelle, leurs besoins prioritaires et pourquoi ce segment est stratégique.]

---

### 2. Proposition de valeur

[Développe en un paragraphe expliquant ce que le projet apporte concrètement aux clients. Décris le problème principal résolu, le bénéfice clé et la valeur perçue par le client.]

---

### 3. Canaux

[Développe en un paragraphe décrivant comment la proposition de valeur est communiquée, distribuée et livrée aux clients. Explique comment les clients découvrent l'offre, comment ils y accèdent et comment ils l'utilisent.]

---

### 4. Relation client

[Développe en un paragraphe expliquant le type de relation entretenue avec les clients. Décris comment les clients sont accompagnés, assistés, fidélisés ou suivis avant, pendant et après l'utilisation de la solution.]

---

### 5. Sources de revenus

[Développe en un paragraphe décrivant comment le projet génère des revenus. Explique ce que les clients paient, à quel moment, sous quelle forme (abonnement, commission, paiement unique, etc.) et pour quelle valeur.]

---

### 6. Ressources clés

[Développe en un paragraphe identifiant les ressources indispensables au fonctionnement du projet. Explique les ressources humaines, techniques, financières ou organisationnelles nécessaires pour délivrer la proposition de valeur.]

---

### 7. Activités clés

[Développe en un paragraphe décrivant les activités essentielles à réaliser pour que le modèle fonctionne. Explique ce qui doit absolument être exécuté pour créer, livrer et maintenir la valeur.]

---

### 8. Partenaires clés

[Développe en un paragraphe identifiant les partenaires stratégiques du projet. Explique leur rôle, ce qu'ils apportent et pourquoi ces partenariats sont nécessaires ou utiles.]

---

### 9. Structure de coûts

[Développe en un paragraphe décrivant les principaux coûts liés au fonctionnement du modèle économique. Explique où vont les dépenses majeures et quelles sont les charges critiques à maîtriser.]

---

Document généré par Ark Intelligence
Objectif : Clarifier → Structurer → Décider`,

// 6. LEAN START UP (5 étapes, 12 sections)
lean_startup: `Génère un document LEAN START UP basé sur les réponses du cadrage.

RÈGLES :
- Structure en 5 étapes
- Orienté test et validation
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

---

# LEAN START UP
## [Nom du projet]

Date : {{DATE}}

---

## Étape 1 — Problème

### 1. Problème principal à tester

[Développe en un paragraphe décrivant le problème principal que tu cherches à valider. Explique pourquoi ce problème est critique pour l'utilisateur et pourquoi il mérite d'être testé maintenant.]

### 2. Utilisateur concerné

[Développe en un paragraphe décrivant précisément l'utilisateur ciblé par ce test. Explique son contexte, ses contraintes et pourquoi il est directement impacté par ce problème.]

### 3. Solutions existantes

[Développe en un paragraphe expliquant comment l'utilisateur résout actuellement ce problème. Décris les solutions existantes, leurs limites et pourquoi elles ne sont pas pleinement satisfaisantes.]

---

## Étape 2 — Hypothèses

### 4. Hypothèse de valeur

[Développe en un paragraphe formulant l'hypothèse principale de valeur. Explique ce que tu penses que l'utilisateur va réellement apprécier ou adopter.]

### 5. Hypothèse de croissance

[Développe en un paragraphe expliquant comment tu penses atteindre et faire croître ta base d'utilisateurs. Décris le canal principal et le mécanisme de diffusion envisagé.]

### 6. Hypothèse de monétisation

[Développe en un paragraphe expliquant comment tu penses générer des revenus. Explique ce que l'utilisateur serait prêt à payer et pourquoi.]

---

## Étape 3 — MVP (minimum viable product)

### 7. Description du MVP

[Développe en un paragraphe décrivant la version la plus simple possible de la solution à construire. Explique ce qu'elle fait, ce qu'elle ne fait pas et pourquoi elle est suffisante pour tester les hypothèses.]

### 8. Objectif du MVP

[Développe en un paragraphe expliquant ce que ce MVP doit permettre d'apprendre. Décris clairement l'hypothèse principale que ce MVP cherche à valider.]

---

## Étape 4 — Mesure

### 9. Indicateur clé à mesurer

[Développe en un paragraphe décrivant l'indicateur principal à suivre. Explique pourquoi cet indicateur est pertinent et ce qu'il dira sur la réussite ou l'échec du test.]

### 10. Seuil de succès

[Développe en un paragraphe définissant le seuil à partir duquel l'hypothèse sera considérée comme validée. Explique ce qui constitue un signal positif ou négatif.]

---

## Étape 5 — Apprentissage et décision

### 11. Enseignements attendus

[Développe en un paragraphe expliquant ce que tu cherches à apprendre grâce au test. Décris les décisions que ces apprentissages pourraient déclencher.]

### 12. Décision stratégique

[Développe en un paragraphe indiquant la décision à prendre après le test : continuer, pivoter, ou arrêter. Explique pourquoi.]

---

Document généré par Ark Intelligence
Méthode : Tester → Mesurer → Apprendre → Décider`,

// 7. AGILE (5 phases, 11 sections)
agile: `Génère un document AGILE basé sur les réponses du cadrage.

RÈGLES :
- Structure en 5 phases
- Orienté sprint et itération
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases

---

# AGILE
## [Nom du projet]

Date : {{DATE}}

---

## Phase 1 — Vision et priorités

### 1. Objectif du projet (sprint goal global)

[Développe en un paragraphe décrivant l'objectif principal du projet à ce stade. Explique ce que l'équipe cherche à accomplir concrètement sur une période courte (30 à 90 jours).]

### 2. Valeur à livrer en priorité

[Développe en un paragraphe expliquant quelle valeur doit être livrée en premier à l'utilisateur. Décris ce qui est le plus important à délivrer maintenant et pourquoi.]

---

## Phase 2 — Backlog et planification

### 3. Backlog des fonctionnalités / tâches

[Développe en un paragraphe listant les fonctionnalités, tâches ou actions à réaliser. Explique comment elles sont priorisées et ce qui est inclus ou exclu à ce stade.]

### 4. Sprint en cours

[Développe en un paragraphe décrivant le sprint actuel : sa durée (ex. 1 à 2 semaines), son objectif et les livrables attendus à la fin du sprint.]

---

## Phase 3 — Exécution

### 5. Tâches du sprint

[Développe en un paragraphe expliquant quelles tâches concrètes sont exécutées pendant ce sprint. Décris qui fait quoi et comment l'avancement est suivi.]

### 6. Obstacles et bloquants

[Développe en un paragraphe identifiant les obstacles rencontrés pendant l'exécution. Explique ce qui ralentit l'équipe et comment ces blocages sont traités.]

---

## Phase 4 — Revue et feedback

### 7. Livrables produits

[Développe en un paragraphe décrivant ce qui a été livré à la fin du sprint. Explique ce qui est utilisable, testable ou montrable aux utilisateurs.]

### 8. Retours utilisateurs / parties prenantes

[Développe en un paragraphe expliquant les retours obtenus. Décris ce qui fonctionne, ce qui ne fonctionne pas et ce que cela change pour la suite.]

---

## Phase 5 — Amélioration continue

### 9. Enseignements du sprint

[Développe en un paragraphe résumant les principaux apprentissages du sprint. Explique ce que l'équipe a compris sur le produit, l'utilisateur ou le process.]

### 10. Actions d'amélioration

[Développe en un paragraphe décrivant les améliorations à mettre en place pour le prochain sprint. Explique ce qui sera fait différemment.]

### 11. Décision pour le sprint suivant

[Développe en un paragraphe indiquant la décision prise : continuer dans la même direction, ajuster les priorités ou revoir l'objectif.]

---

Document généré par Ark Intelligence
Méthode : Planifier → Construire → Tester → Ajuster`
};

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history, docType = 'definition_projet', userId = null, projetNom = null) {
    const conversationText = history.map(h => 
        `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`
    ).join('\n\n');

    let docPrompt = DOCUMENT_PROMPTS[docType] || DOCUMENT_PROMPTS.definition_projet;
    
    // Remplacer {{DATE}} par la date actuelle
    const currentDate = getFormattedDate();
    docPrompt = docPrompt.replace(/\{\{DATE\}\}/g, currentDate);

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
- PAS d'émojis
- N'utilise JAMAIS de majuscules inappropriées au milieu des phrases (écris "et" pas "ET", "ou" pas "OU")
- Les titres de sections doivent être en minuscules (sauf première lettre)`;

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
    
    // Sauvegarder dans Supabase si userId est fourni
    if (userId && projetNom) {
        try {
            await supabase.from('ark_documents').insert({
                user_id: userId,
                projet_nom: projetNom,
                doc_type: docType,
                contenu: document
            });
        } catch (error) {
            console.error('Erreur sauvegarde document:', error);
        }
    }
    
    return res.status(200).json({ 
        success: true,
        document: document
    });
}
