// ===== CENTRALISATION DU LOGO =====
const LOGO_URL = "/assets/logo.png";
 
function applyLogo() {
    document.querySelectorAll('.app-logo').forEach(img => img.src = LOGO_URL);
}
applyLogo();

// ===== VÉRIFICATION CONNEXION =====
const user = localStorage.getItem('ark_user');
if (!user) {
    window.location.href = 'connexion.html';
    throw new Error('Redirect');
}

const CONFIG = { apiUrl: '/api/chat' };

const state = {
    history: [],
    documentsReady: false,
    documentCache: {},
    currentDoc: null,
    currentDocType: null,
    currentTheme: localStorage.getItem('ark-theme') || 'vert',
    cadrageComplete: false,
    projetNom: null,
    currentScreen: 'welcome',
    currentDocumentId: null,
    allDocuments: []
};

const elements = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatScreen: document.getElementById('chatScreen'),
    mydocsScreen: document.getElementById('mydocsScreen'),
    loadingScreen: document.getElementById('loadingScreen'),
    documentScreen: document.getElementById('documentScreen'),
    welcomeInput: document.getElementById('welcomeInput'),
    welcomeSend: document.getElementById('welcomeSend'),
    welcomeInputContainer: document.getElementById('welcomeInputContainer'),
    welcomePageTitle: document.getElementById('welcomePageTitle'),
    welcomeMessage: document.getElementById('welcomeMessage'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSend: document.getElementById('chatSend'),
    chatTitle: document.getElementById('chatTitle'),
    chatSubtitle: document.getElementById('chatSubtitle'),
    newChatBtnMobile: document.getElementById('newChatBtnMobile'),
    documentBack: document.getElementById('documentBack'),
    documentTitle: document.getElementById('documentTitle'),
    documentBody: document.getElementById('documentBody'),
    copyDoc: document.getElementById('copyDoc'),
    shareDoc: document.getElementById('shareDoc'),
    shareWhatsApp: document.getElementById('shareWhatsApp'),
    shareEmail: document.getElementById('shareEmail'),
    mydocsList: document.getElementById('mydocsList'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    settingsModalClose: document.getElementById('settingsModalClose'),
    shareModal: document.getElementById('shareModal'),
    shareModalClose: document.getElementById('shareModalClose'),
    shareLinkInput: document.getElementById('shareLinkInput'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    statsModal: document.getElementById('statsModal'),
    statsModalClose: document.getElementById('statsModalClose'),
    statsCount: document.getElementById('statsCount'),
    statsList: document.getElementById('statsList'),
    homeBtn: document.getElementById('homeBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    hamburgerBtnWelcome: document.getElementById('hamburgerBtnWelcome'),
    hamburgerBtnChat: document.getElementById('hamburgerBtnChat'),
    hamburgerBtnMyDocs: document.getElementById('hamburgerBtnMyDocs'),
    newProjectBtnWelcome: document.getElementById('newProjectBtnWelcome')
};

const DOC_NAMES = {
    definition_projet: 'Définition de projet',
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
            // Mettre à jour localStorage avec les données fraîches
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

// ===== HAMBURGER MENU =====
function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.sidebarOverlay.classList.toggle('active');
    
    [elements.hamburgerBtnWelcome, elements.hamburgerBtnChat, elements.hamburgerBtnMyDocs].forEach(btn => {
        if (btn) btn.classList.toggle('active');
    });
}

function closeSidebar() {
    elements.sidebar.classList.remove('active');
    elements.sidebarOverlay.classList.remove('active');
    [elements.hamburgerBtnWelcome, elements.hamburgerBtnChat, elements.hamburgerBtnMyDocs].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
}

if (elements.hamburgerBtnWelcome) elements.hamburgerBtnWelcome.addEventListener('click', toggleSidebar);
if (elements.hamburgerBtnChat) elements.hamburgerBtnChat.addEventListener('click', toggleSidebar);
if (elements.hamburgerBtnMyDocs) elements.hamburgerBtnMyDocs.addEventListener('click', toggleSidebar);

elements.sidebarOverlay.addEventListener('click', closeSidebar);

if (elements.newProjectBtnWelcome) {
    elements.newProjectBtnWelcome.addEventListener('click', () => {
        closeSidebar();
        goToHome();
    });
}

// ===== FONCTION POUR METTRE À JOUR LE TITRE =====
function updatePageTitle(docType) {
    const welcomeStaticContent = document.querySelector('.welcome-static-content');
    
    if (docType === null) {
        elements.welcomePageTitle.textContent = 'Accueil';
        if (elements.welcomeInputContainer) {
            elements.welcomeInputContainer.classList.remove('visible');
        }
        if (welcomeStaticContent) {
            welcomeStaticContent.style.display = '';
        }
        if (elements.welcomeMessage) {
            elements.welcomeMessage.textContent = 'En 5 minutes, obtenez un document professionnel prêt à être partagé';
        }
    } else {
        elements.welcomePageTitle.textContent = DOC_NAMES[docType];
        elements.chatTitle.textContent = DOC_NAMES[docType];
        elements.chatSubtitle.textContent = DOC_FOLDERS[docType];
        if (elements.welcomeInputContainer) {
            elements.welcomeInputContainer.classList.add('visible');
        }
        if (welcomeStaticContent) {
            welcomeStaticContent.style.display = 'none';
        }
        if (elements.welcomeMessage) {
            elements.welcomeMessage.textContent = '';
        }
    }
}

function init() {
    applyTheme(state.currentTheme);
    loadUserProfile(); // Charger le profil depuis Supabase au démarrage

    if (elements.welcomeSend) {
        elements.welcomeSend.addEventListener('click', handleWelcomeSend);
    }
    
    if (elements.welcomeInput) {
        elements.welcomeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWelcomeSend(); }
        });
        elements.welcomeInput.addEventListener('input', () => autoResize(elements.welcomeInput, 200));
    }

    elements.chatSend.addEventListener('click', handleChatSend);
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
    });

    elements.chatInput.addEventListener('input', () => autoResize(elements.chatInput, 150));

    elements.newChatBtnMobile.addEventListener('click', goToHome);
    elements.documentBack.addEventListener('click', () => switchScreen('mydocs'));
    elements.copyDoc.addEventListener('click', copyDocument);
    elements.shareDoc.addEventListener('click', handleShareDocument);
    elements.shareWhatsApp.addEventListener('click', shareWhatsApp);
    
    if (elements.shareEmail) {
        elements.shareEmail.addEventListener('click', shareEmail);
    }

    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.settingsModalClose.addEventListener('click', closeSettingsModal);
    elements.settingsModal.addEventListener('click', (e) => { if (e.target === elements.settingsModal) closeSettingsModal(); });

    elements.shareModalClose.addEventListener('click', closeShareModal);
    elements.shareModal.addEventListener('click', (e) => { if (e.target === elements.shareModal) closeShareModal(); });
    elements.copyLinkBtn.addEventListener('click', copyShareLink);

    elements.statsModalClose.addEventListener('click', closeStatsModal);
    elements.statsModal.addEventListener('click', (e) => { if (e.target === elements.statsModal) closeStatsModal(); });

    document.querySelectorAll('.theme-icon-btn').forEach(btn => {
        btn.addEventListener('click', () => { applyTheme(btn.dataset.theme); });
    });

    document.querySelectorAll('.doc-item').forEach(item => {
        item.addEventListener('click', () => { 
            if (!item.classList.contains('disabled')) {
                selectDocument(item.dataset.doc);
                closeSidebar();
            }
        });
    });

    elements.homeBtn.addEventListener('click', () => {
        goToHome();
        closeSidebar();
    });

    document.getElementById('logoutBtnModal').addEventListener('click', () => {
        localStorage.removeItem('ark_user');
        window.location.href = 'connexion.html';
    });

    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    document.getElementById('docMenuBtn').addEventListener('click', toggleDocMenu);
    document.getElementById('deleteDoc').addEventListener('click', deleteCurrentDocument);

    document.getElementById('myDocsBtnSidebar').addEventListener('click', () => {
        showMyDocuments();
        closeSidebar();
    });

    switchScreen('welcome');
    updatePageTitle(null);
}

