// ==================== DEFINITION DE PROJET ====================
// Interview : 12 questions, 5 phases, avec etape de nom

export const TEMPLATE = `Genere une DEFINITION DE PROJET sous forme de tableau HTML professionnel. 

REGLES STRICTES :
- Utilise UNIQUEMENT les reponses des 12 questions collectees
- Format: Tableau HTML 2 colonnes (label a gauche, contenu a droite)
- Texte en paragraphe SANS puces ni numeros a l interieur
- Pas de mention de source (Q1, Q2...)
- Style professionnel, phrases completes
- Contenu COURT : 2-3 lignes max par section (maximum 120 caracteres par cellule)
- Le document doit tenir sur UNE SEULE PAGE A4 PORTRAIT (210mm x 297mm)
- LIMITE DE CONTENU : chaque cellule ne doit PAS depasser 120 caracteres. Si tu depasses, raccourcis.
- IMPORTANT pour le Contexte : COMMENCE par une phrase qui definit clairement le projet
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
<div class="doc-title">Definition de Projet</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Contexte</td><td class="content-cell">[COMMENCE par definir le projet puis explique pourquoi il est lance. 120 car. max.]</td></tr>
  <tr><td class="label-cell">2. Probleme a resoudre</td><td class="content-cell">[Decris le probleme concret. 120 car. max.]</td></tr>
  <tr><td class="label-cell">3. Beneficiaire principal</td><td class="content-cell">[Identifie les premiers clients. 120 car. max.]</td></tr>
  <tr><td class="label-cell">4. Objectif a 12 mois</td><td class="content-cell">[Objectifs concrets. 120 car. max.]</td></tr>
  <tr><td class="label-cell">5. Besoin reel</td><td class="content-cell">[Ressources indispensables. 120 car. max.]</td></tr>
  <tr><td class="label-cell">6. Limites actuelles</td><td class="content-cell">[Freins ou obstacles. 120 car. max.]</td></tr>
  <tr><td class="label-cell">7. Livrable attendu</td><td class="content-cell">[Resultat concret attendu. 120 car. max.]</td></tr>
  <tr><td class="label-cell">8. Hors perimetre</td><td class="content-cell">[Ce qui ne fait PAS partie du projet. 120 car. max.]</td></tr>
  <tr><td class="label-cell">9. Exigences fonctionnelles</td><td class="content-cell">[Fonctionnalite prioritaire. 120 car. max.]</td></tr>
  <tr><td class="label-cell">10. Contraintes</td><td class="content-cell">[Contraintes principales. 120 car. max.]</td></tr>
  <tr><td class="label-cell">11. Risques</td><td class="content-cell">[Risques majeurs. 120 car. max.]</td></tr>
  <tr><td class="label-cell">12. Criteres de succes</td><td class="content-cell">[Comment mesurer le succes. 120 car. max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`;

export const LABELS = [
    '1. Contexte', '2. Probleme a resoudre', '3. Beneficiaire principal',
    '4. Objectif a 12 mois', '5. Besoin reel', '6. Limites actuelles',
    '7. Livrable attendu', '8. Hors perimetre', '9. Exigences fonctionnelles',
    '10. Contraintes', '11. Risques', '12. Criteres de succes'
];
export const TITLE = 'Definition de Projet';
export const CONFIG = { totalQuestions: 12, hasNameStep: true };
