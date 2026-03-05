// FICHIER : api/chat.js
// ROLE : Backend serveur - routing, prompts interview, generation documents
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { DOCUMENT_PROMPTS, DOCUMENT_LABELS, DOCUMENT_TITLES, DOC_CONFIG } from './prompts/index.js';
 
// ==================== CONFIGURATION ====================
const supabase = createClient(
    'https://ehaxnltgapcfxhwpqhyb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYXhubHRnYXBjZnhod3BxaHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDg1NjksImV4cCI6MjA4MjkyNDU2OX0.-XLe5c2sgzGxv9Olc13Lu3S0hTHjSbs2brbvVC556Ec'
);

const MISTRAL_API_KEY = 'pnpx3zcKxb9xR2RK4kxyyOXNLDQ1paE4';

// ==================== DETECTION DE PROGRESSION (FILET DE SECURITE SERVEUR) ====================
function detectProgress(history, docType = 'definition_projet') {
    const config = DOC_CONFIG[docType] || DOC_CONFIG.definition_projet;
    const maxQ = config.totalQuestions;
    const hasNameStep = config.hasNameStep;
    
    if (!history || history.length === 0) {
        return { questionNum: 0, maxQuestions: maxQ, isComplete: false, hasNameStep, nameProposed: false };
    }
    
    let questionCount = 0;
    let nameProposed = false;
    
    for (const msg of history) {
        if (msg.type === 'assistant' || msg.type === 'ai') {
            const regex = /Question\s+(\d+)/gi;
            let match;
            while ((match = regex.exec(msg.content)) !== null) {
                const num = parseInt(match[1]);
                if (num > questionCount) questionCount = num;
            }
            
            if (hasNameStep && (
                msg.content.includes('nom souhaitez-vous') || 
                msg.content.includes('Propositions de noms') ||
                msg.content.includes('nom a votre projet') ||
                msg.content.includes('nom \u00e0 votre projet') ||
                msg.content.includes('donnons un nom')
            )) {
                nameProposed = true;
            }
        }
    }
    
    const isComplete = questionCount >= maxQ;
    
    return { questionNum: questionCount, maxQuestions: maxQ, isComplete, hasNameStep, nameProposed };
}

// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    if (req.method === 'GET') {
        const { token } = req.query;
        if (token) return await getSharedDocument(res, token);
        return res.status(400).json({ error: 'Token manquant' });
    }
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, docType, userId, projetNom, documentId, sharedLinkId, viewerUserId, viewerIp, owner, project } = req.body;

        if (mode === 'chat') return await handleChat(res, message, history, docType);
        if (mode === 'generate') return await handleGenerate(res, history, docType, userId, projetNom);
        if (mode === 'createShareLink') return await createShareLink(res, documentId, userId, projetNom);
        if (mode === 'trackView') return await trackView(res, sharedLinkId, viewerUserId, viewerIp);
        if (mode === 'getStats') return await getDocumentStats(res, documentId, userId);
        if (mode === 'getUserDocuments') return await getUserDocuments(res, userId);
        if (mode === 'updateUserProfile') return await updateUserProfile(res, userId, req.body);
        if (mode === 'getUserProfile') return await getUserProfile(res, userId);
        if (mode === 'deleteDocument') return await deleteDocument(res, documentId, userId);
        if (mode === 'getSharedDocument') return await getSharedDocumentByOwnerProject(res, owner, project);

        return res.status(400).json({ error: 'Mode invalide' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ==================== RAG : RECHERCHE D'EXEMPLES SIMILAIRES ====================
async function findSimilarExamples(projectDescription) {
    try {
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

        const { data: similarExamples, error } = await supabase.rpc('search_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 3
        });

        if (error) {
            console.error('Erreur recherche Supabase:', error);
            return null;
        }

        if (similarExamples && similarExamples.length > 0) {
            similarExamples.forEach(example => {
                const villes = [
                    'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Loubomo', 
                    'Nkayi', 'Ouesso', 'Owando', 'Ewo', 'Impfondo', 
                    'Makoua', 'Djambala', 'Gamboma', 'Kinkala',
                    'Kindamba', 'Sibiti', 'Loutete', 'Madingou'
                ];
                
                villes.forEach(ville => {
                    const regex = new RegExp(ville, 'gi');
                    example.contenu = example.contenu.replace(regex, '[VILLE]');
                });
                
                example.contenu = example.contenu
                    .replace(/Congo-Brazzaville/gi, '[PAYS]')
                    .replace(/Republique du Congo/gi, '[PAYS]')
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
                    .replace(/marche Total/gi, '[MARCHE LOCAL]');
                
                console.log('Exemple nettoye:', example.projet_type);
            });
        }

        return similarExamples;

    } catch (error) {
        console.error('Erreur RAG:', error);
        return null;
    }
}

// ==================== PROMPTS D'INTERVIEW ====================

function buildPromptDefinition(similarExamples, projectDescription) {
    let examplesSection = '';
    
    if (similarExamples && similarExamples.length > 0) {
        examplesSection = `
---
EXEMPLES DE QUESTIONS ADAPTEES (references geographiques neutralisees)

IMPORTANT : Les exemples ci-dessous utilisent des placeholders comme :
   - [VILLE] = toute ville
   - [PAYS] = tout pays
   - [DEVISE] = toute monnaie
   - [MOBILE MONEY] = tout moyen de paiement mobile
   - [QUARTIER] = tout quartier
   - [MARCHE LOCAL] = tout marche

-> Inspire-toi UNIQUEMENT de la STRUCTURE et du STYLE des questions.
-> Genere des options UNIVERSELLES et GENERIQUES, applicables partout.
-> NE MENTIONNE AUCUNE ville, pays, devise ou lieu specifique.

${similarExamples.map((ex, i) => `
### Exemple ${i + 1} : ${ex.projet_type}
${ex.contenu}
`).join('\n')}

-> Tes questions doivent etre GENERIQUES et adaptables a n importe quel contexte.
---
`;
    }

    return `Tu es Ark Intelligence, expert en cadrage de projet.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Utilise un langage SIMPLE et ACCESSIBLE, sans jargon technique ou entrepreneurial
- Evite les termes complexes comme : "proposition de valeur", "MVP", "ROI", "KPI", "segmentation client", "business model"
- Parle comme si tu discutais avec quelqu un qui n a jamais fait d entrepreneuriat
- Utilise des mots du quotidien
- Si tu dois utiliser un terme technique, explique-le simplement entre parentheses
- TOUJOURS ecrire en francais avec les accents corrects

[CLASSIFICATION INTERNE - NE PAS AFFICHER] Analyse silencieusement le message :
1. QUESTION SUR L APPLICATION -> Reponds brievement, ne pose pas de question de cadrage
2. HORS SUJET -> Redirige brievement
3. MESSAGE VAGUE -> Demande une precision
4. PROJET DETECTE -> Passe directement a la MISSION sans aucune mention de classification
NE JAMAIS ecrire "ETAPE 0", "CLASSIFICATION", "PROJET DETECTE" ou tout texte de debug.

---

MISSION : Poser 12 questions de cadrage sous forme de QCM ADAPTE au projet du client.

${examplesSection}

FORMAT STRICT pour chaque question :

[Reformulation naturelle en 1 phrase de ce que le client vient de dire, SANS mentionner "le client a repondu", SANS citer la lettre choisie, SANS expliquer ton raisonnement]

**Phase [N] -- [Titre de la phase]**

**Question [N] : [Titre]**

[Question adaptee au projet EN LANGAGE SIMPLE]

A) [Option specifique]
B) [Option specifique]
C) [Option specifique]
D) [Option specifique]
E) Autre (precisez)

ARRETE ICI apres les options.

AUCUNE EXCEPTION : Toutes les 12 questions doivent avoir 5 options A-E.

REGLES :
1. Options SPECIFIQUES au type de projet du client
2. PAS de mention de lieu geographique, ville, pays, quartier ou devise
3. Une question a la fois
4. LANGAGE SIMPLE
5. Quand le client repond par une lettre (A, B, C, D ou E), retrouve le TEXTE COMPLET de l option correspondante dans ta question precedente et reformule avec ce texte. NE JAMAIS mentionner la lettre dans la reformulation.

---

LES 12 QUESTIONS (5 PHASES) :

**PHASE 1 -- Cadrage strategique** (Q1 a Q4)
1. Contexte - Qu est-ce qui declenche ce projet ?
2. Probleme - Quel probleme a resoudre ?
3. Beneficiaire - Qui en beneficie ?
4. Objectif (12 mois) - Qu est-ce qui aura change ?

**PHASE 2 -- Definition du probleme reel** (Q5 a Q6)
5. Besoin reel - Quelles informations sont necessaires pour avancer ?
6. Freins et differences - Si ca existe deja, en quoi serez-vous different ?

**Phase 3 -- Solution et Livrable** (Q7 a Q8)
7. Livrable - Qu est-ce que ce projet doit produire en priorite ?
8. Hors perimetre - Qu est-ce qui ne fait pas partie de ce projet pour l instant ?

**PHASE 4 -- Expression du besoin fonctionnel** (Q9)
9. Capacite prioritaire - Quelle fonctionnalite critique ?

**PHASE 5 -- Contraintes, risques et criteres de succes** (Q10 a Q12)
10. Contrainte principale - Quelle limite majeure ?
11. Risque - Qu est-ce qui vous inquiete ?
12. Critere de succes - Comment mesurer le succes ?

---

APRES LA QUESTION 12 :

ETAPE 1 :
1. Reformule la reponse Q12
2. Annonce "Cadrage termine !"
3. Propose 5 noms (A, B, C, D, E)
4. Demande "Quel nom souhaitez-vous donner a votre projet ?"

ETAPE 2 - APRES CHOIX DU NOM :
1. Identifie le nom exact choisi (si le client donne une lettre, retrouve le nom correspondant dans ta liste)
2. Ecris : **Nom du projet : [le nom exact, pas la lettre]**
3. Ecris : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- NE JAMAIS afficher de reflexions internes, de debug ou de texte comme "le client a repondu"
- Si le client choisit E (Autre), ACCEPTE et PASSE a la question suivante
- NE JAMAIS reposer une question deja posee
- PROGRESSION OBLIGATOIRE : chaque message du client = avancer d une question

PROJET DU CLIENT : "${projectDescription}"`;
}

function buildPromptOrientation(projectDescription) {
    return `Tu es Ark Intelligence, expert en orientation de solution.

Le client a deja valide sa Definition de Projet. Tu recois les donnees de cette definition dans le premier message.
Ta mission est de l aider a ORIENTER sa solution en posant 8 questions structurees.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Langage SIMPLE et ACCESSIBLE, sans jargon
- Parle comme a un ami qui n a jamais fait d entrepreneuriat
- Une question a la fois
- TOUJOURS ecrire en francais avec les accents corrects

**FORMAT STRICT POUR CHAQUE QUESTION :**

[Reformulation naturelle en 1 phrase]

**Phase [N] -- [Titre]**

**Question [N] : [Titre]**

[Question adaptee EN LANGAGE SIMPLE]

A) [Option specifique]
B) [Option specifique]
C) [Option specifique]
D) [Option specifique]
E) Autre (precisez)

ARRETE apres les options.

---

LES 8 QUESTIONS (3 PHASES) :

**PHASE 1 -- Comprendre** (Questions 1 a 3)
1. Validation du probleme
2. Utilisateur prioritaire
3. Solutions existantes

**PHASE 2 -- Explorer** (Questions 4 a 6)
4. Type de solution
5. Justification
6. Ressources disponibles

**PHASE 3 -- Orienter** (Questions 7 a 8)
7. Fonctionnalites prioritaires
8. Premier jalon

---

APRES LA QUESTION 8 :
1. Reformule la reponse Q8
2. Synthese en 3-4 lignes
3. Ecris : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- PAS de mention de lieu geographique, ville, pays ou devise
- Options SPECIFIQUES au projet du client
- Si E (Autre), ACCEPTE et AVANCE
- NE JAMAIS reposer une question
- PROGRESSION OBLIGATOIRE
- Quand le client repond par une lettre, retrouve le texte complet de l option et reformule avec ce texte

DONNEES DU CLIENT : "${projectDescription}"`;
}

function buildPromptFormulation(projectDescription) {
    return `Tu es Ark Intelligence, expert en formulation de solution.

Le client a deja valide sa Definition de Projet ET son Orientation de Solution.
Ta mission est de l aider a FORMULER sa solution en posant 6 questions structurees.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Langage SIMPLE et ACCESSIBLE, sans jargon
- Parle comme a un ami
- Une question a la fois
- TOUJOURS ecrire en francais avec les accents corrects

**FORMAT STRICT POUR CHAQUE QUESTION :**

[Reformulation naturelle en 1 phrase]

**Phase [N] -- [Titre]**

**Question [N] : [Titre]**

[Question adaptee EN LANGAGE SIMPLE]

A) [Option specifique]
B) [Option specifique]
C) [Option specifique]
D) [Option specifique]
E) Autre (precisez)

ARRETE apres les options.

---

LES 6 QUESTIONS (3 PHASES) :

**PHASE 1 -- Rappel et precision** (Questions 1 a 2)
1. Confirmation du probleme
2. Utilisateur cible precis

**PHASE 2 -- Formuler la solution** (Questions 3 a 4)
3. Formulation centrale
4. Parcours utilisateur

**PHASE 3 -- Valider la formulation** (Questions 5 a 6)
5. Ce que la solution ne fait pas
6. Le pitch

---

APRES LA QUESTION 6 :
1. Reformule la reponse Q6
2. Pitch final en 2 phrases
3. Ecris : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- PAS de mention de lieu geographique, ville, pays ou devise
- Options SPECIFIQUES au projet du client
- Si E (Autre), ACCEPTE et AVANCE
- NE JAMAIS reposer une question
- PROGRESSION OBLIGATOIRE
- Quand le client repond par une lettre, retrouve le texte complet de l option et reformule avec ce texte

DONNEES DU CLIENT : "${projectDescription}"`;
}

function buildPromptDesignThinking(projectDescription) {
    return `Tu es Ark Intelligence, expert en Design Thinking.

Le client a deja valide sa Definition de Projet. Tu recois les donnees de cette definition dans le premier message.
Ta mission est de l aider a construire un CANVAS DESIGN THINKING en posant 8 questions structurees.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Langage SIMPLE et ACCESSIBLE, sans jargon
- Parle comme a un ami qui n a jamais fait d entrepreneuriat
- Une question a la fois
- TOUJOURS ecrire en francais avec les accents corrects

**FORMAT STRICT POUR CHAQUE QUESTION :**

[Reformulation naturelle en 1 phrase]

**Phase [N] -- [Titre]**

**Question [N] : [Titre]**

[Question adaptee EN LANGAGE SIMPLE]

A) [Option specifique au projet du client]
B) [Option specifique au projet du client]
C) [Option specifique au projet du client]
D) [Option specifique au projet du client]
E) Autre (precisez)

ARRETE apres les options.

---

LES 8 QUESTIONS (5 PHASES) :

**PHASE 1 -- Empathie** (Questions 1 a 3)
1. Journee typique de l utilisateur et ses difficultes
2. Emotions et frustrations face au probleme
3. Solutions actuelles et leurs limites

**PHASE 2 -- Definition** (Question 4)
4. Impact concret si le probleme n est jamais resolu

**PHASE 3 -- Ideation** (Questions 5 a 6)
5. Idee principale pour resoudre le probleme
6. Alternatives envisagees et raisons de les ecarter

**PHASE 4 -- Prototypage** (Question 7)
7. Forme du test rapide (maquette, app basique, version papier, test reel...)

**PHASE 5 -- Test** (Question 8)
8. Methode de mesure, nombre de testeurs et criteres de reussite

---

APRES LA QUESTION 8 :
1. Reformule la reponse Q8
2. Synthese en 3-4 lignes
3. Ecris : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- PAS de mention de lieu geographique, ville, pays ou devise
- Options SPECIFIQUES au projet du client (pas generiques)
- Si E (Autre), ACCEPTE et AVANCE
- NE JAMAIS reposer une question
- PROGRESSION OBLIGATOIRE
- Ne repose PAS les infos deja dans la Definition de Projet, utilise-les comme contexte
- Quand le client repond par une lettre, retrouve le texte complet de l option et reformule avec ce texte

DONNEES DU CLIENT : "${projectDescription}"`;
}

function buildPromptBusinessModel(projectDescription) {
    return `Tu es Ark Intelligence, expert en Business Model Canvas.

Le client a deja valide sa Definition de Projet. Tu recois les donnees de cette definition dans le premier message.
Ta mission est de l aider a construire un BUSINESS MODEL CANVAS en posant 7 questions structurees.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Langage SIMPLE et ACCESSIBLE, sans jargon
- Parle comme a un ami qui n a jamais fait d entrepreneuriat
- Une question a la fois
- TOUJOURS ecrire en francais avec les accents corrects

**FORMAT STRICT POUR CHAQUE QUESTION :**

[Reformulation naturelle en 1 phrase]

**Question [N] : [Titre]**

[Question adaptee EN LANGAGE SIMPLE]

A) [Option specifique au projet du client]
B) [Option specifique au projet du client]
C) [Option specifique au projet du client]
D) [Option specifique au projet du client]
E) Autre (precisez)

ARRETE apres les options.

---

LES 7 QUESTIONS :

1. **Segments de clients** : Les differents profils qui pourraient payer pour la solution
2. **Proposition de valeur** : Ce qui rend la solution unique par rapport aux autres
3. **Canaux** : Comment faire connaitre et distribuer la solution aux clients
4. **Relation client** : Comment garder les clients satisfaits et fideles
5. **Sources de revenus** : Comment gagner de l argent concretement (abonnement, vente, commission, publicite...)
6. **Partenaires et ressources** : De qui et de quoi on a besoin pour fonctionner
7. **Couts** : Les postes de depenses principaux pour lancer et maintenir l activite

---

APRES LA QUESTION 7 :
1. Reformule la reponse Q7
2. Synthese en 3-4 lignes
3. Ecris : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- PAS de mention de lieu geographique, ville, pays ou devise
- Options SPECIFIQUES au projet du client (pas generiques)
- Si E (Autre), ACCEPTE et AVANCE
- NE JAMAIS reposer une question
- PROGRESSION OBLIGATOIRE
- Ne repose PAS les infos deja dans la Definition de Projet, utilise-les comme contexte
- Quand le client repond par une lettre, retrouve le texte complet de l option et reformule avec ce texte

DONNEES DU CLIENT : "${projectDescription}"`;
}

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history, docType = 'definition_projet') {
    
    // Pre-filtre salutations (uniquement pour definition_projet)
    if (!docType || docType === 'definition_projet') {
        const salutations = ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bonsoir', 'hi', 'yo', 'bjr', 'slt'];
        const messageClean = message.toLowerCase().trim();
        
        if ((!history || history.length === 0) && salutations.includes(messageClean)) {
            return res.status(200).json({ 
                action: 'continue',
                response: "Bonjour ! Je suis **Ark Intelligence**, votre assistant de cadrage de projet.\n\nDecrivez-moi votre idee de projet et je vous guiderai a travers 12 questions pour le structurer.\n\n**Exemple** : *\"Je veux ouvrir une boulangerie\"* ou *\"Je developpe une application mobile\"*"
            });
        }
    }

    // ========== FILET DE SECURITE : DETECTION DE PROGRESSION ==========
    const progress = detectProgress(history, docType);
    console.log(`[PROGRESS] docType=${docType}, questionNum=${progress.questionNum}/${progress.maxQuestions}, isComplete=${progress.isComplete}, nameProposed=${progress.nameProposed}`);

    if (progress.isComplete) {
        // Document SANS etape de nom -> forcer la generation
        if (!progress.hasNameStep) {
            console.log(`[SAFETY NET] ${progress.maxQuestions} questions posees pour ${docType} - FORCE GENERATE`);
            return res.status(200).json({ 
                action: 'generate',
                response: "Merci pour toutes vos reponses ! Votre document est en cours de generation..."
            });
        }
        
        // definition_projet : noms proposes ET client a repondu -> forcer la generation
        if (progress.hasNameStep && progress.nameProposed) {
            console.log(`[SAFETY NET] Nom choisi pour definition_projet - FORCE GENERATE`);

            // Résoudre la lettre en nom réel depuis l'historique
            let nomChoisi = message.trim();
            const letterMatch = nomChoisi.match(/^[A-Ea-e]$/);
            if (letterMatch) {
                const lastAIMsg = [...history].reverse().find(h => h.type === 'ai' || h.type === 'assistant');
                if (lastAIMsg) {
                    const letter = nomChoisi.toUpperCase();
                    const regex = new RegExp(letter + '\\)\\s*(.+)', 'i');
                    const match = lastAIMsg.content.match(regex);
                    if (match && match[1]) nomChoisi = match[1].trim();
                }
            }

            return res.status(200).json({ 
                action: 'generate',
                response: `**Nom du projet : ${nomChoisi}**\n\nGeneration de votre document en cours...`
            });
        }
    }

    // ========== CONSTRUCTION DU PROMPT ==========
    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const firstUserMessage = history && history.length > 0 
        ? history.find(h => h.type === 'user')?.content 
        : message;

    let systemPrompt = '';

    if (docType === 'orientation_solution') {
        systemPrompt = buildPromptOrientation(firstUserMessage);
    } else if (docType === 'formulation_solution') {
        systemPrompt = buildPromptFormulation(firstUserMessage);
    } else if (docType === 'design_thinking') {
        systemPrompt = buildPromptDesignThinking(firstUserMessage);
    } else if (docType === 'business_model') {
        systemPrompt = buildPromptBusinessModel(firstUserMessage);
    } else {
        let similarExamples = null;
        if (firstUserMessage) {
            similarExamples = await findSimilarExamples(firstUserMessage);
            if (similarExamples && similarExamples.length > 0) {
                console.log(`RAG: ${similarExamples.length} exemples trouves pour "${firstUserMessage.substring(0, 50)}..."`);
            }
        }
        systemPrompt = buildPromptDefinition(similarExamples, firstUserMessage);
    }

    const totalQuestions = progress.maxQuestions;
    const nextQuestion = progress.questionNum + 1;

    let progressInstruction = '';
    if (progress.questionNum === 0) {
        progressInstruction = 'C est le debut. Analyse le contexte et pose la Question 1.';
    } else if (nextQuestion <= totalQuestions) {
        progressInstruction = `Tu as deja pose ${progress.questionNum} question(s). Pose maintenant la Question ${nextQuestion}. NE REPOSE PAS les questions precedentes.`;
    } else if (progress.hasNameStep && !progress.nameProposed) {
        progressInstruction = `Les ${totalQuestions} questions sont terminees. Propose 5 noms de projet (A, B, C, D, E) et demande au client de choisir.`;
    } else if (progress.hasNameStep && progress.nameProposed) {
        progressInstruction = `Le client vient de choisir un nom. Si c est une lettre, retrouve le nom correspondant dans ta liste precedente. Confirme le nom exact et ecris [GENERATE] sur une nouvelle ligne.`;
    } else {
        progressInstruction = `Les ${totalQuestions} questions sont terminees. Fais une courte synthese et ecris [GENERATE] sur une nouvelle ligne.`;
    }

    const fullPrompt = `${systemPrompt}

---
HISTORIQUE DE LA CONVERSATION :
${historyText}

---
NOUVEAU MESSAGE DU CLIENT :
"${message}"

---
PROGRESSION SERVEUR (fiable, ne pas ignorer) :
- Derniere question detectee : ${progress.questionNum === 0 ? 'Aucune' : `Question ${progress.questionNum}`}
- Total de questions pour ce document : ${totalQuestions}
- Questions restantes : ${Math.max(0, totalQuestions - progress.questionNum)}

INSTRUCTION PRECISE : ${progressInstruction}

REGLES :
1. Pose EXACTEMENT la question indiquee ci-dessus
2. Ne repete JAMAIS une question deja posee
3. Options SPECIFIQUES au projet du client
4. AUCUNE mention de lieu geographique, ville, pays ou devise
5. EVITE LE JARGON : parle simplement
6. NE JAMAIS afficher de texte de debug ou reflexion interne
7. Si E (Autre) avec texte libre, ACCEPTE et AVANCE
8. Quand le client repond par une lettre (A, B, C, D ou E), retrouve le TEXTE COMPLET de l option dans la question precedente et reformule avec ce texte. NE JAMAIS mentionner la lettre.

REGLE ABSOLUE : Chaque reponse du client = passer a la question suivante.`;

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
        return res.status(200).json({ action: 'generate', response: cleanResponse });
    }
    
    return res.status(200).json({ action: 'continue', response: aiResponse });
}

