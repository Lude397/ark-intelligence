import { createClient } from '@supabase/supabase-js';
import * as DOCUMENT_PROMPTS from './prompts/index.js';
 
// ==================== CONFIGURATION ====================
const supabase = createClient(
    'https://ehaxnltgapcfxhwpqhyb.supabase.co',
    'data:image/webp;base64,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'
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
