// ==================== ORIENTATION DE SOLUTION ====================
// Interview : 8 questions, 3 phases, sans etape de nom

export const TEMPLATE = `Genere un document ORIENTATION DE SOLUTION sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Ce document s appuie sur la Definition de Projet validee
- Format: Tableau HTML 2 colonnes (label a gauche, contenu a droite)
- Texte en paragraphe SANS puces ni numeros a l interieur
- Contenu COURT : 2-3 lignes max par section (maximum 180 caracteres par cellule)
- Le document doit tenir sur UNE SEULE PAGE A4 PORTRAIT (210mm x 297mm)
- LIMITE DE CONTENU : chaque cellule ne doit PAS depasser 120 caracteres. Si tu depasses, raccourcis.
- IMPORTANT : Copie EXACTEMENT le HTML ci-dessous, remplace UNIQUEMENT le texte entre crochets []
- MINIMUM 150 caracteres par cellule : si ton contenu est plus court, developpe et enrichis
- MAXIMUM 180 caracteres par cellule : si tu depasses, raccourcis sans perdre le sens

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
<div class="doc-title">Orientation de Solution</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Probleme valide</td><td class="content-cell">[Reformulation du probleme. 120 car. max.]</td></tr>
  <tr><td class="label-cell">2. Utilisateur prioritaire</td><td class="content-cell">[Beneficiaire principal. 120 car. max.]</td></tr>
  <tr><td class="label-cell">3. Solution retenue</td><td class="content-cell">[Description de la solution. 120 car. max.]</td></tr>
  <tr><td class="label-cell">4. Justification</td><td class="content-cell">[Pourquoi cette solution. 120 car. max.]</td></tr>
  <tr><td class="label-cell">5. Analyse des contraintes</td><td class="content-cell">[Contraintes et gestion. 120 car. max.]</td></tr>
  <tr><td class="label-cell">6. Ressources necessaires</td><td class="content-cell">[Ressources humaines, techniques, financieres. 120 car. max.]</td></tr>
  <tr><td class="label-cell">7. Fonctionnalites prioritaires</td><td class="content-cell">[Fonctionnalites essentielles. 120 car. max.]</td></tr>
  <tr><td class="label-cell">8. Plan de demarrage</td><td class="content-cell">[Premieres actions concretes. 120 car. max.]</td></tr>
  <tr><td class="label-cell">9. Jalons de validation</td><td class="content-cell">[Indicateurs a 3 mois. 120 car. max.]</td></tr>
  <tr><td class="label-cell">10. Criteres de pivot</td><td class="content-cell">[Conditions pour changer d approche. 120 car. max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`;

export const LABELS = [
    '1. Probleme valide', '2. Utilisateur prioritaire', '3. Solution retenue',
    '4. Justification', '5. Analyse des contraintes', '6. Ressources necessaires',
    '7. Fonctionnalites prioritaires', '8. Plan de demarrage',
    '9. Jalons de validation', '10. Criteres de pivot'
];
export const TITLE = 'Orientation de Solution';
export const CONFIG = { totalQuestions: 8, hasNameStep: false };
