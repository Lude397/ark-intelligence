// FICHIER : api/prompts/design_thinking.js

export const TEMPLATE = `Genere un document DESIGN THINKING sous forme de CANVAS HTML.

REGLES STRICTES :
- Utilise les reponses de l interview Design Thinking ET la Definition de Projet
- NE MODIFIE PAS le HTML/CSS ci-dessous, remplace UNIQUEMENT le texte entre [crochets]
- Texte en paragraphe fluide, SANS puces ni numeros
- Le document doit tenir sur UNE SEULE PAGE A4 PAYSAGE (297mm x 210mm)
- MINIMUM 120 caracteres par cellule : si ton contenu est plus court, developpe et enrichis
- MAXIMUM 150 caracteres par cellule : si tu depasses, raccourcis sans perdre le sens
- GARDE les placeholders {{PROJECT_NAME}}, {{OWNER_NAME}}, {{DATE}} tels quels

---

<style>
@page { size: A4 landscape; margin: 10mm; }
.dt-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; width: 100%; max-width: 297mm; max-height: 190mm; margin: 0 auto; display: flex; flex-direction: column; }
.dt-header { background: #2c3e50; padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.dt-header-left { display: flex; align-items: center; gap: 14px; }
.dt-header-logo { height: 44px; }
.dt-header-title { font-size: 30px; font-weight: 900; color: #fff; }
.dt-header-right { display: flex; gap: 36px; }
.dt-header-field { color: #ccc; font-size: 14px; line-height: 1.5; }
.dt-header-field .label { color: #aaa; font-size: 13px; }
.dt-header-field .value { font-size: 17px; font-weight: bold; color: #d4a017; }
.dt-body { padding: 14px 18px; flex: 1; display: flex; flex-direction: column; min-height: 0; }
.dt-canvas { display: grid; grid-template-columns: repeat(5, 1fr); gap: 7px; flex: 1; min-height: 0; }
.dt-column { border: 1px solid #ccc; display: flex; flex-direction: column; overflow: hidden; }
.dt-column-header { background: #2c3e50; color: #fff; font-weight: bold; font-size: 15px; padding: 11px 12px; text-align: center; flex-shrink: 0; }
.dt-column-content { padding: 12px 13px; font-size: 15px; line-height: 1.7; color: #222; flex: 1; }
.dt-resume-row { display: grid; grid-template-columns: 1fr; gap: 7px; margin-top: 7px; flex-shrink: 0; }
.dt-resume { border: 1px solid #ccc; display: flex; flex-direction: column; }
.dt-resume-header { background: #2c3e50; color: #fff; font-weight: bold; font-size: 15px; padding: 11px 12px; text-align: center; flex-shrink: 0; }
.dt-resume-content { padding: 12px 13px; font-size: 15px; line-height: 1.7; color: #222; flex: 1; }
.dt-footer { padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.dt-footer-date { font-size: 15px; color: #333; border-bottom: 2.5px solid #2c3e50; padding-bottom: 4px; font-weight: bold; }
.dt-footer-logo { height: 40px; opacity: 0.6; }
.dt-footer-link { color: #4a7c59; text-decoration: none; font-size: 14px; font-style: italic; }
</style>

<div class="dt-wrapper">
<div class="dt-header">
  <div class="dt-header-left">
    <img class="dt-header-logo" src="/assets/logo.png" alt="Ark Intelligence">
    <span class="dt-header-title">Design Thinking</span>
  </div>
  <div class="dt-header-right">
    <div class="dt-header-field"><span class="label">Nom du projet :</span><br><span class="value">{{PROJECT_NAME}}</span></div>
    <div class="dt-header-field"><span class="label">Cree par :</span><br><span class="value">{{OWNER_NAME}}</span></div>
  </div>
</div>
<div class="dt-body">
  <div class="dt-canvas">
    <div class="dt-column">
      <div class="dt-column-header">Experience utilisateur</div>
      <div class="dt-column-content">[Synthese de la journee typique de l utilisateur, ses difficultes, frustrations et habitudes. 120-150 car.]</div>
    </div>
    <div class="dt-column">
      <div class="dt-column-header">Definition du Probleme</div>
      <div class="dt-column-content">[Probleme central reformule et impact concret si non resolu. 120-150 car.]</div>
    </div>
    <div class="dt-column">
      <div class="dt-column-header">Solution</div>
      <div class="dt-column-content">[Idee principale retenue, alternatives envisagees et raisons du choix. 120-150 car.]</div>
    </div>
    <div class="dt-column">
      <div class="dt-column-header">Prototype</div>
      <div class="dt-column-content">[Forme du prototype, ce qu il permet de tester, perimetre limite. 120-150 car.]</div>
    </div>
    <div class="dt-column">
      <div class="dt-column-header">Test</div>
      <div class="dt-column-content">[Methode de test, nombre de testeurs, criteres de validation et seuil de reussite. 120-150 car.]</div>
    </div>
  </div>
  <div class="dt-resume-row">
    <div class="dt-resume">
      <div class="dt-resume-header">Resume</div>
      <div class="dt-resume-content">[Synthese en 3-4 phrases de l approche Design Thinking pour ce projet. 120-150 car.]</div>
    </div>
  </div>
</div>
<div class="dt-footer">
  <span class="dt-footer-date"><strong>Date :</strong> {{DATE}}</span>
  <img class="dt-footer-logo" src="/assets/logo.png" alt="Ark Intelligence">
  <a class="dt-footer-link" href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a>
</div>
</div>`;

export const COLUMNS = [
    'Experience utilisateur',
    'Definition du Probleme',
    'Solution',
    'Prototype',
    'Test',
    'Resume'
];

export const TITLE = 'Design Thinking';

export const CONFIG = { totalQuestions: 8, hasNameStep: false, requiresDefinition: true, layout: 'canvas' };
