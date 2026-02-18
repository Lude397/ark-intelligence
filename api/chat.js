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
    
    // GET pour récupérer un document partagé
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

**STYLE DE COMMUNICATION (OBLIGATOIRE) :**
- Utilise un langage SIMPLE et ACCESSIBLE, sans jargon technique ou entrepreneurial
- Évite les termes complexes comme : "proposition de valeur", "MVP", "ROI", "KPI", "segmentation client", "business model"
- Parle comme si tu discutais avec quelqu'un qui n'a jamais fait d'entrepreneuriat
- Utilise des mots du quotidien : "clients" au lieu de "segments de clientèle", "ce qui rend votre projet différent" au lieu de "proposition de valeur unique"
- Si tu dois utiliser un terme technique, explique-le simplement entre parenthèses

**EXEMPLES DE REFORMULATION :**
❌ "Quelle est votre proposition de valeur unique ?"
✅ "Qu'est-ce qui rend votre projet différent des autres ?"

❌ "Définissez votre segmentation client"
✅ "Qui sont vos clients ? À qui s'adresse votre projet ?"

❌ "Quels sont vos KPIs ?"
✅ "Comment allez-vous mesurer le succès de votre projet ?"

❌ "Quel est votre business model ?"
✅ "Comment allez-vous gagner de l'argent avec ce projet ?"

❌ "Avez-vous validé votre Product-Market Fit ?"
✅ "Avez-vous vérifié que des gens veulent vraiment votre produit ?"

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

RÈGLES IMPORTANTES - FORMAT OBLIGATOIRE POUR CHAQUE QUESTION :

⚠️ FORMAT STRICT (valable pour Q1, Q2, Q3... jusqu'à Q12) :

**Je reformule** : [reformulation courte]

**Phase [N] — [Titre de la phase]**

**Question [N] : [Titre]**

[Question adaptée au projet EN LANGAGE SIMPLE]

A) [Option spécifique au projet mais GÉNÉRIQUE]
B) [Option spécifique au projet mais GÉNÉRIQUE]
C) [Option spécifique au projet mais GÉNÉRIQUE]
D) [Option spécifique au projet mais GÉNÉRIQUE]
E) Autre (précisez)

⚠️ ARRÊTE ICI - N'ajoute AUCUN texte après les options (pas de "Quelle est votre réponse", pas de "Choisissez", rien).

⚠️ AUCUNE EXCEPTION : Toutes les 12 questions doivent avoir ce format avec 5 options.
⚠️ Si tu ne proposes pas A) B) C) D) E) → C'EST UNE ERREUR GRAVE.

AUTRES RÈGLES :
1. Les options doivent être SPÉCIFIQUES au type de projet du client
2. PAS de mention de lieu géographique, ville, pays, quartier ou devise
3. Génère des exemples UNIVERSELS applicables partout dans le monde
4. Une question à la fois
5. LANGAGE SIMPLE : évite le jargon, parle comme à un ami

---

LES 12 QUESTIONS À POSER (ORGANISÉES EN 5 PHASES) :

**PHASE 1 — Cadrage stratégique** (Questions 1 à 4)
1. Contexte - Qu'est-ce qui déclenche ce projet ?
2. Problème - Quel problème à résoudre ?
3. Bénéficiaire - Qui en bénéficie ?
4. Objectif (12 mois) - Qu'est-ce qui aura changé ?

**PHASE 2 — Définition du problème réel** (Questions 5 à 6)
5. Besoin réel - Quelles informations nécessaires ?
6. Limites actuelles - Pourquoi pas encore réalisé ?

**Phase 3 — Solution et Livrable** (Questions 7 à 8)
7. Livrable - Qu'attendez-vous concrètement ?
8. Hors périmètre - Que ne doit PAS faire le projet ?

**PHASE 4 — Expression du besoin fonctionnel** (Question 9)
9. Capacité prioritaire - Quelle fonctionnalité critique ?

**PHASE 5 — Contraintes, risques et critères de succès** (Questions 10 à 12)
10. Contrainte principale - Quelle limite majeure ?
11. Risque - Qu'est-ce qui vous inquiète ?
12. Critère de succès - Comment mesurer le succès ?

⚠️IMPORTANT : Affiche la phase correspondante lors de chaque question.
Exemple : Pour Q1, Q2, Q3, Q4 → affiche "**PHASE 1 — Cadrage stratégique**"

---

APRÈS LA QUESTION 12 (une fois que le client a choisi A/B/C/D ou E) :

