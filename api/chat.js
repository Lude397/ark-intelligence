import { createClient } from '@supabase/supabase-js';
 
// ==================== CONFIGURATION ====================
const supabase = createClient(
    'https://ehaxnltgapcfxhwpqhyb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYXhubHRnYXBjZnhod3BxaHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDg1NjksImV4cCI6MjA4MjkyNDU2OX0.-XLe5c2sgzGxv9Olc13Lu3S0hTHjSbs2brbvVC556Ec'
);

const MISTRAL_API_KEY = 'pnpx3zcKxb9xR2RK4kxyyOXNLDQ1paE4';

// ==================== HANDLER ====================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    if (req.method === 'GET') {
        const { token } = req.query;
        if (token) {
            return await getSharedDocument(res, token);
        }
        return res.status(400).json({ error: 'Token manquant' });
    }
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mode, message, history, docType, userId, projetNom, documentId, sharedLinkId, viewerUserId, viewerIp, owner, project } = req.body;

        if (mode === 'chat') {
            return await handleChat(res, message, history, docType);
        }
        
        if (mode === 'generate') {
            return await handleGenerate(res, history, docType, userId, projetNom);
        }

        if (mode === 'createShareLink') {
            return await createShareLink(res, documentId, userId, projetNom);
        }

        if (mode === 'trackView') {
            return await trackView(res, sharedLinkId, viewerUserId, viewerIp);
        }

        if (mode === 'getStats') {
            return await getDocumentStats(res, documentId, userId);
        }

        if (mode === 'getUserDocuments') {
            return await getUserDocuments(res, userId);
        }

        if (mode === 'updateUserProfile') {
            return await updateUserProfile(res, userId, req.body);
        }

        if (mode === 'getUserProfile') {
            return await getUserProfile(res, userId);
        }

        if (mode === 'deleteDocument') {
            return await deleteDocument(res, documentId, userId);
        }

        if (mode === 'getSharedDocument') {
            return await getSharedDocumentByOwnerProject(res, owner, project);
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

// ==================== PROMPT DEFINITION DE PROJET (12 QUESTIONS) ====================
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

**ETAPE 0 - CLASSIFICATION (OBLIGATOIRE au premier message) :**
Analyse le message du client AVANT de poser des questions :

1. QUESTION SUR L APPLICATION -> Reponds brievement puis demande de decrire le projet
2. HORS SUJET -> Redirige vers le cadrage de projet
3. MESSAGE VAGUE -> Demande plus de precision
4. PROJET DETECTE -> Passe a la MISSION

---

MISSION : Poser 12 questions de cadrage sous forme de QCM ADAPTE au projet du client.

${examplesSection}

FORMAT STRICT pour chaque question :

**Je reformule** : [reformulation courte]

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

---

LES 12 QUESTIONS (5 PHASES) :

**PHASE 1 -- Cadrage strategique** (Q1 a Q4)
1. Contexte - Qu est-ce qui declenche ce projet ?
2. Probleme - Quel probleme a resoudre ?
3. Beneficiaire - Qui en beneficie ?
4. Objectif (12 mois) - Qu est-ce qui aura change ?

**PHASE 2 -- Definition du probleme reel** (Q5 a Q6)
5. Besoin reel - Quelles informations necessaires ?
6. Limites actuelles - Pourquoi pas encore realise ?

**Phase 3 -- Solution et Livrable** (Q7 a Q8)
7. Livrable - Qu attendez-vous concretement ?
8. Hors perimetre - Que ne doit PAS faire le projet ?

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
1. Identifie le nom exact choisi
2. Ecris : **Nom du projet : [le nom exact]**
3. Ecris : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- NE JAMAIS afficher de reflexions internes
- Seul le format officiel est autorise

PROJET DU CLIENT : "${projectDescription}"`;
}

// ==================== PROMPT ORIENTATION DE SOLUTION (8 QUESTIONS) ====================
function buildPromptOrientation(projectDescription) {
    return `Tu es Ark Intelligence, expert en orientation de solution.

Le client a deja valide sa Definition de Projet. Tu recois les donnees de cette definition dans le premier message.
Ta mission est de l aider a ORIENTER sa solution en posant 8 questions structurees.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Langage SIMPLE et ACCESSIBLE, sans jargon
- Parle comme a un ami qui n a jamais fait d entrepreneuriat
- Une question a la fois

**FORMAT STRICT POUR CHAQUE QUESTION :**

**Je reformule** : [reformulation courte de sa reponse precedente]

**Phase [N] -- [Titre]**

**Question [N] : [Titre]**

[Question adaptee au projet EN LANGAGE SIMPLE]

A) [Option specifique]
B) [Option specifique]
C) [Option specifique]
D) [Option specifique]
E) Autre (precisez)

