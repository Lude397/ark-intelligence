import { createClient } from '@supabase/supabase-js';

// ==================== CONFIGURATION ====================
const supabase = createClient(
    'https://ehaxnltgapcfxhwpqhyb.supabase.co',
    'COLLER_VOTRE_BASE64_ICI'
);

const MISTRAL_API_KEY = 'pnpx3zcKxb9xR2RK4kxyyOXNLDQ1paE4';

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

// ==================== RAG : RECHERCHE D'EXEMPLES SIMILAIRES ====================
async function findSimilarExamples(projectDescription) {
    try {
        // 1. Générer l'embedding avec Mistral
        const embeddingResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-embed',
                input: [projectDescription]
            })
        });

        if (!embeddingResponse.ok) {
            console.error('Erreur Mistral embedding');
            return null;
        }

        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding;

        // 2. Rechercher les exemples similaires dans Supabase
        const { data: similarExamples, error } = await supabase.rpc('search_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 3
        });

        if (error) {
            console.error('Erreur recherche Supabase:', error);
            return null;
        }

        // ==================== SOLUTION 4 : NETTOYAGE DES RÉFÉRENCES GÉOGRAPHIQUES ====================
        if (similarExamples && similarExamples.length > 0) {
            similarExamples.forEach(example => {
                // Liste des villes du Congo à neutraliser
                const villes = [
                    'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Loubomo', 
                    'Nkayi', 'Ouesso', 'Owando', 'Ewo', 'Impfondo', 
                    'Makoua', 'Djambala', 'Gamboma', 'Kinkala',
                    'Kindamba', 'Sibiti', 'Loutété', 'Madingou'
                ];
                
                // Remplacer chaque ville par [VILLE]
                villes.forEach(ville => {
                    const regex = new RegExp(ville, 'gi');
                    example.contenu = example.contenu.replace(regex, '[VILLE]');
                });
                
                // Nettoyer les autres références contextuelles
                example.contenu = example.contenu
                    .replace(/Congo-Brazzaville/gi, '[PAYS]')
                    .replace(/République du Congo/gi, '[PAYS]')
                    .replace(/FCFA/gi, '[DEVISE]')
                    .replace(/Franc CFA/gi, '[DEVISE]')
                    .replace(/Airtel Money/gi, '[MOBILE MONEY]')
                    .replace(/MTN Mobile Money/gi, '[MOBILE MONEY]')
                    .replace(/Poto-Poto/gi, '[QUARTIER]')
                    .replace(/Bacongo/gi, '[QUARTIER]')
                    .replace(/Mpila/gi, '[QUARTIER]')
                    .replace(/Moungali/gi, '[QUARTIER]')
                    .replace(/Lumumba/gi, '[QUARTIER]')
                    .replace(/Tie-Tie/gi, '[QUARTIER]')
                    .replace(/marché Total/gi, '[MARCHÉ LOCAL]');
                
                console.log('✅ Exemple nettoyé:', example.projet_type);
            });
        }
        // ==================== FIN NETTOYAGE ====================

        return similarExamples;

    } catch (error) {
        console.error('Erreur RAG:', error);
        return null;
    }
}

