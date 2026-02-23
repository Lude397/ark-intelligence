// ===== GESTION DES THEMES =====
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('ark-theme', theme);
    document.querySelectorAll('.theme-icon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Appliquer le theme sauvegarde au chargement
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('ark-theme') || 'light';
    applyTheme(savedTheme);
});
