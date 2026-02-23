import { createClient } from '@supabase/supabase-js';
import * as DOCUMENT_PROMPTS from './prompts/index.js';
 
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
            return await handleChat(res, message, history);
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

        // Nettoyage des references geographiques
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

// ==================== PROMPT AVEC RAG ====================
function buildPromptWithRAG(similarExamples, projectDescription) {
    let examplesSection = '';
    
    if (similarExamples && similarExamples.length > 0) {
        examplesSection = `
---
EXEMPLES DE QUESTIONS ADAPTEES (references geographiques neutralisees)

IMPORTANT : Les exemples ci-dessous utilisent des placeholders comme :
   - [VILLE] = toute ville (pas de mention de ville specifique)
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

-> Tes questions doivent etre GENERIQUES et adaptables a n'importe quel contexte.
---
`;
    }

    return `Tu es Ark Intelligence, expert en cadrage de projet.

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Utilise un langage SIMPLE et ACCESSIBLE, sans jargon technique ou entrepreneurial
- Evite les termes complexes comme : "proposition de valeur", "MVP", "ROI", "KPI", "segmentation client", "business model"
- Parle comme si tu discutais avec quelqu'un qui n'a jamais fait d'entrepreneuriat
- Utilise des mots du quotidien : "clients" au lieu de "segments de clientele", "ce qui rend votre projet different" au lieu de "proposition de valeur unique"
- Si tu dois utiliser un terme technique, explique-le simplement entre parentheses

**EXEMPLES DE REFORMULATION :**
- "Quelle est votre proposition de valeur unique ?" -> "Qu'est-ce qui rend votre projet different des autres ?"
- "Definissez votre segmentation client" -> "Qui sont vos clients ? A qui s'adresse votre projet ?"
- "Quels sont vos KPIs ?" -> "Comment allez-vous mesurer le succes de votre projet ?"
- "Quel est votre business model ?" -> "Comment allez-vous gagner de l'argent avec ce projet ?"
- "Avez-vous valide votre Product-Market Fit ?" -> "Avez-vous verifie que des gens veulent vraiment votre produit ?"

**ETAPE 0 - CLASSIFICATION (OBLIGATOIRE au premier message) :**
Analyse le message du client AVANT de poser des questions :

1. QUESTION SUR L'APPLICATION ("c'est quoi", "comment ca marche", "a quoi ca sert", "qui a cree")
   -> Reponds brievement : Ark Intelligence aide a structurer les projets via 12 questions de cadrage.
   -> Puis demande : "Decrivez-moi votre projet pour commencer !"

2. HORS SUJET (meteo, blagues, politique, sujets non lies aux projets)
   -> Reponds : "Je suis specialise dans le cadrage de projets entrepreneuriaux. Decrivez-moi votre idee et je vous guiderai !"

3. MESSAGE VAGUE ("j'ai une idee", "je veux entreprendre", "aide-moi")
   -> Reponds : "Super ! Pouvez-vous me decrire votre projet plus precisement ? Par exemple : Je veux ouvrir une boulangerie, Je developpe une application mobile..."

4. PROJET DETECTE (description d'activite, business, idee entrepreneuriale claire)
   -> Passe directement a la MISSION ci-dessous

---

MISSION : Poser 12 questions de cadrage sous forme de QCM ADAPTE au projet du client.

${examplesSection}

REGLES IMPORTANTES - FORMAT OBLIGATOIRE POUR CHAQUE QUESTION :

FORMAT STRICT (valable pour Q1, Q2, Q3... jusqu'a Q12) :

**Je reformule** : [reformulation courte]

**Phase [N] -- [Titre de la phase]**

**Question [N] : [Titre]**

[Question adaptee au projet EN LANGAGE SIMPLE]

A) [Option specifique au projet mais GENERIQUE]
B) [Option specifique au projet mais GENERIQUE]
C) [Option specifique au projet mais GENERIQUE]
D) [Option specifique au projet mais GENERIQUE]
E) Autre (precisez)

ARRETE ICI - N'ajoute AUCUN texte apres les options (pas de "Quelle est votre reponse", pas de "Choisissez", rien).

AUCUNE EXCEPTION : Toutes les 12 questions doivent avoir ce format avec 5 options.
Si tu ne proposes pas A) B) C) D) E) -> C'EST UNE ERREUR GRAVE.

AUTRES REGLES :
1. Les options doivent etre SPECIFIQUES au type de projet du client
2. PAS de mention de lieu geographique, ville, pays, quartier ou devise
3. Genere des exemples UNIVERSELS applicables partout dans le monde
4. Une question a la fois
5. LANGAGE SIMPLE : evite le jargon, parle comme a un ami

---

LES 12 QUESTIONS A POSER (ORGANISEES EN 5 PHASES) :

**PHASE 1 -- Cadrage strategique** (Questions 1 a 4)
1. Contexte - Qu'est-ce qui declenche ce projet ?
2. Probleme - Quel probleme a resoudre ?
3. Beneficiaire - Qui en beneficie ?
4. Objectif (12 mois) - Qu'est-ce qui aura change ?

**PHASE 2 -- Definition du probleme reel** (Questions 5 a 6)
5. Besoin reel - Quelles informations necessaires ?
6. Limites actuelles - Pourquoi pas encore realise ?

**Phase 3 -- Solution et Livrable** (Questions 7 a 8)
7. Livrable - Qu'attendez-vous concretement ?
8. Hors perimetre - Que ne doit PAS faire le projet ?

**PHASE 4 -- Expression du besoin fonctionnel** (Question 9)
9. Capacite prioritaire - Quelle fonctionnalite critique ?

**PHASE 5 -- Contraintes, risques et criteres de succes** (Questions 10 a 12)
10. Contrainte principale - Quelle limite majeure ?
11. Risque - Qu'est-ce qui vous inquiete ?
12. Critere de succes - Comment mesurer le succes ?

IMPORTANT : Affiche la phase correspondante lors de chaque question.
Exemple : Pour Q1, Q2, Q3, Q4 -> affiche "**PHASE 1 -- Cadrage strategique**"

---

APRES LA QUESTION 12 (une fois que le client a choisi A/B/C/D ou E) :

ETAPE 1 - REFORMULER + PROPOSER NOMS :
1. Reformule la reponse Q12
2. Annonce "Cadrage termine !"
3. Propose 5 noms (A, B, C, D, E)
4. Demande "Quel nom souhaitez-vous donner a votre projet ?"

ETAPE 2 - APRES CHOIX DU NOM :

Tu poses la question des noms UNE SEULE FOIS. Ne la redemande JAMAIS.

Quand le client choisit :
1. Identifie le nom exact :
   - Si client repond "A", "B", "C" ou "D" -> Prends le nom que tu as propose pour cette lettre
   - Si client repond "E" ou ecrit un nom -> Prends exactement ce qu'il a ecrit
2. Ecris sur une ligne : **Nom du projet : [le nom exact]**
3. Ecris sur une nouvelle ligne : [GENERATE]
4. ARRETE - Ne pose AUCUNE autre question

Exemples :
- Tu as propose B) CyberHub, client dit "B" -> **Nom du projet : CyberHub**
- Client ecrit "Pizza Royale" -> **Nom du projet : Pizza Royale**

EXEMPLE COMPLET APRES Q12 :
**Je reformule** : Vous mesurez le succes par le nombre de clients quotidiens.

Cadrage termine ! Maintenant, donnons un nom a votre projet.

**Propositions de noms pour votre cybercafe :**

A) CyberHub
B) NetPoint
C) ConnectZone
D) Digital Access
E) Proposez votre propre nom

**Quel nom souhaitez-vous donner a votre projet ?**

[CLIENT REPOND : "B"]

**Nom du projet : NetPoint**

[GENERATE]

---

REGLES CRITIQUES - INTERDICTIONS ABSOLUES :
- NE JAMAIS afficher de texte comme "Analyse de l'historique"
- NE JAMAIS afficher de texte comme "je dois poser la question X"
- NE JAMAIS afficher de texte comme "Note : Le client a repondu..."
- NE JAMAIS afficher de texte comme "La prochaine etape est de..."
- Ces reflexions internes doivent rester INVISIBLES a l'utilisateur
- Seul le format officiel avec "**Je reformule**" et les questions est autorise

PROJET DU CLIENT : "${projectDescription}"`;
}

