// FICHIER : shared/js/config.js

const LOGO_URL = "/assets/logo.png";
const CONFIG = { apiUrl: '/api/chat' };

window.ENV = {
    SUPABASE_URL: 'https://ehaxnltgapcfxhwpqhyb.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYXhubHRnYXBjZnhod3BxaHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDg1NjksImV4cCI6MjA4MjkyNDU2OX0.-XLe5c2sgzGxv9Olc13Lu3S0hTHjSbs2brbvVC556Ec'
};

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
