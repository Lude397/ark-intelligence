// ===== CONFIGURATION CENTRALISEE =====
const LOGO_URL = "/assets/logo.png";
const CONFIG = { apiUrl: '/api/chat' };

const DOC_NAMES = {
    definition_projet: 'Definition de projet',
    orientation_solution: 'Orientation de solution',
    formulation_solution: 'Formulation de solution',
    design_thinking: 'Design Thinking',
    business_model: 'Business Model Canvas',
    lean_startup: 'Lean Start Up',
    agile: 'Agile'
};

const DOC_FOLDERS = {
    definition_projet: 'Ark Project',
    orientation_solution: 'Ark Project',
    formulation_solution: 'Ark Project',
    design_thinking: 'Ark Business',
    business_model: 'Ark Business',
    lean_startup: 'Ark Business',
    agile: 'Ark Business'
};

function applyLogo() {
    document.querySelectorAll('.app-logo').forEach(img => img.src = LOGO_URL);
}

document.addEventListener('DOMContentLoaded', applyLogo);