// ==================== HANDLE CHAT ====================
async function handleChat(res, message, history) {
    
    // Pre-filtre salutations (pas d'appel API)
    const salutations = ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bonsoir', 'hi', 'yo', 'bjr', 'slt'];
    const messageClean = message.toLowerCase().trim();
    
    if ((!history || history.length === 0) && salutations.includes(messageClean)) {
        return res.status(200).json({ 
            action: 'continue',
            response: "Bonjour ! Je suis **Ark Intelligence**, votre assistant de cadrage de projet.\n\nDecrivez-moi votre idee de projet et je vous guiderai a travers 12 questions pour le structurer.\n\n**Exemple** : *\"Je veux ouvrir une boulangerie\"* ou *\"Je developpe une application mobile\"*"
        });
    }

    const historyText = history && history.length > 0 
        ? history.map(h => `${h.type === 'user' ? 'CLIENT' : 'ARK INTELLIGENCE'}: ${h.content}`).join('\n\n')
        : 'Premier message du client';

    const firstUserMessage = history && history.length > 0 
        ? history.find(h => h.type === 'user')?.content 
        : message;

    // RAG : Rechercher des exemples similaires
    let similarExamples = null;
    if (firstUserMessage) {
        similarExamples = await findSimilarExamples(firstUserMessage);
        if (similarExamples && similarExamples.length > 0) {
            console.log(`RAG: ${similarExamples.length} exemples trouves pour "${firstUserMessage.substring(0, 50)}..."`);
        }
    }

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
1. Si c'est le premier message, applique l'ETAPE 0 (classification)
2. Si un projet a ete identifie, analyse l'historique pour identifier quelle question tu as deja posee
3. Pose la question SUIVANTE avec des options A) B) C) D) E) adaptees au projet EN LANGAGE SIMPLE
4. Ne repete JAMAIS une question deja posee
5. Les options doivent etre SPECIFIQUES au projet du client (pas generiques)
6. AUCUNE mention de lieu geographique, ville, pays ou devise
7. EVITE LE JARGON : parle simplement, comme a un ami
8. NE JAMAIS afficher de texte de debug ou de reflexion interne