// ===== PARTAGE DE DOCUMENTS (avec URL automatique + valeur par défaut) =====
async function handleShareDocument() {
    if (!state.currentDoc) return;
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        alert('Vous devez être connecté pour partager un document');
        return;
    }

    // Vérifier que le nom du projet existe
    if (!state.projetNom || state.projetNom === 'mon-projet') {
        alert('Nom du projet manquant. Veuillez générer un nouveau document.');
        return;
    }

    // Fonction de normalisation (identique à l'API)
    const normalizeString = (str) => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/['']/g, ' ')
            .replace(/[–—]/g, '-')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    };

    // Générer l'URL au format /ark/prenom-nom/nom-du-projet
    const prenom = normalizeString(userData.prenom || '');
    const nom = normalizeString(userData.nom || '');
    const projet = normalizeString(state.projetNom);
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/ark/${prenom}-${nom}/${projet}`;
    
    console.log('📤 Lien de partage généré:', shareUrl);
    console.log('📊 Données:', { prenom, nom, projet, projetNomOriginal: state.projetNom });
    
    showShareModal(shareUrl);
}

function showShareModal(shareUrl) {
    elements.shareLinkInput.value = shareUrl;
    elements.shareModal.classList.add('visible');
}

function closeShareModal() {
    elements.shareModal.classList.remove('visible');
}

function copyShareLink() {
    elements.shareLinkInput.select();
    navigator.clipboard.writeText(elements.shareLinkInput.value);
    elements.copyLinkBtn.textContent = 'Copié !';
    setTimeout(() => {
        elements.copyLinkBtn.textContent = 'Copier';
    }, 2000);
}

// ===== STATISTIQUES =====
async function showDocumentStats(docType) {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) return;

    const fakeDocumentId = `${docType}_${Date.now()}`;
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'getStats',
                documentId: fakeDocumentId,
                userId: userData.id
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showStatsModal(data);
        }
    } catch (error) {
        console.error('Erreur récupération stats:', error);
    }
}

function showStatsModal(stats) {
    elements.statsCount.textContent = stats.totalViews || 0;
    
    if (!stats.views || stats.views.length === 0) {
        elements.statsList.innerHTML = '<div class="stats-empty">Aucune consultation pour le moment</div>';
    } else {
        let html = '';
        stats.views.forEach(view => {
            const date = new Date(view.viewed_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            html += `
                <div class="stats-item">
                    <div class="stats-item-name">${view.viewer_name}</div>
                    <div class="stats-item-date">${date}</div>
                </div>
            `;
        });
        elements.statsList.innerHTML = html;
    }
    
    elements.statsModal.classList.add('visible');
}

function closeStatsModal() {
    elements.statsModal.classList.remove('visible');
}

// ===== FONCTIONS EXISTANTES =====
function goToHome() {
    state.history = [];
    state.documentsReady = false;
    state.documentCache = {};
    state.currentDoc = null;
    state.currentDocType = null;
    state.cadrageComplete = false;
    state.projetNom = null;
    state.currentDocumentId = null;
    elements.chatMessages.innerHTML = '';
    
    if (elements.welcomeInput) {
        elements.welcomeInput.value = '';
    }
    
    elements.chatInput.disabled = false;
    elements.chatSend.disabled = false;
    elements.chatInput.placeholder = 'Écrivez votre réponse...';
    elements.chatInput.style.opacity = '1';
    elements.chatSend.style.opacity = '1';
    
    document.querySelectorAll('.doc-item').forEach(item => {
        item.classList.remove('active');
    });
    
    switchScreen('welcome');
    updatePageTitle(null);
}

function selectDocument(docType) {
    state.currentDocType = docType;
    
    document.querySelectorAll('.doc-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.doc === docType) {
            item.classList.add('active');
        }
    });
    
    updatePageTitle(docType);
    
    // Si on a un document en cache ET qu'on n'est PAS en train de cadrer
    // → On va à l'accueil pour commencer un nouveau projet
    if (state.documentCache[docType] && !state.cadrageComplete) {
        switchScreen('welcome');
        if (elements.welcomeInput) {
            elements.welcomeInput.focus();
        }
        return;
    }
    
    // Si on a terminé le cadrage, on peut afficher le document
    if (state.documentCache[docType] && state.cadrageComplete) {
        showDocument(docType, state.documentCache[docType]);
        return;
    }
    
    if (state.history.length === 0) {
        switchScreen('welcome');
        if (elements.welcomeInput) {
            elements.welcomeInput.focus();
        }
        return;
    }
    
    generateDocument(docType);
}

async function showMyDocuments() {
    closeSettingsModal();
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        switchScreen('mydocs');
        renderMyDocuments([]);
        return;
    }
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'getUserDocuments',
                userId: userData.id
            })
        });

        const data = await response.json();
        
        if (data.success && data.documents) {
            state.allDocuments = data.documents;
            renderMyDocuments(data.documents);
        } else {
            state.allDocuments = [];
            renderMyDocuments([]);
        }
    } catch (error) {
        console.error('Erreur récupération documents:', error);
        state.allDocuments = [];
        renderMyDocuments([]);
    }
    
    switchScreen('mydocs');
}

function renderMyDocuments(docs) {
    if (docs.length === 0) {
        elements.mydocsList.innerHTML = `
            <div class="mydocs-empty">
                <div>Vous n'avez pas encore de documents générés</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    docs.forEach(doc => {
        const date = new Date(doc.created_at).toLocaleDateString('fr-FR');
        html += `
            <div class="doc-card" onclick="openDocFromCache('${doc.id}')">
                <div class="doc-card-header">
                    <div>
                        <div class="doc-card-title">${doc.projet_nom || 'Sans titre'}</div>
                        <div class="doc-card-type">${DOC_NAMES[doc.doc_type] || doc.doc_type}</div>
                    </div>
                </div>
                <div class="doc-card-meta">
                    <div class="doc-card-meta-item">
                        <span>📅</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>
        `;
    });
    elements.mydocsList.innerHTML = html;
}

