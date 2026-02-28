// FICHIER : api/prompts/business_model.js

export const TEMPLATE = `Génère un BUSINESS MODEL CANVAS sous forme de GRILLE HTML authentique.

REGLES STRICTES :
- Utilise les réponses de l interview BMC ET la Définition de Projet
- NE MODIFIE PAS le HTML/CSS ci-dessous, remplace UNIQUEMENT le texte entre [crochets]
- Texte en paragraphe fluide, SANS puces ni numéros
- Contenu CONCIS adapté à la taille de chaque cellule
- GARDE les placeholders {{PROJECT_NAME}}, {{OWNER_NAME}}, {{DATE}} tels quels

---

<style>
.bmc-wrapper { font-family: 'Times New Roman', serif; color: #000; background: #fff; width: 100%; max-width: 297mm; margin: 0 auto; display: flex; flex-direction: column; }
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
    <div class="bmc-header-field"><span class="label">Créé par :</span><br><span class="value">{{OWNER_NAME}}</span></div>
  </div>
</div>
<div class="bmc-body">
  <div class="bmc-grid">
    <div class="bmc-cell cell-partenaires">
      <div class="bmc-cell-header">Partenaires clés</div>
      <div class="bmc-cell-content">[Partenaires stratégiques, fournisseurs, alliances nécessaires au fonctionnement.]</div>
    </div>
    <div class="bmc-cell cell-activites">
      <div class="bmc-cell-header">Activités clés</div>
      <div class="bmc-cell-content">[Actions essentielles au quotidien pour faire fonctionner le modèle.]</div>
    </div>
    <div class="bmc-cell cell-ressources">
      <div class="bmc-cell-header">Ressources clés</div>
      <div class="bmc-cell-content">[Moyens humains, techniques, financiers indispensables.]</div>
    </div>
    <div class="bmc-cell cell-proposition">
      <div class="bmc-cell-header">Proposition de valeur</div>
      <div class="bmc-cell-content">[Valeur unique apportée au client, ce qui différencie la solution.]</div>
    </div>
    <div class="bmc-cell cell-relation">
      <div class="bmc-cell-header">Relation client</div>
      <div class="bmc-cell-content">[Comment maintenir et fidéliser la relation avec les clients.]</div>
    </div>
    <div class="bmc-cell cell-canaux">
      <div class="bmc-cell-header">Canaux</div>
      <div class="bmc-cell-content">[Comment atteindre et distribuer la solution aux clients.]</div>
    </div>
    <div class="bmc-cell cell-segments">
      <div class="bmc-cell-header">Segments de clients</div>
      <div class="bmc-cell-content">[Profils détaillés des différents types de clients visés.]</div>
    </div>
    <div class="bmc-cell cell-couts">
      <div class="bmc-cell-header">Structure de coûts</div>
      <div class="bmc-cell-content">[Principaux postes de dépenses pour lancer et maintenir l activité.]</div>
    </div>
    <div class="bmc-cell cell-revenus">
      <div class="bmc-cell-header">Sources de revenus</div>
      <div class="bmc-cell-content">[Comment l activité génère de l argent, modèles de monétisation.]</div>
    </div>
  </div>
</div>
<div class="bmc-footer">
  <span class="bmc-footer-date"><strong>Date :</strong> {{DATE}}</span>
  <a class="bmc-footer-link" href="https://www.arkintelligence.africa" target="_blank">Document généré par Ark Intelligence</a>
</div>
</div>`;

export const CELLS = [
    'Partenaires clés',
    'Activités clés',
    'Ressources clés',
    'Proposition de valeur',
    'Relation client',
    'Canaux',
    'Segments de clients',
    'Structure de coûts',
    'Sources de revenus'
];

export const TITLE = 'Business Model Canvas';

export const CONFIG = { totalQuestions: 7, hasNameStep: false, requiresDefinition: true, layout: 'grid' };
