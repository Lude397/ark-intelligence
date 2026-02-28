// ==================== INDEX DES PROMPTS ====================
// Centralise tous les exports pour un import unique dans chat.js

import * as definition_projet from './definition_projet.js';
import * as orientation_solution from './orientation_solution.js';
import * as formulation_solution from './formulation_solution.js';
import * as design_thinking from './design_thinking.js';
import * as business_model from './business_model.js';
import * as lean_startup from './lean_startup.js';
import * as agile from './agile.js';

// Templates HTML pour la generation de documents
export const DOCUMENT_PROMPTS = {
    definition_projet: definition_projet.TEMPLATE,
    orientation_solution: orientation_solution.TEMPLATE,
    formulation_solution: formulation_solution.TEMPLATE,
    design_thinking: design_thinking.TEMPLATE,
    business_model: business_model.TEMPLATE,
    lean_startup: lean_startup.TEMPLATE,
    agile: agile.TEMPLATE
};

// Labels pour le filet de securite (ensureDocumentFormat)
export const DOCUMENT_LABELS = {
    definition_projet: definition_projet.LABELS,
    orientation_solution: orientation_solution.LABELS,
    formulation_solution: formulation_solution.LABELS,
    design_thinking: design_thinking.LABELS,
    business_model: business_model.LABELS,
    lean_startup: lean_startup.LABELS,
    agile: agile.LABELS
};

// Titres des documents
export const DOCUMENT_TITLES = {
    definition_projet: definition_projet.TITLE,
    orientation_solution: orientation_solution.TITLE,
    formulation_solution: formulation_solution.TITLE,
    design_thinking: design_thinking.TITLE,
    business_model: business_model.TITLE,
    lean_startup: lean_startup.TITLE,
    agile: agile.TITLE
};

// Config par document (nombre de questions, etape de nom)
export const DOC_CONFIG = {
    definition_projet: definition_projet.CONFIG,
    orientation_solution: orientation_solution.CONFIG,
    formulation_solution: formulation_solution.CONFIG,
    design_thinking: design_thinking.CONFIG,
    business_model: business_model.CONFIG,
    lean_startup: lean_startup.CONFIG,
    agile: agile.CONFIG
};