// ==================== PROMPT AVEC RAG ====================
function buildPromptWithRAG(similarExamples, projectDescription) {
    let examplesSection = '';
    
    if (similarExamples && similarExamples.length > 0) {
        // ==================== SOLUTION 4 : INSTRUCTION CLAIRE ====================
        examplesSection = `
---
📚 EXEMPLES DE QUESTIONS ADAPTÉES (références géographiques neutralisées)

⚠️ IMPORTANT : Les exemples ci-dessous utilisent des placeholders comme :
   • [VILLE] = toute ville (pas de mention de ville spécifique)
   • [PAYS] = tout pays
   • [DEVISE] = toute monnaie
   • [MOBILE MONEY] = tout moyen de paiement mobile
   • [QUARTIER] = tout quartier
   • [MARCHÉ LOCAL] = tout marché

👉 Inspire-toi UNIQUEMENT de la STRUCTURE et du STYLE des questions.
👉 Génère des options UNIVERSELLES et GÉNÉRIQUES, applicables partout.
👉 NE MENTIONNE AUCUNE ville, pays, devise ou lieu spécifique.

${similarExamples.map((ex, i) => `
### Exemple ${i + 1} : ${ex.projet_type}
${ex.contenu}
`).join('\n')}

➡️ Tes questions doivent être GÉNÉRIQUES et adaptables à n'importe quel contexte.
---
`;
        // ==================== FIN INSTRUCTION ====================
    }

    return `Tu es Ark Intelligence, expert en cadrage de projet.

**ÉTAPE 0 - CLASSIFICATION (OBLIGATOIRE au premier message) :**
Analyse le message du client AVANT de poser des questions :

1. QUESTION SUR L'APPLICATION ("c'est quoi", "comment ça marche", "à quoi ça sert", "qui a créé")
   → Réponds brièvement : Ark Intelligence aide à structurer les projets via 12 questions de cadrage.
   → Puis demande : "Décrivez-moi votre projet pour commencer !"

2. HORS SUJET (météo, blagues, politique, sujets non liés aux projets)
   → Réponds : "Je suis spécialisé dans le cadrage de projets entrepreneuriaux. Décrivez-moi votre idée et je vous guiderai !"

3. MESSAGE VAGUE ("j'ai une idée", "je veux entreprendre", "aide-moi")
   → Réponds : "Super ! Pouvez-vous me décrire votre projet plus précisément ? Par exemple : Je veux ouvrir une boulangerie, Je développe une application mobile..."

4. PROJET DÉTECTÉ (description d'activité, business, idée entrepreneuriale claire)
   → Passe directement à la MISSION ci-dessous

---

MISSION : Poser 12 questions de cadrage sous forme de QCM ADAPTÉ au projet du client.

${examplesSection}

RÈGLES IMPORTANTES :
1. Chaque question doit avoir 5 options (A, B, C, D, E)
2. Les options doivent être SPÉCIFIQUES au type de projet du client
3. PAS de mention de lieu géographique, ville, pays, quartier ou devise spécifique
4. Génère des exemples UNIVERSELS applicables partout dans le monde
5. Une question à la fois
6. Reformule d'abord ce que le client a dit

FORMAT DE RÉPONSE (si projet détecté) :

**Je reformule** : [reformulation courte]

**Phase [N] — [Titre de la phase]**

**Question [N] : [Titre]**

[Question adaptée au projet]

A) [Option spécifique au projet mais GÉNÉRIQUE]
B) [Option spécifique au projet mais GÉNÉRIQUE]
C) [Option spécifique au projet mais GÉNÉRIQUE]
D) [Option spécifique au projet mais GÉNÉRIQUE]
E) Autre (précisez)

---

LES 12 QUESTIONS À POSER :
1. Contexte - Qu'est-ce qui déclenche ce projet ?
2. Problème - Quel problème à résoudre ?
3. Bénéficiaire - Qui en bénéficie ?
4. Objectif (12 mois) - Qu'est-ce qui aura changé ?
5. Besoin réel - Quelles informations nécessaires ?
6. Limites actuelles - Pourquoi pas encore réalisé ?
7. Livrable - Qu'attendez-vous concrètement ?
8. Hors périmètre - Que ne doit PAS faire le projet ?
9. Capacité prioritaire - Quelle fonctionnalité critique ?
10. Contrainte principale - Quelle limite majeure ?
11. Risque - Qu'est-ce qui vous inquiète ?
12. Critère de succès - Comment mesurer le succès ?

---

APRÈS LA QUESTION 12 :
Réponds avec [GENERATE] suivi d'une synthèse des 12 réponses.

---

⚠️ RAPPEL CRITIQUE : NE JAMAIS afficher de texte comme "Analyse de l'historique" ou "je dois poser la question X". Ces réflexions internes doivent rester invisibles.

PROJET DU CLIENT : "${projectDescription}"`;
}

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    
    // ========== PRÉ-FILTRE SALUTATIONS (pas d'appel API) ==========
    const salutations = ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bonsoir', 'hi', 'yo', 'bjr', 'slt'];
    const messageClean = message.toLowerCase().trim();
    
    // Si c'est le PREMIER message ET c'est une salutation simple
    if ((!history || history.length === 0) && salutations.includes(messageClean)) {
        return res.status(200).json({ 
            action: 'continue',
            response: "Bonjour ! Je suis **Ark Intelligence**, votre assistant de cadrage de projet. 🎯\n\nDécrivez-moi votre idée de projet et je vous guiderai à travers 12 questions pour le structurer.\n\n**Exemple** : *\"Je veux ouvrir une boulangerie\"* ou *\"Je développe une application mobile\"*"
        });
    }
    // ========== FIN PRÉ-FILTRE ==========

    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    // Extraire la description du projet (premier message utilisateur substantiel)
    const firstUserMessage = history && history.length > 0 
        ? history.find(h => h.type === 'user')?.content 
        : message;

    // RAG : Rechercher des exemples similaires (avec nettoyage automatique)
    let similarExamples = null;
    if (firstUserMessage) {
        similarExamples = await findSimilarExamples(firstUserMessage);
        if (similarExamples && similarExamples.length > 0) {
            console.log(`✅ RAG: ${similarExamples.length} exemples trouvés et nettoyés pour "${firstUserMessage.substring(0, 50)}..."`);
        }
    }

    // Construire le prompt avec RAG
    const ragPrompt = buildPromptWithRAG(similarExamples, firstUserMessage);

    const fullPrompt = `${ragPrompt}

---
HISTORIQUE DE LA CONVERSATION :
${historyText}

---
NOUVEAU MESSAGE DU CLIENT :
"${message}"

---
INSTRUCTION : 
1. Si c'est le premier message, applique l'ÉTAPE 0 (classification)
2. Si un projet a été identifié, analyse l'historique pour identifier quelle question tu as déjà posée
3. Pose la question SUIVANTE avec des options A) B) C) D) E) adaptées au projet
4. Ne répète JAMAIS une question déjà posée
5. Les options doivent être SPÉCIFIQUES au projet du client (pas génériques)
6. AUCUNE mention de lieu géographique, ville, pays ou devise

Progression : Classification → Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → [GENERATE]`;

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
            max_tokens: 800 
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