// ==================== FILET DE SECURITE : VERIFICATION FORMAT DOCUMENT ====================
function ensureDocumentFormat(htmlContent, docType) {
    // Design Thinking canvas format
    if (docType === 'design_thinking') {
        if (htmlContent.includes('class="dt-wrapper"') && htmlContent.includes('class="dt-column-header"')) {
            return htmlContent;
        }
        console.log(`FORMAT INCORRECT detecte pour design_thinking - Reconstruction automatique...`);
        const template = DOCUMENT_PROMPTS[docType] || '';
        const cleanTemplate = template.split('---').pop().trim();
        return cleanTemplate;
    }
    
    // Business Model Canvas grid format
    if (docType === 'business_model') {
        if (htmlContent.includes('class="bmc-wrapper"') && htmlContent.includes('class="bmc-cell-header"')) {
            return htmlContent;
        }
        console.log(`FORMAT INCORRECT detecte pour business_model - Reconstruction automatique...`);
        const template = DOCUMENT_PROMPTS[docType] || '';
        const cleanTemplate = template.split('---').pop().trim();
        return cleanTemplate;
    }
    
    // Standard table format (definition, orientation, formulation, etc.)
    if (htmlContent.includes('class="doc-wrapper"') && htmlContent.includes('class="label-cell"')) {
        return htmlContent;
    }
    
    console.log(`FORMAT INCORRECT detecte pour ${docType} - Reconstruction automatique...`);
    
    const labels = DOCUMENT_LABELS[docType] || DOCUMENT_LABELS.definition_projet;
    const title = DOCUMENT_TITLES[docType] || 'Document';
    
    const extractedContents = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const allTds = [];
    let match;
    while ((match = tdRegex.exec(htmlContent)) !== null) {
        const text = match[1].replace(/<[^>]*>/g, '').trim();
        if (text) allTds.push(text);
    }
    
    if (allTds.length >= labels.length * 2) {
        for (let i = 0; i < allTds.length; i += 2) {
            extractedContents.push(allTds[i + 1] || 'A definir');
        }
    } else if (allTds.length >= labels.length) {
        allTds.forEach(td => {
            const isLabel = labels.some(l => {
                const labelNum = l.split('.')[0].trim();
                return td.startsWith(labelNum + '.') || td.startsWith(labelNum + ' ');
            });
            if (!isLabel && td.length > 5) extractedContents.push(td);
        });
    }
    
    if (extractedContents.length < labels.length) {
        const plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        for (let i = 0; i < labels.length; i++) {
            if (extractedContents[i]) continue;
            const currentNum = (i + 1).toString();
            const nextNum = (i + 2).toString();
            const patterns = [
                new RegExp(currentNum + '\\.[^:]*?:\\s*(.+?)(?=' + nextNum + '\\.|$)', 's'),
                new RegExp(currentNum + '\\.[^.]+\\.\\s*(.+?)(?=' + nextNum + '\\.|$)', 's')
            ];
            for (const pattern of patterns) {
                const m = plainText.match(pattern);
                if (m && m[1]) { extractedContents[i] = m[1].trim().substring(0, 500); break; }
            }
            if (!extractedContents[i]) extractedContents[i] = 'A definir';
        }
    }
    
    let rows = '';
    for (let i = 0; i < labels.length; i++) {
        rows += `  <tr><td class="label-cell">${labels[i]}</td><td class="content-cell">${extractedContents[i] || 'A definir'}</td></tr>\n`;
    }
    
    return `<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 100%; max-width: 210mm; margin: 0 auto; }
.doc-wrapper .doc-logo { display: block; margin: 0 auto 12px; height: 55px; }
.doc-wrapper .doc-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 6px; }
.doc-wrapper .doc-project-name { text-align: center; font-size: 16px; font-weight: bold; color: #b8860b; margin-bottom: 10px; }
.doc-wrapper .doc-info { text-align: center; font-size: 12px; line-height: 1.8; margin-bottom: 16px; }
.doc-wrapper table { width: 100%; border-collapse: collapse; }
.doc-wrapper td { border: 1px solid #ddd; padding: 8px 12px; vertical-align: top; font-size: 12px; line-height: 1.55; }
.doc-wrapper .label-cell { background: #2c3e50; color: #fff; font-weight: bold; width: 28%; font-size: 11.5px; }
.doc-wrapper .content-cell { background: #fff; width: 72%; }
.doc-footer { text-align: center; margin-top: 16px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #888; }
.doc-footer a { color: #4a7c59; text-decoration: none; }
</style>
<div class="doc-wrapper">
<img class="doc-logo" src="/assets/logo.png" alt="Ark Intelligence">
<div class="doc-title">${title}</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
${rows}</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`;
}

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history, docType = 'definition_projet', userId = null, projetNom = null) {
    const conversationText = history.map(h => 
        `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`
    ).join('\n\n');

    let docPrompt = DOCUMENT_PROMPTS[docType] || DOCUMENT_PROMPTS.definition_projet;
    docPrompt = docPrompt.replace(/\{\{BASE_URL\}\}/g, 'https://www.arkintelligence.africa/');

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
- PAS d emojis
- TOUJOURS ecrire en francais avec les accents corrects
- GARDE EXACTEMENT les placeholders {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} tels quels
- Renvoie le HTML directement, sans balises markdown
- Texte en paragraphe SANS puces ni numeros
- COPIE le template HTML tel quel et remplace UNIQUEMENT le texte entre crochets []`;

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
    const rawDocument = data.choices[0].message.content.trim();
    const document = ensureDocumentFormat(rawDocument, docType);
    
    if (userId) {
        try {
            const finalProjetNom = projetNom || 'Projet sans nom';
            await supabase.from('ark_documents').insert({
                user_id: userId,
                projet_nom: finalProjetNom,
                doc_type: docType,
                contenu: document
            });
            console.log(`Document sauvegarde: ${finalProjetNom} (${docType})`);
        } catch (error) {
            console.error('Erreur sauvegarde document:', error);
        }
    }
    
    return res.status(200).json({ success: true, document: document });
}

// ==================== PARTAGE DE DOCUMENTS ====================

function createSlug(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function createShareLink(res, documentId, userId, projetNom) {
    try {
        const { data: user, error: userError } = await supabase
            .from('ark_users').select('nom, prenom').eq('id', userId).single();
        if (userError || !user) return res.status(404).json({ error: 'Utilisateur non trouve' });

        const ownerName = createSlug(`${user.prenom || 'utilisateur'}-${user.nom || 'ark'}`);
        const projectSlug = createSlug(projetNom || 'mon-projet');
        
        return res.status(200).json({
            success: true,
            shareUrl: `/ark/${ownerName}/${projectSlug}`,
            ownerName, projectSlug
        });
    } catch (error) {
        console.error('Erreur createShareLink:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getSharedDocument(res, token) {
    try {
        const { data: link, error: linkError } = await supabase
            .from('ark_shared_links')
            .select(`id, document_id, is_active, ark_documents (id, projet_nom, doc_type, contenu, created_at, user_id, ark_users (nom, prenom))`)
            .eq('share_token', token).eq('is_active', true).single();

        if (linkError || !link) return res.status(404).json({ error: 'Lien invalide ou expire' });

        const document = link.ark_documents;
        const owner = document.ark_users;

        return res.status(200).json({
            success: true, sharedLinkId: link.id,
            document: {
                id: document.id, projet_nom: document.projet_nom,
                doc_type: document.doc_type, contenu: document.contenu,
                created_at: document.created_at,
                owner_name: owner ? `${owner.prenom} ${owner.nom}` : 'Utilisateur Ark'
            }
        });
    } catch (error) {
        console.error('Erreur getSharedDocument:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function trackView(res, sharedLinkId, viewerUserId, viewerIp) {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentView } = await supabase
            .from('ark_document_views').select('id')
            .eq('shared_link_id', sharedLinkId).eq('viewer_ip', viewerIp)
            .gte('viewed_at', oneDayAgo).limit(1);

        if (recentView && recentView.length > 0) {
            return res.status(200).json({ success: true, counted: false });
        }

        let viewerName = 'Inconnu';
        if (viewerUserId) {
            const { data: user, error: userError } = await supabase
                .from('ark_users').select('nom, prenom').eq('id', viewerUserId).single();
            if (user && !userError) viewerName = `${user.prenom} ${user.nom}`;
        }

        const { error: insertError } = await supabase
            .from('ark_document_views')
            .insert({ shared_link_id: sharedLinkId, viewer_user_id: viewerUserId, viewer_name: viewerName, viewer_ip: viewerIp });

        if (insertError) {
            console.error('Erreur enregistrement vue:', insertError);
            return res.status(500).json({ error: 'Erreur enregistrement' });
        }
        return res.status(200).json({ success: true, counted: true });
    } catch (error) {
        console.error('Erreur trackView:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getDocumentStats(res, documentId, userId) {
    try {
        const { data: doc, error: docError } = await supabase
            .from('ark_documents').select('id').eq('id', documentId).eq('user_id', userId).single();
        if (docError || !doc) return res.status(404).json({ error: 'Document non trouve' });

        const { data: views, error: viewsError } = await supabase
            .from('ark_document_views')
            .select(`id, viewer_name, viewed_at, ark_shared_links!inner (document_id)`)
            .eq('ark_shared_links.document_id', documentId)
            .order('viewed_at', { ascending: false });

        if (viewsError) {
            console.error('Erreur recuperation vues:', viewsError);
            return res.status(500).json({ error: 'Erreur recuperation stats' });
        }
        return res.status(200).json({ success: true, totalViews: views ? views.length : 0, views: views || [] });
    } catch (error) {
        console.error('Erreur getDocumentStats:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getUserDocuments(res, userId) {
    try {
        const { data: documents, error } = await supabase
            .from('ark_documents').select('*').eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Erreur recuperation documents:', error);
            return res.status(500).json({ error: 'Erreur recuperation' });
        }
        return res.status(200).json({ success: true, documents: documents || [] });
    } catch (error) {
        console.error('Erreur getUserDocuments:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function updateUserProfile(res, userId, profileData) {
    try {
        const { prenom, nom, telephone, email } = profileData;
        const { error } = await supabase
            .from('ark_users').update({ prenom, nom, telephone, email }).eq('id', userId);
        if (error) {
            console.error('Erreur mise a jour profil:', error);
            return res.status(500).json({ error: 'Erreur mise a jour' });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erreur updateUserProfile:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getUserProfile(res, userId) {
    try {
        const { data: user, error } = await supabase
            .from('ark_users').select('id, nom, prenom, telephone, email, type_user')
            .eq('id', userId).single();
        if (error || !user) return res.status(404).json({ error: 'Utilisateur non trouve' });
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Erreur getUserProfile:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function deleteDocument(res, documentId, userId) {
    try {
        const { error } = await supabase
            .from('ark_documents').delete().eq('id', documentId).eq('user_id', userId);
        if (error) return res.status(500).json({ error: 'Erreur lors de la suppression' });
        return res.status(200).json({ success: true, message: 'Document supprime avec succes' });
    } catch (error) {
        console.error('Erreur deleteDocument:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getSharedDocumentByOwnerProject(res, owner, project) {
    try {
        const normalizeString = (str) => {
            return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/['']/g, ' ').replace(/[--]/g, '-').replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, ' ').trim();
        };
        
        const ownerParts = owner.split('-');
        const prenom = ownerParts[0];
        const nom = ownerParts.slice(1).join('-');
        
        const { data: users, error: userError } = await supabase
            .from('ark_users').select('id, prenom, nom');
        if (userError || !users || users.length === 0) {
            return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        }

        const user = users.find(u => 
            normalizeString(u.prenom || '') === normalizeString(prenom) && 
            normalizeString(u.nom || '') === normalizeString(nom)
        );
        if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });

        const projectNorm = normalizeString(project.replace(/-/g, ' '));
        
        const { data: documents, error: docError } = await supabase
            .from('ark_documents').select('contenu, projet_nom, created_at')
            .eq('user_id', user.id).order('created_at', { ascending: false });

        if (docError || !documents || documents.length === 0) {
            return res.status(404).json({ success: false, error: 'Aucun document disponible' });
        }

        const document = documents.find(d => normalizeString(d.projet_nom || '') === projectNorm);
        if (!document) return res.status(404).json({ success: false, error: 'Document introuvable' });

        return res.status(200).json({ success: true, document: document.contenu, createdAt: document.created_at });
    } catch (error) {
        console.error('Erreur getSharedDocumentByOwnerProject:', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
}