function openDocFromCache(documentId) {
    // D'abord, chercher dans la liste de tous les documents (depuis Supabase)
    if (state.allDocuments && state.allDocuments.length > 0) {
        const doc = state.allDocuments.find(d => d.id === documentId);
        if (doc) {
            // ✅ IMPORTANT : Mettre à jour state.projetNom pour le partage
            state.projetNom = doc.projet_nom;
            
            showDocument(doc.doc_type, doc.contenu, {
                projetNom: doc.projet_nom,
                createdAt: doc.created_at
            });
            return;
        }
    }
    
    // Sinon, chercher dans le cache de la session actuelle (par type de document)
    if (state.documentCache[documentId]) {
        showDocument(documentId, state.documentCache[documentId], {
            projetNom: state.projetNom,
            createdAt: new Date().toISOString()
        });
    }
}

function openSettingsModal() { 
    elements.settingsModal.classList.add('visible');
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (userData) {
        const prenomInput = document.getElementById('profilePrenomInput');
        const nomInput = document.getElementById('profileNomInput');
        const phoneInput = document.getElementById('profilePhoneInput');
        const emailInput = document.getElementById('profileEmailInput');
        const typeEl = document.getElementById('profileType');
        const avatarEl = document.getElementById('profileAvatar');
        
        if (userData.prenom) prenomInput.value = userData.prenom;
        if (userData.nom) nomInput.value = userData.nom;
        if (userData.telephone) phoneInput.value = userData.telephone;
        if (userData.email) emailInput.value = userData.email;
        if (userData.type_user) {
            typeEl.textContent = userData.type_user === 'Ark Operational Specialist' ? 'Ark Operational Specialist' : 'Porteur de projet';
        }
        
        // Avatar vide
        avatarEl.textContent = '';
    }
}