---

# DÉFINITION DE PROJET
## [Nom du projet]

Date : {{DATE}}

---

### 1. Contexte
[Développe la réponse Q1 en un paragraphe]

### 2. Problème à résoudre
[Développe la réponse Q2 en un paragraphe]

### 3. Bénéficiaire principal
[Développe la réponse Q3 en un paragraphe]

### 4. Objectif stratégique
[Développe la réponse Q4 en un paragraphe]

### 5. Besoin réel
[Développe la réponse Q5 en un paragraphe]

### 6. Limites actuelles
[Développe la réponse Q6 en un paragraphe]

### 7. Livrable attendu
[Développe la réponse Q7 en un paragraphe]

### 8. Hors périmètre
[Développe la réponse Q8 en un paragraphe]

### 9. Exigences fonctionnelles
[Développe la réponse Q9 en un paragraphe]

### 10. Contraintes
[Développe la réponse Q10 en un paragraphe]

### 11. Risques
[Développe la réponse Q11 en un paragraphe]

### 12. Critères de succès
[Développe la réponse Q12 en un paragraphe]

---

Document généré par Ark Intelligence`,

// 2. ORIENTATION DE SOLUTION
orientation_solution: `Génère un document ORIENTATION DE SOLUTION.

---

# ORIENTATION DE SOLUTION
## [Nom du projet]

