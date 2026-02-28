// ===== INIT SETTINGS PAGE =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadProfileForm();

    // Theme buttons
    document.querySelectorAll('.theme-icon-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // Save profile
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    // Back button
    document.getElementById('settingsBackBtn').addEventListener('click', () => {
        window.location.href = '/';
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('ark_user');
        window.location.href = '/connexion.html';
    });
});

function loadProfileForm() {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData) return;

    const prenomInput = document.getElementById('profilePrenomInput');
    const nomInput = document.getElementById('profileNomInput');
    const phoneInput = document.getElementById('profilePhoneInput');
    const emailInput = document.getElementById('profileEmailInput');
    const typeEl = document.getElementById('profileType');

    if (userData.prenom) prenomInput.value = userData.prenom;
    if (userData.nom) nomInput.value = userData.nom;
    if (userData.telephone) phoneInput.value = userData.telephone;
    if (userData.email) emailInput.value = userData.email;
    if (userData.type_user) {
        typeEl.textContent = userData.type_user === 'Ark Operational Specialist' ? 'Ark Operational Specialist' : 'Porteur de projet';
    }
}

async function saveProfile() {
    const userData = JSON.parse(localStorage.getItem('ark_user')) || {};
    const profileData = {
        prenom: document.getElementById('profilePrenomInput').value.trim(),
        nom: document.getElementById('profileNomInput').value.trim(),
        telephone: document.getElementById('profilePhoneInput').value.trim(),
        email: document.getElementById('profileEmailInput').value.trim()
    };
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'updateUserProfile',
                userId: userData.id,
                ...profileData
            })
        });

        const data = await response.json();
        
        if (data.success) {
            userData.prenom = profileData.prenom;
            userData.nom = profileData.nom;
            userData.telephone = profileData.telephone;
            userData.email = profileData.email;
            localStorage.setItem('ark_user', JSON.stringify(userData));
            
            const btn = document.getElementById('saveProfileBtn');
            btn.textContent = 'Enregistre';
            btn.style.background = '#22c55e';
            btn.style.color = '#fff';
            setTimeout(() => {
                btn.textContent = 'Enregistrer';
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        } else {
            alert('Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion');
    }
}
