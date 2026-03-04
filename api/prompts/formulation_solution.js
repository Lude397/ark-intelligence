// ==================== FORMULATION DE SOLUTION ====================
// Interview : 6 questions, 3 phases, sans etape de nom

export const TEMPLATE = `Genere un document FORMULATION DE SOLUTION sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Ce document s appuie sur l Orientation de Solution validee
- Format: Tableau HTML 2 colonnes (label a gauche, contenu a droite)
- Texte en paragraphe SANS puces ni numeros a l interieur
- Contenu COURT : 2-3 lignes max par section (maximum 150 caracteres par cellule)
- Le document doit tenir sur UNE SEULE PAGE A4 PORTRAIT (210mm x 297mm)
- LIMITE DE CONTENU : chaque cellule ne doit PAS depasser 150 caracteres. Si tu depasses, raccourcis.
- IMPORTANT : Copie EXACTEMENT le HTML ci-dessous, remplace UNIQUEMENT le texte entre crochets []
- RÈGLE ABSOLUE - LANGUE FRANÇAISE :
Tu dois TOUJOURS écrire en français correct avec tous les accents obligatoires.
Ne jamais omettre un accent. Exemples : é, è, ê, ë, à, â, ù, û, î, ï, ô, ç, œ, æ.
Mots courants à ne JAMAIS écrire sans accent :
définition, problème, résoudre, bénéficiaire, critères, succès, périmètre,
évaluation, données, système, intégration, référence, spécifique, général,
différent, nécessaire, réel, créer, générer, stratégie, fonctionnalités,
exigences, contraintes, préjugés, développement, objectif, période.
Tout texte sans accent correct sera considéré comme une erreur grave.

---

<style>
@page { size: A4 portrait; margin: 10mm; }
.doc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; padding: 20px; width: 100%; max-width: 210mm; max-height: 277mm; margin: 0 auto; }
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
  <tr><td class="label-cell">1. Rappel du probleme cible</td><td class="content-cell">[Reformulation synthetique. 150 car. max.]</td></tr>
  <tr><td class="label-cell">2. Utilisateur cible</td><td class="content-cell">[Description precise avec comportements. 150 car. max.]</td></tr>
  <tr><td class="label-cell">3. Formulation centrale</td><td class="content-cell">[En une phrase : que fait le projet, pour qui, comment. 150 car. max.]</td></tr>
  <tr><td class="label-cell">4. Fonctionnement de la solution</td><td class="content-cell">[Etapes du parcours utilisateur. 150 car. max.]</td></tr>
  <tr><td class="label-cell">5. Frontieres de la solution</td><td class="content-cell">[Ce que la solution ne fait PAS. 150 car. max.]</td></tr>
  <tr><td class="label-cell">6. Resultat attendu</td><td class="content-cell">[Impact concret. 150 car. max.]</td></tr>
  <tr><td class="label-cell">7. Critere de bonne formulation</td><td class="content-cell">[Comment verifier que c est bien compris. 150 car. max.]</td></tr>
  <tr><td class="label-cell">8. Pitch</td><td class="content-cell">[Resume en 2 phrases pour convaincre. 150 car. max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`;

export const LABELS = [
    '1. Rappel du probleme cible', '2. Utilisateur cible', '3. Formulation centrale',
    '4. Fonctionnement de la solution', '5. Frontieres de la solution',
    '6. Resultat attendu', '7. Critere de bonne formulation', '8. Pitch'
];
export const TITLE = 'Formulation de Solution';
export const CONFIG = { totalQuestions: 6, hasNameStep: false };