Date : {{DATE}}

---

### 1. Problème validé
### 2. Utilisateur prioritaire
### 3. Solution envisagée
### 4. Phrase d'orientation de solution
### 5. Alternatives écartées
### 6. Niveau de complexité
### 7. Faisabilité immédiate
### 8. Premier pas concret
### 9. Critère de bon choix
### 10. Décision formelle

---

Document généré par Ark Intelligence`,

// 3. FORMULATION DE SOLUTION
formulation_solution: `Génère un document FORMULATION DE SOLUTION.

---

# FORMULATION DE SOLUTION
## [Nom du projet]

Date : {{DATE}}

---

### 1. Rappel du problème ciblé
### 2. Utilisateur cible
### 3. Formulation centrale
### 4. Explication de la solution
### 5. Résultat attendu
### 6. Frontières de la solution
### 7. Critère de bonne formulation
### 8. Version courte (pitch)

---

Document généré par Ark Intelligence`,

// 4. DESIGN THINKING
design_thinking: `Génère un document DESIGN THINKING.

---

# DESIGN THINKING
## [Nom du projet]

Date : {{DATE}}

---

## Phase 1 — Empathie
### 1. Utilisateur cible
### 2. Problèmes et frustrations
### 3. Comportements et habitudes

## Phase 2 — Définition
### 4. Problème central
### 5. Impact si non résolu

## Phase 3 — Idéation
### 6. Idée principale
### 7. Alternatives

## Phase 4 — Prototypage
### 8. Forme du prototype
### 9. Objectif du prototype

## Phase 5 — Test
### 10. Utilisateurs testeurs
### 11. Méthode de test
### 12. Critères de validation

---

Document généré par Ark Intelligence`,

// 5. BUSINESS MODEL CANVAS
business_model: `Génère un BUSINESS MODEL CANVAS.

---

# BUSINESS MODEL CANVAS
## [Nom du projet]

Date : {{DATE}}

---

### 1. Segments de clients
### 2. Proposition de valeur
### 3. Canaux
### 4. Relation client
### 5. Sources de revenus
### 6. Ressources clés
### 7. Activités clés
### 8. Partenaires clés
### 9. Structure de coûts

---

Document généré par Ark Intelligence`,

// 6. LEAN STARTUP
lean_startup: `Génère un document LEAN STARTUP.

---

# LEAN STARTUP
## [Nom du projet]

Date : {{DATE}}

---

## Étape 1 — Problème
### 1. Problème à tester
### 2. Utilisateur concerné
### 3. Solutions existantes

## Étape 2 — Hypothèses
### 4. Hypothèse de valeur
### 5. Hypothèse de croissance
### 6. Hypothèse de monétisation

## Étape 3 — MVP
### 7. Description du MVP
### 8. Objectif du MVP

## Étape 4 — Mesure
### 9. Indicateur clé
### 10. Seuil de succès

## Étape 5 — Apprentissage
### 11. Enseignements attendus
### 12. Décision stratégique

---

Document généré par Ark Intelligence`,

// 7. AGILE
agile: `Génère un document AGILE.

---

# AGILE
## [Nom du projet]

Date : {{DATE}}

---

## Phase 1 — Vision
### 1. Objectif du projet
### 2. Valeur prioritaire

## Phase 2 — Backlog
### 3. Backlog des fonctionnalités
### 4. Sprint en cours

## Phase 3 — Exécution
### 5. Tâches du sprint
### 6. Obstacles et bloquants

## Phase 4 — Revue
### 7. Livrables produits
### 8. Retours utilisateurs

## Phase 5 — Amélioration
### 9. Enseignements du sprint
### 10. Actions d'amélioration
### 11. Décision pour le sprint suivant

---

Document généré par Ark Intelligence`
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
- Pas de blabla, que du concret
- PAS d'émojis
- N'utilise JAMAIS de majuscules inappropriées`;

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