function closeSettingsModal() { 
    elements.settingsModal.classList.remove('visible'); 
}

async function saveProfile() {
    const prenomInput = document.getElementById('profilePrenomInput');
    const nomInput = document.getElementById('profileNomInput');
    const phoneInput = document.getElementById('profilePhoneInput');
    const emailInput = document.getElementById('profileEmailInput');
    const avatarEl = document.getElementById('profileAvatar');
    
    const userData = JSON.parse(localStorage.getItem('ark_user')) || {};
    const profileData = {
        prenom: prenomInput.value.trim(),
        nom: nomInput.value.trim(),
        telephone: phoneInput.value.trim(),
        email: emailInput.value.trim()
    };
    
    // Envoyer à Supabase
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
            // Mettre à jour localStorage
            userData.prenom = profileData.prenom;
            userData.nom = profileData.nom;
            userData.telephone = profileData.telephone;
            userData.email = profileData.email;
            localStorage.setItem('ark_user', JSON.stringify(userData));
            
            // Avatar vide
            avatarEl.textContent = '';
            
            const btn = document.getElementById('saveProfileBtn');
            btn.textContent = 'Enregistré ✓';
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

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    state.currentTheme = theme;
    localStorage.setItem('ark-theme', theme);
    document.querySelectorAll('.theme-icon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function autoResize(textarea, maxHeight) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
}

function switchScreen(screen) {
    elements.welcomeScreen.classList.add('hidden');
    elements.chatScreen.classList.remove('visible');
    elements.mydocsScreen.classList.remove('visible');
    elements.loadingScreen.classList.remove('visible');
    elements.documentScreen.classList.remove('visible');

    if (screen === 'welcome') {
        elements.welcomeScreen.classList.remove('hidden');
        state.currentScreen = 'welcome';
    } else if (screen === 'chat') {
        elements.chatScreen.classList.add('visible');
        state.currentScreen = 'chat';
    } else if (screen === 'mydocs') {
        elements.mydocsScreen.classList.add('visible');
        state.currentScreen = 'mydocs';
    } else if (screen === 'loading') {
        elements.loadingScreen.classList.add('visible');
        state.currentScreen = 'loading';
    } else if (screen === 'document') {
        elements.documentScreen.classList.add('visible');
        state.currentScreen = 'document';
    }
}

async function handleWelcomeSend() {
    if (!elements.welcomeInput || !state.currentDocType) return;
    
    const message = elements.welcomeInput.value.trim();
    if (!message) return;
    
    state.projetNom = message.substring(0, 100);
    switchScreen('chat');
    addMessage(message, 'user');
    elements.welcomeInput.value = '';
    elements.welcomeInput.style.height = 'auto';
    await sendToAPI(message);
}

async function handleChatSend() {
    if (state.cadrageComplete || elements.chatInput.disabled) return;
    const message = elements.chatInput.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    elements.chatInput.value = '';
    elements.chatInput.style.height = 'auto';
    await sendToAPI(message);
}

function addMessage(content, type, saveToHistory = true) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = `<div class="message-content">${formatMessage(content)}</div>`;
    elements.chatMessages.appendChild(div);
    scrollToBottom();
    if (saveToHistory) state.history.push({ type, content });
}

