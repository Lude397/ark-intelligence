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
    currentDocumentId: null
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

    document.getElementById('myDocsBtnSidebar').addEventListener('click', () => {
        showMyDocuments();
        closeSidebar();
    });

    switchScreen('welcome');
    updatePageTitle(null);
}

// ===== PARTAGE DE DOCUMENTS (avec URL automatique) =====
async function handleShareDocument() {
    if (!state.currentDoc) return;
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        alert('Vous devez être connecté pour partager un document');
        return;
    }

    const fakeDocumentId = `${state.currentDoc.type}_${Date.now()}`;
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'createShareLink',
                documentId: fakeDocumentId,
                userId: userData.id,
                projetNom: state.projetNom
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // URL automatique avec window.location.origin
            const baseUrl = window.location.origin;
            const fullShareUrl = `${baseUrl}${data.shareUrl}`;
            showShareModal(fullShareUrl);
        } else {
            alert('Erreur lors de la création du lien de partage');
        }
    } catch (error) {
        console.error('Erreur création lien:', error);
        alert('Erreur de connexion');
    }
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
    
    if (state.documentCache[docType]) {
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

function showMyDocuments() {
    closeSettingsModal();
    
    const docs = Object.keys(state.documentCache).map(docType => ({
        doc_type: docType,
        projet_nom: state.projetNom || 'Projet en cours',
        contenu: state.documentCache[docType],
        created_at: new Date().toISOString()
    }));
    
    renderMyDocuments(docs);
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
            <div class="doc-card" onclick="openDocFromCache('${doc.doc_type}')">
                <div class="doc-card-header">
                    <div>
                        <div class="doc-card-title">${doc.projet_nom || 'Sans titre'}</div>
                        <div class="doc-card-type">${DOC_NAMES[doc.doc_type] || doc.doc_type}</div>
                    </div>
                    <button class="doc-card-btn" onclick="event.stopPropagation(); openDocFromCache('${doc.doc_type}')">Voir</button>
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

function openDocFromCache(docType) {
    if (state.documentCache[docType]) {
        showDocument(docType, state.documentCache[docType]);
    }
}

function openSettingsModal() { 
    elements.settingsModal.classList.add('visible');
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (userData) {
        const nameInput = document.getElementById('profileNameInput');
        const phoneInput = document.getElementById('profilePhoneInput');
        const emailInput = document.getElementById('profileEmailInput');
        const typeEl = document.getElementById('profileType');
        const avatarEl = document.getElementById('profileAvatar');
        
        if (userData.nom) {
            nameInput.value = userData.nom;
            avatarEl.textContent = userData.nom.charAt(0).toUpperCase();
        }
        if (userData.telephone) phoneInput.value = userData.telephone;
        if (userData.email) emailInput.value = userData.email;
        if (userData.type_user) {
            typeEl.textContent = userData.type_user === 'Ark Operational Specialist' ? 'Ark Operational Specialist' : 'Porteur de projet';
        }
    }
}

function closeSettingsModal() { 
    elements.settingsModal.classList.remove('visible'); 
}

function saveProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const phoneInput = document.getElementById('profilePhoneInput');
    const emailInput = document.getElementById('profileEmailInput');
    const avatarEl = document.getElementById('profileAvatar');
    
    const userData = JSON.parse(localStorage.getItem('ark_user')) || {};
    userData.nom = nameInput.value.trim();
    userData.telephone = phoneInput.value.trim();
    userData.email = emailInput.value.trim();
    
    localStorage.setItem('ark_user', JSON.stringify(userData));
    
    if (userData.nom) {
        avatarEl.textContent = userData.nom.charAt(0).toUpperCase();
    }
    
    const btn = document.getElementById('saveProfileBtn');
    btn.textContent = 'Enregistré ✓';
    btn.style.background = '#22c55e';
    btn.style.color = '#fff';
    setTimeout(() => {
        btn.textContent = 'Enregistrer';
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
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
            addMessage(cleanResponse, 'ai', true);
            disableChatInput();
            await delay(500);
            addMessage('Je vais générer votre document...', 'ai', false);
            showTypingIndicator();
            await generateDocumentsInBackground();
            hideTypingIndicator();
            enableDocuments();
            addMessage('✓ Les documents sont prêts ! Vous pouvez les consulter depuis le menu.', 'ai', false);
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
    elements.chatInput.placeholder = 'Cadrage terminé — Consultez vos documents';
    elements.chatInput.style.opacity = '0.6';
    elements.chatSend.style.opacity = '0.6';
}

async function generateDocumentsInBackground() {
    const mainDocs = ['definition_projet', 'orientation_solution', 'formulation_solution'];
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
                // Remplacer PLACEHOLDER_BASE_URL par l'URL réelle
                const baseUrl = window.location.origin;
                state.documentCache[docType] = data.document.replace(/PLACEHOLDER_BASE_URL/g, baseUrl);
            }
        } catch (error) {
            console.error(`Erreur génération ${docType}:`, error);
        }
    }
}

function enableDocuments() {
    state.documentsReady = true;
    document.querySelectorAll('.doc-item').forEach(item => {
        const docType = item.dataset.doc;
        if (['definition_projet', 'orientation_solution', 'formulation_solution'].includes(docType)) {
            item.classList.remove('disabled');
        }
    });
}

async function generateDocument(docType) {
    if (state.documentCache[docType]) {
        showDocument(docType, state.documentCache[docType]);
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
            // Remplacer PLACEHOLDER_BASE_URL par l'URL réelle
            const baseUrl = window.location.origin;
            state.documentCache[docType] = data.document.replace(/PLACEHOLDER_BASE_URL/g, baseUrl);
            showDocument(docType, state.documentCache[docType]);
        } else {
            alert('Erreur lors de la génération');
            switchScreen(state.currentScreen);
        }
    } catch (error) {
        alert('Erreur de connexion');
        switchScreen(state.currentScreen);
    }
}

function showDocument(docType, content) {
    state.currentDoc = { type: docType, content };
    elements.documentTitle.textContent = DOC_NAMES[docType] || docType;
    elements.documentBody.innerHTML = markdownToHtml(content);
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
    if (state.currentDoc) {
        const cleanContent = cleanMarkdownForWhatsApp(state.currentDoc.content);
        const text = encodeURIComponent(`*${DOC_NAMES[state.currentDoc.type]}*\n\n${cleanContent}\n\n---\nGénéré par Ark Intelligence`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
}

init();