ÉTAPE 1 - REFORMULER + PROPOSER NOMS :
1. Reformule la réponse Q12
2. Annonce "✅ Cadrage terminé !"
3. Propose 5 noms (A, B, C, D, E)
4. Demande "Quel nom souhaitez-vous donner à votre projet ?"

ÉTAPE 2 - APRÈS CHOIX DU NOM :

Tu poses la question des noms UNE SEULE FOIS. Ne la redemande JAMAIS.

Quand le client choisit :
1. Identifie le nom exact :
   - Si client répond "A", "B", "C" ou "D" → Prends le nom que tu as proposé pour cette lettre
   - Si client répond "E" ou écrit un nom → Prends exactement ce qu'il a écrit
2. Écris sur une ligne : **Nom du projet : [le nom exact]**
3. Écris sur une nouvelle ligne : [GENERATE]
4. ARRÊTE - Ne pose AUCUNE autre question

Exemples :
- Tu as proposé B) CyberHub, client dit "B" → **Nom du projet : CyberHub**
- Client écrit "Pizza Royale" → **Nom du projet : Pizza Royale**

EXEMPLE COMPLET APRÈS Q12 :
**Je reformule** : Vous mesurez le succès par le nombre de clients quotidiens.

✅ Cadrage terminé ! Maintenant, donnons un nom à votre projet.

**Propositions de noms pour votre cybercafé :**

A) CyberHub
B) NetPoint
C) ConnectZone
D) Digital Access
E) Proposez votre propre nom

**Quel nom souhaitez-vous donner à votre projet ?**

[CLIENT RÉPOND : "B"]

**Nom du projet : NetPoint**

[GENERATE]

---

⚠️ RÈGLES CRITIQUES - INTERDICTIONS ABSOLUES :
- NE JAMAIS afficher de texte comme "Analyse de l'historique"
- NE JAMAIS afficher de texte comme "je dois poser la question X"
- NE JAMAIS afficher de texte comme "Note : Le client a répondu..."
- NE JAMAIS afficher de texte comme "La prochaine étape est de..."
- Ces réflexions internes doivent rester INVISIBLES à l'utilisateur
- Seul le format officiel avec "**Je reformule**" et les questions est autorisé

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
3. Pose la question SUIVANTE avec des options A) B) C) D) E) adaptées au projet EN LANGAGE SIMPLE
4. Ne répète JAMAIS une question déjà posée
5. Les options doivent être SPÉCIFIQUES au projet du client (pas génériques)
6. AUCUNE mention de lieu géographique, ville, pays ou devise
7. ÉVITE LE JARGON : parle simplement, comme à un ami
8. NE JAMAIS afficher de texte de debug ou de réflexion interne

Progression : Classification → Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → PROPOSITION DE NOMS → [GENERATE]`;

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

// 1. DÉFINITION DE PROJET (Format Tableau HTML)
definition_projet: `Génère une DÉFINITION DE PROJET sous forme de tableau HTML professionnel.

RÈGLES STRICTES :
- Utilise UNIQUEMENT les réponses des 12 questions collectées
- Format: Tableau HTML avec bordures noires
- Texte en paragraphe SANS puces (•) ni numéros à l'intérieur
- Pas de mention de source (Q1, Q2...)
- Style professionnel, phrases complètes
- Police NOIRE uniquement