function formatMessage(text) {
    let html = text.replace(/\n/g, '<br>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return html;
}

function scrollToBottom() {
    requestAnimationFrame(() => { elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight; });
}

function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typingIndicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    elements.chatMessages.appendChild(typing);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

async function sendToAPI(message) {
    showTypingIndicator();
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'chat', message, history: state.history.slice(0, -1) })
        });
        hideTypingIndicator();
        const data = await response.json();

        if (data.action === 'generate') {
            const cleanResponse = data.response.replace('[GENERATE]', '').trim();
            
            // Extraire le nom du projet depuis la réponse
            const nomMatch = cleanResponse.match(/\*\*Nom du projet\s*:\s*(.+?)\*\*/);
            if (nomMatch && nomMatch[1]) {
                state.projetNom = nomMatch[1].trim();
            }
            
            addMessage(cleanResponse, 'ai', true);
            disableChatInput();
            await delay(500);
            addMessage('Je vais générer votre document...', 'ai', false);
            showTypingIndicator();
            await generateDocumentsInBackground();
            hideTypingIndicator();
            enableDocuments();
            addMessage('✓ Le document est prêt ! Vous pouvez le consulter depuis le menu.', 'ai', false);
            showCadrageComplete();
        } else {
            addMessage(data.response, 'ai', true);
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Erreur de connexion. Réessayez.', 'ai', false);
    }
}

