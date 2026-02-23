// ===== VERIFICATION CONNEXION =====
const user = localStorage.getItem('ark_user');
if (!user) {
    window.location.href = '/connexion.html';
    throw new Error('Redirect');
}

// ===== CHARGER LE PROFIL DEPUIS SUPABASE =====
async function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) return;
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'getUserProfile',
                userId: userData.id
            })
        });

        const data = await response.json();
        
        if (data.success && data.user) {
            userData.prenom = data.user.prenom;
            userData.nom = data.user.nom;
            userData.telephone = data.user.telephone;
            userData.email = data.user.email;
            userData.type_user = data.user.type_user;
            localStorage.setItem('ark_user', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
}