ARRETE apres les options. Pas de texte supplementaire.

---

LES 8 QUESTIONS (3 PHASES) :

**PHASE 1 -- Comprendre** (Questions 1 a 3)
1. Validation du probleme - Le probleme identifie dans la definition est-il toujours le bon ? Quel aspect est le plus critique ?
2. Utilisateur prioritaire - Parmi les beneficiaires identifies, qui doit etre servi EN PREMIER ?
3. Solutions existantes - Comment les gens resolvent ce probleme aujourd hui ? Quelles alternatives existent ?

**PHASE 2 -- Explorer** (Questions 4 a 6)
4. Type de solution - Quelle forme devrait prendre votre solution ? (app, service, produit physique, plateforme...)
5. Justification - Pourquoi cette approche plutot qu une autre ?
6. Ressources disponibles - De quoi disposez-vous deja pour demarrer ? (competences, budget, reseau, materiel)

**PHASE 3 -- Orienter** (Questions 7 a 8)
7. Fonctionnalites prioritaires - Quelles sont les 2-3 fonctionnalites essentielles pour un premier lancement ?
8. Premier jalon - Quel est le premier resultat concret que vous voulez atteindre dans les 3 prochains mois ?

---

APRES LA QUESTION 8 (reponse recue) :

1. Reformule la reponse Q8
2. Fais une synthese en 3-4 lignes : "Voici l orientation retenue : [resume]"
3. Ecris sur une nouvelle ligne : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- NE JAMAIS afficher de reflexions internes
- PAS de mention de lieu geographique, ville, pays ou devise
- Options SPECIFIQUES au projet du client
- Le nom du projet est deja connu, pas besoin de le redemander

DONNEES DU CLIENT : "${projectDescription}"`;
}

// ==================== PROMPT FORMULATION DE SOLUTION (6 QUESTIONS) ====================
function buildPromptFormulation(projectDescription) {
    return `Tu es Ark Intelligence, expert en formulation de solution.

Le client a deja valide sa Definition de Projet ET son Orientation de Solution. Tu recois les donnees de l orientation dans le premier message.
Ta mission est de l aider a FORMULER sa solution de maniere precise en posant 6 questions structurees.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Langage SIMPLE et ACCESSIBLE, sans jargon
- Parle comme a un ami
- Une question a la fois

**FORMAT STRICT POUR CHAQUE QUESTION :**

**Je reformule** : [reformulation courte de sa reponse precedente]

**Phase [N] -- [Titre]**

**Question [N] : [Titre]**

[Question adaptee au projet EN LANGAGE SIMPLE]

A) [Option specifique]
B) [Option specifique]
C) [Option specifique]
D) [Option specifique]
E) Autre (precisez)

ARRETE apres les options. Pas de texte supplementaire.

---

LES 6 QUESTIONS (3 PHASES) :

**PHASE 1 -- Rappel et precision** (Questions 1 a 2)
1. Confirmation du probleme - En une phrase, quel est LE probleme principal que votre solution va resoudre ?
2. Utilisateur cible precis - Decrivez votre utilisateur ideal : qui est-il, que fait-il au quotidien, qu est-ce qui le frustre ?

**PHASE 2 -- Formuler la solution** (Questions 3 a 4)
3. Formulation centrale - Comment decririez-vous votre solution en une seule phrase simple ? (ce que ca fait, pour qui, comment)
4. Parcours utilisateur - Concretement, quelles sont les etapes que l utilisateur suit du debut a la fin quand il utilise votre solution ?

**PHASE 3 -- Valider la formulation** (Questions 5 a 6)
5. Ce que la solution ne fait PAS - Qu est-ce qui est clairement HORS de votre solution ? (pour eviter les malentendus)
6. Le pitch - Si vous deviez convaincre quelqu un en 30 secondes, que diriez-vous ?

---

APRES LA QUESTION 6 (reponse recue) :

