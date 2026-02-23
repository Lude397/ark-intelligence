// ==================== PROMPTS DOCUMENTS ====================

// 1. DEFINITION DE PROJET (Format Tableau HTML)
export const definition_projet = `Genere une DEFINITION DE PROJET sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Utilise UNIQUEMENT les reponses des 12 questions collectees
- Format: Tableau HTML avec bordures noires
- Texte en paragraphe SANS puces ni numeros a l'interieur
- Pas de mention de source (Q1, Q2...)
- Style professionnel, phrases completes
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
<th colspan="2" class="header">Definition de Projet</th>
</tr>
<tr class="info-row">
<td colspan="2" style="padding: 16px; background-color: #f9f9f9;">
  <div style="line-height: 1.8;">
    <strong>Nom du projet :</strong> {{PROJECT_NAME}}<br>
    <strong>Prepare par :</strong> {{OWNER_NAME}}<br>
    <strong>Date de creation :</strong> {{DATE}}
  </div>
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">1. Contexte</span><br><br>
[COMMENCE par une phrase qui definit clairement le projet : son nom, sa nature exacte (type d'entreprise, de service ou de produit) et ce qu'il propose concretement. ENSUITE seulement, explique pourquoi ce projet est lance (motivation, opportunite de marche, constat). Le lecteur doit comprendre de quoi il s'agit des la premiere phrase. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">2. Probleme a resoudre</span><br><br>
[Decris le probleme concret que le projet cherche a resoudre. Explique la situation actuelle insatisfaisante pour les clients ou utilisateurs, puis montre en quoi ce projet apporte une reponse. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">3. Beneficiaire principal</span><br><br>
[Identifie clairement qui sont les premiers clients ou utilisateurs vises. Decris leur profil et pourquoi ils ont besoin de ce projet. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">4. Objectif strategique (12 mois)</span><br><br>
[Decris ce que le projet aura accompli dans 12 mois. Donne des indicateurs concrets et mesurables. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">5. Besoin reel</span><br><br>
[Explique quelles informations ou ressources sont indispensables pour lancer le projet. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">6. Limites actuelles</span><br><br>
[Decris les freins ou obstacles qui empechent le lancement immediat du projet. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">7. Livrable attendu</span><br><br>
[Decris le resultat concret attendu a l'issue de la phase de cadrage. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">8. Hors perimetre</span><br><br>
[Liste ce qui ne fait PAS partie de ce projet de cadrage, pour eviter toute confusion. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">9. Exigences fonctionnelles</span><br><br>
[Decris la capacite ou fonctionnalite prioritaire pour le succes du projet. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">10. Contraintes</span><br><br>
[Decris les contraintes principales a prendre en compte pour le lancement. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">11. Risques</span><br><br>
[Identifie le ou les risques majeurs qui pourraient compromettre le projet et leurs consequences. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
<tr>
<td colspan="2">
<span class="section-title">12. Criteres de succes</span><br><br>
[Definis comment le succes du projet sera mesure concretement, avec des indicateurs clairs. Paragraphe fluide, sans puces ni numeros.]
</td>
</tr>
</table>

<div class="footer">
<a href="{{BASE_URL}}" target="_blank">Document genere par Ark Intelligence</a>
</div>

</body>
</html>`;


// 2. ORIENTATION DE SOLUTION
export const orientation_solution = `Genere un document ORIENTATION DE SOLUTION.

---

# ORIENTATION DE SOLUTION
## [Nom du projet]

Date : {{DATE}}

---

### 1. Probleme valide
### 2. Utilisateur prioritaire
### 3. Solution envisagee
### 4. Phrase d'orientation de solution
### 5. Alternatives ecartees
### 6. Niveau de complexite
### 7. Faisabilite immediate
### 8. Premier pas concret
### 9. Critere de bon choix
### 10. Decision formelle

---

Document genere par Ark Intelligence`;


// 3. FORMULATION DE SOLUTION
export const formulation_solution = `Genere un document FORMULATION DE SOLUTION.

---

# FORMULATION DE SOLUTION
## [Nom du projet]

Date : {{DATE}}

---

### 1. Rappel du probleme cible
### 2. Utilisateur cible
### 3. Formulation centrale
### 4. Explication de la solution
### 5. Resultat attendu
### 6. Frontieres de la solution
### 7. Critere de bonne formulation
### 8. Version courte (pitch)

---

Document genere par Ark Intelligence`;


// 4. DESIGN THINKING
export const design_thinking = `Genere un document DESIGN THINKING.

---

# DESIGN THINKING
## [Nom du projet]

Date : {{DATE}}

---

## Phase 1 -- Empathie
### 1. Utilisateur cible
### 2. Problemes et frustrations
### 3. Comportements et habitudes

## Phase 2 -- Definition
### 4. Probleme central
### 5. Impact si non resolu

## Phase 3 -- Ideation
### 6. Idee principale
### 7. Alternatives

## Phase 4 -- Prototypage
### 8. Forme du prototype
### 9. Objectif du prototype

## Phase 5 -- Test
### 10. Utilisateurs testeurs
### 11. Methode de test
### 12. Criteres de validation

---

Document genere par Ark Intelligence`;


// 5. BUSINESS MODEL CANVAS
export const business_model = `Genere un BUSINESS MODEL CANVAS.

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
### 6. Ressources cles
### 7. Activites cles
### 8. Partenaires cles
### 9. Structure de couts

---

Document genere par Ark Intelligence`;


// 6. LEAN STARTUP
export const lean_startup = `Genere un document LEAN STARTUP.

---

# LEAN STARTUP
## [Nom du projet]

Date : {{DATE}}

---

## Etape 1 -- Probleme
### 1. Probleme a tester
### 2. Utilisateur concerne
### 3. Solutions existantes

## Etape 2 -- Hypotheses
### 4. Hypothese de valeur
### 5. Hypothese de croissance
### 6. Hypothese de monetisation

## Etape 3 -- MVP
### 7. Description du MVP
### 8. Objectif du MVP

## Etape 4 -- Mesure
### 9. Indicateur cle
### 10. Seuil de succes

## Etape 5 -- Apprentissage
### 11. Enseignements attendus
### 12. Decision strategique

---

Document genere par Ark Intelligence`;


// 7. AGILE
export const agile = `Genere un document AGILE.

---

# AGILE
## [Nom du projet]

Date : {{DATE}}

---

## Phase 1 -- Vision
### 1. Objectif du projet
### 2. Valeur prioritaire

## Phase 2 -- Backlog
### 3. Backlog des fonctionnalites
### 4. Sprint en cours

## Phase 3 -- Execution
### 5. Taches du sprint
### 6. Obstacles et bloquants

## Phase 4 -- Revue
### 7. Livrables produits
### 8. Retours utilisateurs

## Phase 5 -- Amelioration
### 9. Enseignements du sprint
### 10. Actions d'amelioration
### 11. Decision pour le sprint suivant

---

Document genere par Ark Intelligence`;