Progression : Classification -> Q1 -> Q2 -> Q3 -> Q4 -> Q5 -> Q6 -> Q7 -> Q8 -> Q9 -> Q10 -> Q11 -> Q12 -> PROPOSITION DE NOMS -> [GENERATE]`;

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

// ==================== HANDLE GENERATE ====================
async function handleGenerate(res, history, docType = 'definition_projet', userId = null, projetNom = null) {
    const conversationText = history.map(h => 
        `${h.type === 'user' ? 'CLIENT' : 'CONSULTANT'}: ${h.content}`
    ).join('\n\n');

    let docPrompt = DOCUMENT_PROMPTS[docType] || DOCUMENT_PROMPTS.definition_projet;
    
    // Remplacer {{BASE_URL}}
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
- PAS d'emojis
- N'utilise JAMAIS de majuscules inappropriees
- Pour le HTML: garde EXACTEMENT la structure fournie
- IMPORTANT : GARDE EXACTEMENT les placeholders {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} tels quels
- NE REMPLACE PAS {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} par d'autres valeurs
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
        
        const { data: recentView, error: checkError } = await supabase
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
            .update({
                prenom: prenom,
                nom: nom,
                telephone: telephone,
                email: email
            })
            .eq('id', userId);

        if (error) {
            console.error('Erreur mise a jour profil:', error);
            return res.status(500).json({ error: 'Erreur mise a jour' });
        }

        console.log(`Profil mis a jour pour user ${userId}`);
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
            console.error('Erreur recuperation profil:', error);
            return res.status(404).json({ error: 'Utilisateur non trouve' });
        }

        return res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Erreur getUserProfile:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function deleteDocument(res, documentId, userId) {
    try {
        const { data, error } = await supabase
            .from('ark_documents')
            .delete()
            .eq('id', documentId)
            .eq('user_id', userId);

        if (error) {
            console.error('Erreur suppression document:', error);
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }

        return res.status(200).json({
            success: true,
            message: 'Document supprime avec succes'
        });

    } catch (error) {
        console.error('Erreur deleteDocument:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getSharedDocumentByOwnerProject(res, owner, project) {
    try {
        console.log('Recherche document:', { owner, project });
        
        const normalizeString = (str) => {
            return str
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/['']/g, ' ')
                .replace(/[--]/g, '-')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };
        
        const ownerParts = owner.split('-');
        const prenom = ownerParts[0];
        const nom = ownerParts.slice(1).join('-');
        
        console.log('Recherche utilisateur:', { prenom, nom });
        
        const { data: users, error: userError } = await supabase
            .from('ark_users')
            .select('id, prenom, nom');

        if (userError) {
            console.error('Erreur recherche utilisateur:', userError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erreur recherche utilisateur' 
            });
        }

        if (!users || users.length === 0) {
            console.error('Aucun utilisateur trouve');
            return res.status(404).json({ 
                success: false, 
                error: 'Utilisateur introuvable' 
            });
        }

        const prenomNorm = normalizeString(prenom);
        const nomNorm = normalizeString(nom);
        
        const user = users.find(u => 
            normalizeString(u.prenom || '') === prenomNorm && 
            normalizeString(u.nom || '') === nomNorm
        );

        if (!user) {
            console.error('Utilisateur non trouve apres normalisation');
            return res.status(404).json({ 
                success: false, 
                error: 'Utilisateur introuvable' 
            });
        }

        console.log('Utilisateur trouve:', user.id);

        const userId = user.id;
        
        const projectNorm = normalizeString(project.replace(/-/g, ' '));
        
        console.log('Recherche document pour userId:', userId);
        
        const { data: documents, error: docError } = await supabase
            .from('ark_documents')
            .select('contenu, projet_nom, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (docError) {
            console.error('Erreur recherche document:', docError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erreur recherche document' 
            });
        }

        if (!documents || documents.length === 0) {
            console.error('Aucun document trouve pour cet utilisateur');
            return res.status(404).json({ 
                success: false, 
                error: 'Aucun document disponible' 
            });
        }

        const document = documents.find(d => 
            normalizeString(d.projet_nom || '') === projectNorm
        );

        if (!document) {
            console.error('Document non trouve apres normalisation. Projets disponibles:', 
                documents.map(d => d.projet_nom));
            return res.status(404).json({ 
                success: false, 
                error: 'Document introuvable' 
            });
        }

        console.log('Document trouve');

        return res.status(200).json({
            success: true,
            document: document.contenu,
            createdAt: document.created_at
        });

    } catch (error) {
        console.error('Erreur getSharedDocumentByOwnerProject:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
}