1. Reformule la reponse Q6
2. Presente le pitch final en 2 phrases
3. Ecris sur une nouvelle ligne : [GENERATE]
4. ARRETE

REGLES CRITIQUES :
- NE JAMAIS afficher de reflexions internes
- PAS de mention de lieu geographique, ville, pays ou devise
- Options SPECIFIQUES au projet du client
- Le nom du projet est deja connu, pas besoin de le redemander

DONNEES DU CLIENT : "${projectDescription}"`;
}

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history, docType = 'definition_projet') {
    
    // Salutations uniquement pour definition (premier contact)
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

    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const firstUserMessage = history && history.length > 0 
        ? history.find(h => h.type === 'user')?.content 
        : message;

    // Construire le prompt selon le docType
    let systemPrompt = '';

    if (docType === 'orientation_solution') {
        systemPrompt = buildPromptOrientation(firstUserMessage);
    } else if (docType === 'formulation_solution') {
        systemPrompt = buildPromptFormulation(firstUserMessage);
    } else {
        // Definition de projet (par defaut) - avec RAG
        let similarExamples = null;
        if (firstUserMessage) {
            similarExamples = await findSimilarExamples(firstUserMessage);
            if (similarExamples && similarExamples.length > 0) {
                console.log(`RAG: ${similarExamples.length} exemples trouves pour "${firstUserMessage.substring(0, 50)}..."`);
            }
        }
        systemPrompt = buildPromptDefinition(similarExamples, firstUserMessage);
    }

    // Nombre de questions selon le type
    const questionCounts = {
        definition_projet: 12,
        orientation_solution: 8,
        formulation_solution: 6
    };
    const totalQuestions = questionCounts[docType] || 12;

    const fullPrompt = `${systemPrompt}

---
HISTORIQUE DE LA CONVERSATION :
${historyText}

---
NOUVEAU MESSAGE DU CLIENT :
"${message}"

---
INSTRUCTION : 
1. Si c est le premier message, analyse le contexte fourni et pose la Question 1
2. Sinon, analyse l historique pour identifier quelle question tu as deja posee
3. Pose la question SUIVANTE avec des options A) B) C) D) E) adaptees au projet EN LANGAGE SIMPLE
4. Ne repete JAMAIS une question deja posee
5. Les options doivent etre SPECIFIQUES au projet du client (pas generiques)
6. AUCUNE mention de lieu geographique, ville, pays ou devise
7. EVITE LE JARGON : parle simplement, comme a un ami
8. NE JAMAIS afficher de texte de debug ou de reflexion interne
9. Total de questions pour ce document : ${totalQuestions}

