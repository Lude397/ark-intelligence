// ==================== AGILE ====================
// Interview : 11 questions, 5 phases, sans etape de nom

export const TEMPLATE = `Genere un document AGILE sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Format Tableau HTML 2 colonnes
- Texte en paragraphe SANS puces
- Contenu COURT 2-3 lignes max (maximum 120 caracteres par cellule)
- Le document doit tenir sur UNE SEULE PAGE A4 PORTRAIT (210mm x 297mm)
- LIMITE DE CONTENU : chaque cellule ne doit PAS depasser 120 caracteres. Si tu depasses, raccourcis.
- IMPORTANT : Copie EXACTEMENT le HTML ci-dessous, remplace UNIQUEMENT le texte entre crochets []

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
<div class="doc-title">Agile</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Objectif du projet</td><td class="content-cell">[Vision et objectif. 120 car. max.]</td></tr>
  <tr><td class="label-cell">2. Valeur prioritaire</td><td class="content-cell">[Valeur pour utilisateurs. 120 car. max.]</td></tr>
  <tr><td class="label-cell">3. Backlog des fonctionnalites</td><td class="content-cell">[Fonctionnalites par priorite. 120 car. max.]</td></tr>
  <tr><td class="label-cell">4. Sprint en cours</td><td class="content-cell">[Objectif du sprint. 120 car. max.]</td></tr>
  <tr><td class="label-cell">5. Taches du sprint</td><td class="content-cell">[Actions concretes. 120 car. max.]</td></tr>
  <tr><td class="label-cell">6. Obstacles et bloquants</td><td class="content-cell">[Problemes identifies. 120 car. max.]</td></tr>
  <tr><td class="label-cell">7. Livrables produits</td><td class="content-cell">[Ce qui a ete livre. 120 car. max.]</td></tr>
  <tr><td class="label-cell">8. Retours utilisateurs</td><td class="content-cell">[Feedback. 120 car. max.]</td></tr>
  <tr><td class="label-cell">9. Enseignements du sprint</td><td class="content-cell">[Ce qui a fonctionne ou pas. 120 car. max.]</td></tr>
  <tr><td class="label-cell">10. Actions d amelioration</td><td class="content-cell">[Mesures concretes. 120 car. max.]</td></tr>
  <tr><td class="label-cell">11. Decision pour le sprint suivant</td><td class="content-cell">[Priorites prochaines. 120 car. max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`;

export const LABELS = [
    '1. Objectif du projet', '2. Valeur prioritaire', '3. Backlog des fonctionnalites',
    '4. Sprint en cours', '5. Taches du sprint', '6. Obstacles et bloquants',
    '7. Livrables produits', '8. Retours utilisateurs', '9. Enseignements du sprint',
    '10. Actions d amelioration', '11. Decision pour le sprint suivant'
];
export const TITLE = 'Agile';
export const CONFIG = { totalQuestions: 11, hasNameStep: false };