function delay(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

function disableChatInput() {
    elements.chatInput.disabled = true;
    elements.chatSend.disabled = true;
    elements.chatInput.placeholder = 'Cadrage en cours...';
}

function showCadrageComplete() {
    state.cadrageComplete = true;
    elements.chatInput.disabled = true;
    elements.chatSend.disabled = true;
    elements.chatInput.placeholder = 'Cadrage terminé — Consultez votre document';
    elements.chatInput.style.opacity = '0.6';
    elements.chatSend.style.opacity = '0.6';
}

async function generateDocumentsInBackground() {
    const mainDocs = ['definition_projet'];
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    const userId = userData ? userData.id : null;
    
    for (const docType of mainDocs) {
        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    mode: 'generate', 
                    docType, 
                    history: state.history,
                    userId: userId,
                    projetNom: state.projetNom
                })
            });
            const data = await response.json();
            if (data.success) {
                const baseUrl = window.location.origin;
                state.documentCache[docType] = data.document.replace(/PLACEHOLDER_BASE_URL/g, baseUrl);
            }
        } catch (error) {
            console.error(`Erreur génération ${docType}:`, error);
        }
    }
    
    // Recharger la liste des documents depuis Supabase pour inclure le nouveau document
    if (userId) {
        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'getUserDocuments',
                    userId: userId
                })
            });
            const data = await response.json();
            if (data.success && data.documents) {
                state.allDocuments = data.documents;
            }
        } catch (error) {
            console.error('Erreur rechargement documents:', error);
        }
    }
}

function enableDocuments() {
    state.documentsReady = true;
    document.querySelectorAll('.doc-item').forEach(item => {
        const docType = item.dataset.doc;
        if (['definition_projet'].includes(docType)) {
            item.classList.remove('disabled');
        }
    });
}

async function generateDocument(docType) {
    if (state.documentCache[docType]) {
        showDocument(docType, state.documentCache[docType], {
            projetNom: state.projetNom,
            createdAt: new Date().toISOString()
        });
        return;
    }
    
    switchScreen('loading');
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    const userId = userData ? userData.id : null;
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'generate', 
                docType, 
                history: state.history,
                userId: userId,
                projetNom: state.projetNom
            })
        });
        const data = await response.json();
        if (data.success) {
            const baseUrl = window.location.origin;
            state.documentCache[docType] = data.document.replace(/PLACEHOLDER_BASE_URL/g, baseUrl);
            showDocument(docType, state.documentCache[docType], {
                projetNom: state.projetNom,
                createdAt: new Date().toISOString()
            });
        } else {
            alert('Erreur lors de la génération');
            switchScreen(state.currentScreen);
        }
    } catch (error) {
        alert('Erreur de connexion');
        switchScreen(state.currentScreen);
    }
}

