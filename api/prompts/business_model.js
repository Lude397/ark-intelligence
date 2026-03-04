// FICHIER : api/prompts/business_model.js

export const TEMPLATE = `Genere un BUSINESS MODEL CANVAS sous forme de GRILLE HTML authentique. 

REGLES STRICTES :
- Utilise les reponses de l interview BMC ET la Definition de Projet
- NE MODIFIE PAS le HTML/CSS ci-dessous, remplace UNIQUEMENT le texte entre [crochets]
- Texte en paragraphe fluide, SANS puces ni numeros
- Contenu CONCIS adapte a la taille de chaque cellule (maximum 150 caracteres par cellule)
- Le document doit tenir sur UNE SEULE PAGE A4 PAYSAGE (297mm x 210mm)
- LIMITE DE CONTENU : chaque cellule ne doit PAS depasser 150 caracteres. Si tu depasses, raccourcis.
- GARDE les placeholders {{PROJECT_NAME}}, {{OWNER_NAME}}, {{DATE}} tels quels
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
@page { size: A4 landscape; margin: 10mm; }
.bmc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; width: 100%; max-width: 297mm; max-height: 190mm; margin: 0 auto; display: flex; flex-direction: column; }
.bmc-header { background: #2c3e50; padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.bmc-header-left { display: flex; align-items: center; gap: 14px; }
.bmc-header-logo { height: 44px; }
.bmc-header-title { font-size: 30px; font-weight: 900; color: #fff; }
.bmc-header-right { display: flex; gap: 36px; }
.bmc-header-field { color: #ccc; font-size: 14px; line-height: 1.5; }
.bmc-header-field .label { color: #aaa; font-size: 13px; }
.bmc-header-field .value { font-size: 17px; font-weight: bold; color: #d4a017; }
.bmc-body { padding: 14px 18px; flex: 1; display: flex; flex-direction: column; min-height: 0; }
.bmc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 0.7fr; gap: 0; flex: 1; min-height: 0; }
.bmc-cell { border: 1px solid #ccc; display: flex; flex-direction: column; margin: -0.5px; }
.bmc-cell-header { background: #2c3e50; color: #fff; font-weight: bold; font-size: 13px; padding: 7px 10px; text-align: center; flex-shrink: 0; }
.bmc-cell-content { padding: 8px 10px; font-size: 12.5px; line-height: 1.55; color: #222; flex: 1; }
.cell-partenaires { grid-column: 1; grid-row: 1 / 3; }
.cell-activites { grid-column: 2; grid-row: 1; }
.cell-ressources { grid-column: 2; grid-row: 2; }
.cell-proposition { grid-column: 3; grid-row: 1 / 3; }
.cell-relation { grid-column: 4; grid-row: 1; }
.cell-canaux { grid-column: 4; grid-row: 2; }
.cell-segments { grid-column: 5; grid-row: 1 / 3; }
.cell-couts { grid-column: 1 / 4; grid-row: 3; }
.cell-revenus { grid-column: 4 / 6; grid-row: 3; }
.bmc-footer { padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.bmc-footer-date { font-size: 15px; color: #333; border-bottom: 2.5px solid #2c3e50; padding-bottom: 4px; font-weight: bold; }
.bmc-footer-link { color: #4a7c59; text-decoration: none; font-size: 14px; font-style: italic; }
</style>

<div class="bmc-wrapper">
<div class="bmc-header">
  <div class="bmc-header-left">
    <img class="bmc-header-logo" src="/assets/logo.png" alt="Ark Intelligence">
    <span class="bmc-header-title">Business Model Canvas</span>
  </div>
  <div class="bmc-header-right">
    <div class="bmc-header-field"><span class="label">Nom du projet :</span><br><span class="value">{{PROJECT_NAME}}</span></div>
    <div class="bmc-header-field"><span class="label">Cree par :</span><br><span class="value">{{OWNER_NAME}}</span></div>
  </div>
</div>
<div class="bmc-body">
  <div class="bmc-grid">
    <div class="bmc-cell cell-partenaires">
      <div class="bmc-cell-header">Partenaires cles</div>
      <div class="bmc-cell-content">[Partenaires strategiques, fournisseurs, alliances necessaires. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-activites">
      <div class="bmc-cell-header">Activites cles</div>
      <div class="bmc-cell-content">[Actions essentielles au quotidien. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-ressources">
      <div class="bmc-cell-header">Ressources cles</div>
      <div class="bmc-cell-content">[Moyens humains, techniques, financiers. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-proposition">
      <div class="bmc-cell-header">Proposition de valeur</div>
      <div class="bmc-cell-content">[Valeur unique apportee au client, ce qui differencie la solution. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-relation">
      <div class="bmc-cell-header">Relation client</div>
      <div class="bmc-cell-content">[Comment maintenir et fideliser les clients. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-canaux">
      <div class="bmc-cell-header">Canaux</div>
      <div class="bmc-cell-content">[Comment atteindre et distribuer la solution. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-segments">
      <div class="bmc-cell-header">Segments de clients</div>
      <div class="bmc-cell-content">[Profils detailles des differents types de clients vises. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-couts">
      <div class="bmc-cell-header">Structure de couts</div>
      <div class="bmc-cell-content">[Principaux postes de depenses pour lancer et maintenir l activite. 150 car. max.]</div>
    </div>
    <div class="bmc-cell cell-revenus">
      <div class="bmc-cell-header">Sources de revenus</div>
      <div class="bmc-cell-content">[Comment l activite genere de l argent, modeles de monetisation. 150 car. max.]</div>
    </div>
  </div>
</div>
<div class="bmc-footer">
  <span class="bmc-footer-date"><strong>Date :</strong> {{DATE}}</span>
  <a class="bmc-footer-link" href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a>
</div>
</div>`;

export const CELLS = [
    'Partenaires cles',
    'Activites cles',
    'Ressources cles',
    'Proposition de valeur',
    'Relation client',
    'Canaux',
    'Segments de clients',
    'Structure de couts',
    'Sources de revenus'
];

export const TITLE = 'Business Model Canvas';

export const CONFIG = { totalQuestions: 7, hasNameStep: false, requiresDefinition: true, layout: 'grid' };