Progression : Q1 -> Q2 -> ... -> Q${totalQuestions} -> [GENERATE]`;

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

definition_projet: `Genere une DEFINITION DE PROJET sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Utilise UNIQUEMENT les reponses des 12 questions collectees
- Format: Tableau HTML 2 colonnes (label a gauche, contenu a droite)
- Texte en paragraphe SANS puces ni numeros a l interieur
- Pas de mention de source (Q1, Q2...)
- Style professionnel, phrases completes
- Contenu COURT : 2-3 lignes max par section
- Le document doit tenir sur UNE SEULE PAGE A4
- IMPORTANT pour le Contexte : COMMENCE par une phrase qui definit clairement le projet

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Definition de Projet</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Contexte</td><td class="content-cell">[COMMENCE par definir le projet puis explique pourquoi il est lance. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Probleme a resoudre</td><td class="content-cell">[Decris le probleme concret. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Beneficiaire principal</td><td class="content-cell">[Identifie les premiers clients. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Objectif a 12 mois</td><td class="content-cell">[Objectifs concrets. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Besoin reel</td><td class="content-cell">[Ressources indispensables. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Limites actuelles</td><td class="content-cell">[Freins ou obstacles. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Livrable attendu</td><td class="content-cell">[Resultat concret attendu. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Hors perimetre</td><td class="content-cell">[Ce qui ne fait PAS partie du projet. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">9. Exigences fonctionnelles</td><td class="content-cell">[Fonctionnalite prioritaire. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">10. Contraintes</td><td class="content-cell">[Contraintes principales. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">11. Risques</td><td class="content-cell">[Risques majeurs. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">12. Criteres de succes</td><td class="content-cell">[Comment mesurer le succes. 2-3 lignes max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`,

orientation_solution: `Genere un document ORIENTATION DE SOLUTION sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Ce document s appuie sur la Definition de Projet validee
- Format: Tableau HTML 2 colonnes (label a gauche, contenu a droite)
- Texte en paragraphe SANS puces ni numeros a l interieur
- Contenu COURT : 2-3 lignes max par section
- Le document doit tenir sur UNE SEULE PAGE A4

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Orientation de Solution</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Probleme valide</td><td class="content-cell">[Reformulation du probleme. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Utilisateur prioritaire</td><td class="content-cell">[Beneficiaire principal. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Solution retenue</td><td class="content-cell">[Description de la solution. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Justification</td><td class="content-cell">[Pourquoi cette solution. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Analyse des contraintes</td><td class="content-cell">[Contraintes et gestion. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Ressources necessaires</td><td class="content-cell">[Ressources humaines, techniques, financieres. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Fonctionnalites prioritaires</td><td class="content-cell">[Fonctionnalites essentielles. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Plan de demarrage</td><td class="content-cell">[Premieres actions concretes. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">9. Jalons de validation</td><td class="content-cell">[Indicateurs a 3 mois. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">10. Criteres de pivot</td><td class="content-cell">[Conditions pour changer d approche. 2-3 lignes max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`,

formulation_solution: `Genere un document FORMULATION DE SOLUTION sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Ce document s appuie sur l Orientation de Solution validee
- Format: Tableau HTML 2 colonnes (label a gauche, contenu a droite)
- Texte en paragraphe SANS puces ni numeros a l interieur
- Contenu COURT : 2-3 lignes max par section
- Le document doit tenir sur UNE SEULE PAGE A4

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Formulation de Solution</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Rappel du probleme cible</td><td class="content-cell">[Reformulation synthetique. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Utilisateur cible</td><td class="content-cell">[Description precise avec comportements. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Formulation centrale</td><td class="content-cell">[En une phrase : que fait le projet, pour qui, comment. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Fonctionnement de la solution</td><td class="content-cell">[Etapes du parcours utilisateur. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Frontieres de la solution</td><td class="content-cell">[Ce que la solution ne fait PAS. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Resultat attendu</td><td class="content-cell">[Impact concret. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Critere de bonne formulation</td><td class="content-cell">[Comment verifier que c est bien compris. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Pitch</td><td class="content-cell">[Resume en 2 phrases pour convaincre.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`,

design_thinking: `Genere un document DESIGN THINKING sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Format: Tableau HTML 2 colonnes
- Texte en paragraphe SANS puces ni numeros
- Contenu COURT : 2-3 lignes max par section

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Design Thinking</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Utilisateur cible</td><td class="content-cell">[Description. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Problemes et frustrations</td><td class="content-cell">[Frustrations principales. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Comportements et habitudes</td><td class="content-cell">[Gestion actuelle. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Probleme central</td><td class="content-cell">[Synthese. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Impact si non resolu</td><td class="content-cell">[Consequences. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Idee principale</td><td class="content-cell">[Solution proposee. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Alternatives</td><td class="content-cell">[Autres pistes. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Forme du prototype</td><td class="content-cell">[Type de prototype. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">9. Objectif du prototype</td><td class="content-cell">[Ce qu il verifie. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">10. Utilisateurs testeurs</td><td class="content-cell">[Profil testeurs. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">11. Methode de test</td><td class="content-cell">[Comment tester. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">12. Criteres de validation</td><td class="content-cell">[Indicateurs de reussite. 2-3 lignes max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`,

business_model: `Genere un BUSINESS MODEL CANVAS sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Format: Tableau HTML 2 colonnes
- Texte en paragraphe SANS puces ni numeros
- Contenu COURT : 2-3 lignes max par section

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Business Model Canvas</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Segments de clients</td><td class="content-cell">[Clients cibles. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Proposition de valeur</td><td class="content-cell">[Ce qui rend different. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Canaux</td><td class="content-cell">[Comment atteindre les clients. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Relation client</td><td class="content-cell">[Maintien de la relation. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Sources de revenus</td><td class="content-cell">[Comment gagner de l argent. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Ressources cles</td><td class="content-cell">[Ressources indispensables. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Activites cles</td><td class="content-cell">[Actions essentielles. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Partenaires cles</td><td class="content-cell">[Partenaires strategiques. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">9. Structure de couts</td><td class="content-cell">[Postes de depenses. 2-3 lignes max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`,

lean_startup: `Genere un document LEAN STARTUP sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Format: Tableau HTML 2 colonnes
- Texte en paragraphe SANS puces ni numeros
- Contenu COURT : 2-3 lignes max par section

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Lean Startup</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Probleme a tester</td><td class="content-cell">[Hypothese de probleme. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Utilisateur concerne</td><td class="content-cell">[Profil utilisateur. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Solutions existantes</td><td class="content-cell">[Comment le probleme est gere. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Hypothese de valeur</td><td class="content-cell">[Pourquoi adopter. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Hypothese de croissance</td><td class="content-cell">[Comment attirer. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Hypothese de monetisation</td><td class="content-cell">[Comment generer revenus. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Description du MVP</td><td class="content-cell">[Version minimale. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Objectif du MVP</td><td class="content-cell">[Ce qu il valide. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">9. Indicateur cle</td><td class="content-cell">[Metrique principale. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">10. Seuil de succes</td><td class="content-cell">[Valeur minimale. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">11. Enseignements attendus</td><td class="content-cell">[Ce qu on espere apprendre. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">12. Decision strategique</td><td class="content-cell">[Perseverer, pivoter ou abandonner. 2-3 lignes max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`,

agile: `Genere un document AGILE sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Format: Tableau HTML 2 colonnes
- Texte en paragraphe SANS puces ni numeros
- Contenu COURT : 2-3 lignes max par section

---

<style>
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 210mm; max-width: 210mm; margin: 0 auto; }
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
<div class="doc-title">Agile</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Objectif du projet</td><td class="content-cell">[Vision et objectif. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">2. Valeur prioritaire</td><td class="content-cell">[Valeur pour utilisateurs. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">3. Backlog des fonctionnalites</td><td class="content-cell">[Fonctionnalites par priorite. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">4. Sprint en cours</td><td class="content-cell">[Objectif du sprint. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">5. Taches du sprint</td><td class="content-cell">[Actions concretes. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">6. Obstacles et bloquants</td><td class="content-cell">[Problemes identifies. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">7. Livrables produits</td><td class="content-cell">[Ce qui a ete livre. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">8. Retours utilisateurs</td><td class="content-cell">[Feedback. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">9. Enseignements du sprint</td><td class="content-cell">[Ce qui a fonctionne ou pas. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">10. Actions d amelioration</td><td class="content-cell">[Mesures concretes. 2-3 lignes max.]</td></tr>
  <tr><td class="label-cell">11. Decision pour le sprint suivant</td><td class="content-cell">[Priorites prochaines. 2-3 lignes max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`
};

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
- Pas de blabla, que du concret
- PAS d emojis
- N utilise JAMAIS de majuscules inappropriees
- Pour le HTML: garde EXACTEMENT la structure fournie
- IMPORTANT : GARDE EXACTEMENT les placeholders {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} tels quels
- NE REMPLACE PAS {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} par d autres valeurs
- Renvoie le HTML directement, sans balises markdown
- Texte en paragraphe SANS puces ni numeros`;

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
    
    return res.status(200).json({ 
        success: true,
        document: document
    });
}

// ==================== PARTAGE DE DOCUMENTS ====================

function createSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function createShareLink(res, documentId, userId, projetNom) {
    try {
        const { data: user, error: userError } = await supabase
            .from('ark_users')
            .select('nom, prenom')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'Utilisateur non trouve' });
        }

        const prenom = user.prenom || 'utilisateur';
        const nom = user.nom || 'ark';
        const projet = projetNom || 'mon-projet';

        const ownerName = createSlug(`${prenom}-${nom}`);
        const projectSlug = createSlug(projet);
        
        return res.status(200).json({
            success: true,
            shareUrl: `/ark/${ownerName}/${projectSlug}`,
            ownerName: ownerName,
            projectSlug: projectSlug
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
            .select(`
                id,
                document_id,
                is_active,
                ark_documents (
                    id,
                    projet_nom,
                    doc_type,
                    contenu,
                    created_at,
                    user_id,
                    ark_users (
                        nom,
                        prenom
                    )
                )
            `)
            .eq('share_token', token)
            .eq('is_active', true)
            .single();

        if (linkError || !link) {
            return res.status(404).json({ error: 'Lien invalide ou expire' });
        }

        const document = link.ark_documents;
        const owner = document.ark_users;

        return res.status(200).json({
            success: true,
            sharedLinkId: link.id,
            document: {
                id: document.id,
                projet_nom: document.projet_nom,
                doc_type: document.doc_type,
                contenu: document.contenu,
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
            .from('ark_document_views')
            .select('id')
            .eq('shared_link_id', sharedLinkId)
            .eq('viewer_ip', viewerIp)
            .gte('viewed_at', oneDayAgo)
            .limit(1);

        if (recentView && recentView.length > 0) {
            return res.status(200).json({ success: true, counted: false });
        }

        let viewerName = 'Inconnu';

        if (viewerUserId) {
            const { data: user, error: userError } = await supabase
                .from('ark_users')
                .select('nom, prenom')
                .eq('id', viewerUserId)
                .single();

            if (user && !userError) {
                viewerName = `${user.prenom} ${user.nom}`;
            }
        }

        const { error: insertError } = await supabase
            .from('ark_document_views')
            .insert({
                shared_link_id: sharedLinkId,
                viewer_user_id: viewerUserId,
                viewer_name: viewerName,
                viewer_ip: viewerIp
            });

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
            .from('ark_documents')
            .select('id')
            .eq('id', documentId)
            .eq('user_id', userId)
            .single();

        if (docError || !doc) {
            return res.status(404).json({ error: 'Document non trouve' });
        }

        const { data: views, error: viewsError } = await supabase
            .from('ark_document_views')
            .select(`
                id,
                viewer_name,
                viewed_at,
                ark_shared_links!inner (
                    document_id
                )
            `)
            .eq('ark_shared_links.document_id', documentId)
            .order('viewed_at', { ascending: false });

        if (viewsError) {
            console.error('Erreur recuperation vues:', viewsError);
            return res.status(500).json({ error: 'Erreur recuperation stats' });
        }

        return res.status(200).json({
            success: true,
            totalViews: views ? views.length : 0,
            views: views || []
        });

    } catch (error) {
        console.error('Erreur getDocumentStats:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getUserDocuments(res, userId) {
    try {
        const { data: documents, error } = await supabase
            .from('ark_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false});

        if (error) {
            console.error('Erreur recuperation documents:', error);
            return res.status(500).json({ error: 'Erreur recuperation' });
        }

        return res.status(200).json({
            success: true,
            documents: documents || []
        });

    } catch (error) {
        console.error('Erreur getUserDocuments:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function updateUserProfile(res, userId, profileData) {
    try {
        const { prenom, nom, telephone, email } = profileData;
        
        const { error } = await supabase
            .from('ark_users')
            .update({ prenom, nom, telephone, email })
            .eq('id', userId);

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
            .from('ark_users')
            .select('id, nom, prenom, telephone, email, type_user')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Utilisateur non trouve' });
        }

        return res.status(200).json({ success: true, user });

    } catch (error) {
        console.error('Erreur getUserProfile:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function deleteDocument(res, documentId, userId) {
    try {
        const { error } = await supabase
            .from('ark_documents')
            .delete()
            .eq('id', documentId)
            .eq('user_id', userId);

        if (error) {
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }

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
            .from('ark_users')
            .select('id, prenom, nom');

        if (userError || !users || users.length === 0) {
            return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        }

        const prenomNorm = normalizeString(prenom);
        const nomNorm = normalizeString(nom);
        
        const user = users.find(u => 
            normalizeString(u.prenom || '') === prenomNorm && 
            normalizeString(u.nom || '') === nomNorm
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        }

        const userId = user.id;
        const projectNorm = normalizeString(project.replace(/-/g, ' '));
        
        const { data: documents, error: docError } = await supabase
            .from('ark_documents')
            .select('contenu, projet_nom, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (docError || !documents || documents.length === 0) {
            return res.status(404).json({ success: false, error: 'Aucun document disponible' });
        }

        const document = documents.find(d => 
            normalizeString(d.projet_nom || '') === projectNorm
        );

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document introuvable' });
        }

        return res.status(200).json({
            success: true,
            document: document.contenu,
            createdAt: document.created_at
        });

    } catch (error) {
        console.error('Erreur getSharedDocumentByOwnerProject:', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
}