function showDocument(docType, content, metadata = {}) {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    let ownerName = 'Utilisateur Ark';
    
    if (userData) {
        const prenom = userData.prenom || '';
        const nom = userData.nom || '';
        ownerName = `${prenom} ${nom}`.trim() || 'Utilisateur Ark';
    }
    
    const projectName = metadata.projetNom || state.projetNom || 'Projet sans nom';
    
    let formattedDate = 'À définir';
    if (metadata.createdAt) {
        const date = new Date(metadata.createdAt);
        formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    let updatedContent = content
        .replace(/\{\{OWNER_NAME\}\}/g, ownerName)
        .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
        .replace(/\{\{DATE\}\}/g, formattedDate)
        .replace(/arkintelligence\.vercel\.app/g, 'www.arkintelligence.africa')
        .replace(/https:\/\/arkintelligence\.vercel\.app/g, 'https://www.arkintelligence.africa');
    
    state.currentDoc = { type: docType, content: updatedContent };
    elements.documentTitle.textContent = DOC_NAMES[docType] || docType;
    
    const trimmedContent = updatedContent.trim();
    if (trimmedContent.startsWith('<!DOCTYPE html>') || 
        trimmedContent.startsWith('<html') ||
        trimmedContent.includes('<table>')) {
        elements.documentBody.innerHTML = updatedContent;
    } else {
        elements.documentBody.innerHTML = markdownToHtml(updatedContent);
    }
    
    switchScreen('document');
}

function markdownToHtml(md) {
    let html = md;
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map(c => c.trim());
        if (cells.every(c => /^[-:]+$/.test(c))) return '<!--separator-->';
        const tag = 'td';
        return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });
    html = html.replace(/<!--separator-->/g, '');
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^(?!<[hultro])(.*$)/gm, (match) => match.trim() ? `<p>${match}</p>` : '');
    html = html.replace(/<p><\/p>/g, '');
    return html;
}

function copyDocument() {
    if (state.currentDoc) {
        navigator.clipboard.writeText(state.currentDoc.content);
        elements.copyDoc.textContent = 'Copié !';
        setTimeout(() => elements.copyDoc.textContent = 'Copier', 2000);
    }
}

function toggleDocMenu() {
    const menu = document.getElementById('docDropdownMenu');
    if (menu) {
        menu.classList.toggle('visible');
    }
}

async function deleteCurrentDocument() {
    if (!state.currentDoc) return;
    
    const menu = document.getElementById('docDropdownMenu');
    if (menu) menu.classList.remove('visible');
    
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        alert('Vous devez être connecté pour supprimer un document');
        return;
    }
    
    // Trouver l'ID du document actuel
    let documentId = null;
    if (state.allDocuments && state.allDocuments.length > 0) {
        const doc = state.allDocuments.find(d => 
            d.doc_type === state.currentDoc.type && 
            d.contenu === state.currentDoc.content
        );
        if (doc) documentId = doc.id;
    }
    
    if (!documentId) {
        alert('Impossible de supprimer ce document');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'deleteDocument',
                documentId: documentId,
                userId: userData.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Retirer le document de state.allDocuments
            state.allDocuments = state.allDocuments.filter(d => d.id !== documentId);
            
            // Retourner à "Mes documents"
            showMyDocuments();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur de connexion');
    }
}

function cleanMarkdownForWhatsApp(text) {
    let clean = text;
    clean = clean.replace(/^###\s*/gm, '').replace(/^##\s*/gm, '').replace(/^#\s*/gm, '');
    clean = clean.replace(/^---+$/gm, '');
    clean = clean.replace(/^\*\s+/gm, '• ').replace(/^-\s+/gm, '• ');
    clean = clean.replace(/^\|[-:|\s]+\|$/gm, '');
    clean = clean.replace(/^\|(.+)\|$/gm, (match, content) => content.split('|').map(c => c.trim()).filter(c => c).join(' | '));
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    return clean.trim();
}

function shareWhatsApp() {
    const shareUrl = elements.shareLinkInput.value;
    if (shareUrl && state.currentDoc) {
        const message = `Découvrez mon projet : ${DOC_NAMES[state.currentDoc.type]}\n\n${shareUrl}\n\nGénéré par Ark Intelligence`;
        const text = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
}

function shareEmail() {
    const shareUrl = elements.shareLinkInput.value;
    if (shareUrl && state.currentDoc) {
        const subject = encodeURIComponent(`Projet : ${DOC_NAMES[state.currentDoc.type]}`);
        const body = encodeURIComponent(`Bonjour,\n\nDécouvrez mon projet "${state.projetNom || 'Mon projet'}" :\n\n${shareUrl}\n\nDocument généré par Ark Intelligence`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
}

init();
