// ==================== LEAN STARTUP ====================
// Interview : 12 questions, 5 etapes, sans etape de nom

export const TEMPLATE = `Genere un document LEAN STARTUP sous forme de tableau HTML professionnel.

REGLES STRICTES :
- Format Tableau HTML 2 colonnes
- Texte en paragraphe SANS puces
- Contenu COURT 2-3 lignes max (maximum 120 caracteres par cellule)
- Le document doit tenir sur UNE SEULE PAGE A4 PORTRAIT (210mm x 297mm)
- LIMITE DE CONTENU : chaque cellule ne doit PAS depasser 120 caracteres. Si tu depasses, raccourcis.
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
<div class="doc-title">Lean Startup</div>
<div class="doc-project-name">{{PROJECT_NAME}}</div>
<div class="doc-info">Proprietaire : {{OWNER_NAME}}<br>Date : {{DATE}}</div>
<table>
  <tr><td class="label-cell">1. Probleme a tester</td><td class="content-cell">[Hypothese de probleme. 120 car. max.]</td></tr>
  <tr><td class="label-cell">2. Utilisateur concerne</td><td class="content-cell">[Profil utilisateur. 120 car. max.]</td></tr>
  <tr><td class="label-cell">3. Solutions existantes</td><td class="content-cell">[Comment le probleme est gere. 120 car. max.]</td></tr>
  <tr><td class="label-cell">4. Hypothese de valeur</td><td class="content-cell">[Pourquoi adopter. 120 car. max.]</td></tr>
  <tr><td class="label-cell">5. Hypothese de croissance</td><td class="content-cell">[Comment attirer. 120 car. max.]</td></tr>
  <tr><td class="label-cell">6. Hypothese de monetisation</td><td class="content-cell">[Comment generer revenus. 120 car. max.]</td></tr>
  <tr><td class="label-cell">7. Description du MVP</td><td class="content-cell">[Version minimale. 120 car. max.]</td></tr>
  <tr><td class="label-cell">8. Objectif du MVP</td><td class="content-cell">[Ce qu il valide. 120 car. max.]</td></tr>
  <tr><td class="label-cell">9. Indicateur cle</td><td class="content-cell">[Metrique principale. 120 car. max.]</td></tr>
  <tr><td class="label-cell">10. Seuil de succes</td><td class="content-cell">[Valeur minimale. 120 car. max.]</td></tr>
  <tr><td class="label-cell">11. Enseignements attendus</td><td class="content-cell">[Ce qu on espere apprendre. 120 car. max.]</td></tr>
  <tr><td class="label-cell">12. Decision strategique</td><td class="content-cell">[Perseverer, pivoter ou abandonner. 120 car. max.]</td></tr>
</table>
<div class="doc-footer"><a href="https://www.arkintelligence.africa" target="_blank">Document genere par Ark Intelligence</a></div>
</div>`;

export const LABELS = [
    '1. Probleme a tester', '2. Utilisateur concerne', '3. Solutions existantes',
    '4. Hypothese de valeur', '5. Hypothese de croissance', '6. Hypothese de monetisation',
    '7. Description du MVP', '8. Objectif du MVP', '9. Indicateur cle',
    '10. Seuil de succes', '11. Enseignements attendus', '12. Decision strategique'
];
export const TITLE = 'Lean Startup';
export const CONFIG = { totalQuestions: 12, hasNameStep: false };