---

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: Arial, sans-serif; color: #000; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th, td { border: 1px solid #000; padding: 12px; text-align: left; vertical-align: top; }
th { background-color: #f0f0f0; font-weight: bold; }
.header { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; }
.project-name { text-align: center; font-size: 16px; font-weight: bold; }
.info-row td { font-size: 14px; }
.section-title { font-weight: bold; font-size: 14px; }
.footer { text-align: center; padding: 20px; font-size: 12px; }
.footer a { color: #4a7c59; text-decoration: none; font-weight: bold; }
.footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<table>
<tr>
<th colspan="2" class="header">Définition de Projet</th>
</tr>
<tr class="info-row">
<td colspan="2" style="padding: 16px; background-color: #f9f9f9;">
  <div style="line-height: 1.8;">
    <strong>Nom du projet :</strong> {{PROJECT_NAME}}<br>
    <strong>Préparé par :</strong> {{OWNER_NAME}}<br>
    <strong>Date de création :</strong> {{DATE}}
  </div>
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">1. Contexte</span><br><br>
[Développe la réponse Q1 en un paragraphe fluide et professionnel, sans puces ni numéros]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">2. Problème à résoudre</span><br><br>
[Développe la réponse Q2 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">3. Bénéficiaire principal</span><br><br>
[Développe la réponse Q3 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">4. Objectif stratégique (12 mois)</span><br><br>
[Développe la réponse Q4 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">5. Besoin réel</span><br><br>
[Développe la réponse Q5 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">6. Limites actuelles</span><br><br>
[Développe la réponse Q6 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">7. Livrable attendu</span><br><br>
[Développe la réponse Q7 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">8. Hors périmètre</span><br><br>
[Développe la réponse Q8 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">9. Exigences fonctionnelles</span><br><br>
[Développe la réponse Q9 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">10. Contraintes</span><br><br>
[Développe la réponse Q10 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">11. Risques</span><br><br>
[Développe la réponse Q11 en un paragraphe fluide et professionnel]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">12. Critères de succès</span><br><br>
[Développe la réponse Q12 en un paragraphe fluide et professionnel]
</td>
</tr>
</table>

<div class="footer">
<a href="{{BASE_URL}}" target="_blank">Document généré par Ark Intelligence</a>
</div>

</body>
</html>`,

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
    
    // ✅ MODIFICATION : On garde les placeholders {{DATE}}, {{OWNER_NAME}}, {{PROJECT_NAME}}
    // Ils seront remplacés dynamiquement à l'affichage
    
    // Remplacer {{BASE_URL}}
    docPrompt = docPrompt.replace(/\{\{BASE_URL\}\}/g, 'https://www.arkintelligence.africa/');

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
- N'utilise JAMAIS de majuscules inappropriées
- Pour le HTML: garde EXACTEMENT la structure fournie
- ⚠️ IMPORTANT : GARDE EXACTEMENT les placeholders {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} tels quels
- NE REMPLACE PAS {{OWNER_NAME}}, {{PROJECT_NAME}}, {{DATE}} par d'autres valeurs
- Renvoie le HTML directement, sans balises markdown
- Texte en paragraphe SANS puces ni numéros`;

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
    
    // Sauvegarder dans Supabase
    if (userId) {
        try {
            const finalProjetNom = projetNom || 'Projet sans nom';
            
            await supabase.from('ark_documents').insert({
                user_id: userId,
                projet_nom: finalProjetNom,
                doc_type: docType,
                contenu: document
            });
            
            console.log(`✅ Document sauvegardé: ${finalProjetNom} (${docType})`);
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

// Fonction utilitaire pour créer un slug
function createSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ENDPOINT 1 : CRÉER UN LIEN DE PARTAGE
async function createShareLink(res, documentId, userId, projetNom) {
    try {
        const { data: user, error: userError } = await supabase
            .from('ark_users')
            .select('nom, prenom')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
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

// ENDPOINT 2 : RÉCUPÉRER UN DOCUMENT PARTAGÉ
async function getSharedDocument(res, token) {
    try {
        // Récupérer le lien de partage
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
            return res.status(404).json({ error: 'Lien invalide ou expiré' });
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

// ENDPOINT 3 : TRACKER UNE VUE
async function trackView(res, sharedLinkId, viewerUserId, viewerIp) {
    try {
        // Vérifier si cette IP a déjà vu ce document dans les 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: recentView, error: checkError } = await supabase
            .from('ark_document_views')
            .select('id')
            .eq('shared_link_id', sharedLinkId)
            .eq('viewer_ip', viewerIp)
            .gte('viewed_at', oneDayAgo)
            .limit(1);

        if (recentView && recentView.length > 0) {
            // Cette IP a déjà vu le document récemment, on ne compte pas
            return res.status(200).json({ success: true, counted: false });
        }

        let viewerName = 'Inconnu';

        // Si l'utilisateur est connecté, récupérer son nom
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

        // Enregistrer la vue
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

// ENDPOINT 4 : RÉCUPÉRER LES STATS D'UN DOCUMENT
async function getDocumentStats(res, documentId, userId) {
    try {
        // Vérifier que le document appartient à l'utilisateur
        const { data: doc, error: docError } = await supabase
            .from('ark_documents')
            .select('id')
            .eq('id', documentId)
            .eq('user_id', userId)
            .single();

        if (docError || !doc) {
            return res.status(404).json({ error: 'Document non trouvé' });
        }

        // Récupérer les vues
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
            console.error('Erreur récupération vues:', viewsError);
            return res.status(500).json({ error: 'Erreur récupération stats' });
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

// ENDPOINT 5 : RÉCUPÉRER TOUS LES DOCUMENTS D'UN UTILISATEUR
async function getUserDocuments(res, userId) {
    try {
        const { data: documents, error } = await supabase
            .from('ark_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false});

        if (error) {
            console.error('Erreur récupération documents:', error);
            return res.status(500).json({ error: 'Erreur récupération' });
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

// ENDPOINT 6 : METTRE À JOUR LE PROFIL UTILISATEUR
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
            console.error('Erreur mise à jour profil:', error);
            return res.status(500).json({ error: 'Erreur mise à jour' });
        }

        console.log(`✅ Profil mis à jour pour user ${userId}`);
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Erreur updateUserProfile:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

// ENDPOINT 7 : RÉCUPÉRER LE PROFIL UTILISATEUR
async function getUserProfile(res, userId) {
    try {
        const { data: user, error } = await supabase
            .from('ark_users')
            .select('id, nom, prenom, telephone, email, type_user')
            .eq('id', userId)
            .single();

        if (error || !user) {
            console.error('Erreur récupération profil:', error);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
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
            message: 'Document supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur deleteDocument:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

async function getSharedDocumentByOwnerProject(res, owner, project) {
    try {
        console.log('🔍 Recherche document:', { owner, project });
        
        // Normaliser owner et project (supprimer accents, caractères spéciaux)
        const normalizeString = (str) => {
            return str
                .toLowerCase()
                .normalize('NFD')                      // Décompose les accents
                .replace(/[\u0300-\u036f]/g, '')      // Supprime les accents
                .replace(/['']/g, ' ')                // Apostrophes → espace
                .replace(/[–—]/g, '-')                // Tirets longs → tiret court
                .replace(/[^\w\s-]/g, '')             // Supprime tout sauf lettres, chiffres, espaces, tirets
                .replace(/\s+/g, ' ')                 // Espaces multiples → 1 espace
                .trim();                               // Supprime espaces début/fin
        };
        
        // Rechercher l'utilisateur par son nom (owner = "prenom-nom")
        const ownerParts = owner.split('-');
        const prenom = ownerParts[0];
        const nom = ownerParts.slice(1).join('-');
        
        console.log('👤 Recherche utilisateur:', { prenom, nom });
        
        // Trouver l'utilisateur - chercher avec pattern flexible
        const { data: users, error: userError } = await supabase
            .from('ark_users')
            .select('id, prenom, nom');

        if (userError) {
            console.error('❌ Erreur recherche utilisateur:', userError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erreur recherche utilisateur' 
            });
        }

        if (!users || users.length === 0) {
            console.error('❌ Aucun utilisateur trouvé');
            return res.status(404).json({ 
                success: false, 
                error: 'Utilisateur introuvable' 
            });
        }

        // Chercher l'utilisateur avec normalisation
        const prenomNorm = normalizeString(prenom);
        const nomNorm = normalizeString(nom);
        
        const user = users.find(u => 
            normalizeString(u.prenom || '') === prenomNorm && 
            normalizeString(u.nom || '') === nomNorm
        );

        if (!user) {
            console.error('❌ Utilisateur non trouvé après normalisation');
            return res.status(404).json({ 
                success: false, 
                error: 'Utilisateur introuvable' 
            });
        }

        console.log('✅ Utilisateur trouvé:', user.id);

        const userId = user.id;
        
        // Rechercher le document par projet_nom et user_id
        const projectNorm = normalizeString(project.replace(/-/g, ' '));
        
        console.log('📄 Recherche document pour userId:', userId);
        
        const { data: documents, error: docError } = await supabase
            .from('ark_documents')
            .select('contenu, projet_nom, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (docError) {
            console.error('❌ Erreur recherche document:', docError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erreur recherche document' 
            });
        }

        if (!documents || documents.length === 0) {
            console.error('❌ Aucun document trouvé pour cet utilisateur');
            return res.status(404).json({ 
                success: false, 
                error: 'Aucun document disponible' 
            });
        }

        // Chercher le document avec normalisation
        const document = documents.find(d => 
            normalizeString(d.projet_nom || '') === projectNorm
        );

        if (!document) {
            console.error('❌ Document non trouvé après normalisation. Projets disponibles:', 
                documents.map(d => d.projet_nom));
            return res.status(404).json({ 
                success: false, 
                error: 'Document introuvable' 
            });
        }

        console.log('✅ Document trouvé');

        return res.status(200).json({
            success: true,
            document: document.contenu,
            createdAt: document.created_at
        });

    } catch (error) {
        console.error('❌ Erreur getSharedDocumentByOwnerProject:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
}
