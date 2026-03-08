// ===== STATE =====
const state = {
    history: [],
    documentCache: {},
    currentDoc: null,
    cadrageComplete: false,
    projetNom: null,
    definitionData: null
};

// ===== ELEMENTS =====
const el = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatScreen: document.getElementById('chatScreen'),
    loadingScreen: document.getElementById('loadingScreen'),
    documentScreen: document.getElementById('documentScreen'),
    welcomeInput: document.getElementById('welcomeInput'),
    welcomeSend: document.getElementById('welcomeSend'),
    welcomeSubtitle: document.getElementById('welcomeSubtitle'),
    welcomeInputContainer: document.getElementById('welcomeInputContainer'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSend: document.getElementById('chatSend'),
    documentBack: document.getElementById('documentBack'),
    documentTitle: document.getElementById('documentTitle'),
    documentBody: document.getElementById('documentBody'),
    copyDoc: document.getElementById('copyDoc'),
    shareDoc: document.getElementById('shareDoc'),
    shareWhatsApp: document.getElementById('shareWhatsApp'),
    shareEmail: document.getElementById('shareEmail'),
    shareModal: document.getElementById('shareModal'),
    shareModalClose: document.getElementById('shareModalClose'),
    shareLinkInput: document.getElementById('shareLinkInput'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    newChatBtnMobile: document.getElementById('newChatBtnMobile'),
    docMenuBtn: document.getElementById('docMenuBtn'),
    printDoc: document.getElementById('printDoc'),
    deleteDoc: document.getElementById('deleteDoc')
};

// ===== SCREEN MANAGEMENT =====
function switchScreen(screen) {
    el.welcomeScreen.classList.add('hidden');
    el.chatScreen.classList.remove('visible');
    el.loadingScreen.classList.remove('visible');
    el.documentScreen.classList.remove('visible');

    if (screen === 'welcome') {
        el.welcomeScreen.classList.remove('hidden');
    } else if (screen === 'chat') {
        el.chatScreen.classList.add('visible');
    } else if (screen === 'loading') {
        el.loadingScreen.classList.add('visible');
    } else if (screen === 'document') {
        el.documentScreen.classList.add('visible');
    }
}

// ===== CHECK PREREQUISITE: DEFINITION DE PROJET =====
async function checkDefinitionExists() {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        el.welcomeSubtitle.textContent = 'Vous devez etre connecte pour acceder a cette phase.';
        return false;
    }

    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'getUserDocuments', userId: userData.id })
        });
        const data = await response.json();

        if (data.success && data.documents) {
            const definitions = data.documents.filter(d => d.doc_type === 'definition_projet');
            if (definitions.length > 0) {
                return definitions;
            }
        }
    } catch (error) {
        console.error('Erreur verification definition:', error);
    }

    el.welcomeSubtitle.textContent = 'Vous devez d\'abord completer une Definition de projet avant de passer a l\'Orientation de solution.';
    el.welcomeSubtitle.style.color = '#dc2626';
    return false;
}

// ===== LOAD PROJECTS LIST =====
async function loadProjects() {
    const definitions = await checkDefinitionExists();
    if (!definitions) return;

    if (definitions.length === 1) {
        state.projetNom = definitions[0].projet_nom;
        state.definitionData = definitions[0].contenu;
        el.welcomeSubtitle.textContent = 'Projet : ' + state.projetNom;
        el.welcomeInputContainer.classList.add('visible');
        el.welcomeInput.value = state.projetNom;
        el.welcomeInput.style.display = 'none';
        el.welcomeSend.textContent = 'Commencer l\'orientation';
    } else {
        el.welcomeSubtitle.textContent = 'Selectionnez le projet a orienter :';
        el.welcomeInputContainer.classList.add('visible');
        
        const selectHtml = document.createElement('div');
        selectHtml.style.cssText = 'width:100%;max-width:600px;display:flex;flex-direction:column;gap:8px;margin-bottom:16px;';
        
        definitions.forEach((def) => {
            const btn = document.createElement('button');
            btn.textContent = def.projet_nom;
            btn.style.cssText = 'padding:14px 20px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;color:var(--text-primary);font-size:15px;cursor:pointer;text-align:left;transition:all 0.2s;';
            btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--bg-tertiary)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'var(--bg-secondary)'; });
            btn.addEventListener('click', () => {
                state.projetNom = def.projet_nom;
                state.definitionData = def.contenu;
                startOrientation();
            });
            selectHtml.appendChild(btn);
        });

        el.welcomeInput.style.display = 'none';
        el.welcomeSend.style.display = 'none';
        el.welcomeInputContainer.insertBefore(selectHtml, el.welcomeInput);
    }
}

// ===== START ORIENTATION =====
function startOrientation() {
    switchScreen('chat');
    
    const contextMessage = 'Je souhaite faire l\'orientation de solution pour mon projet "' + state.projetNom + '". Voici la definition de projet validee :\n\n' + extractDefinitionSummary(state.definitionData);
    
    addMessage('Orientation de solution pour : ' + state.projetNom, 'user');
    sendToAPI(contextMessage);
}

// ===== EXTRACT KEY DATA FROM DEFINITION =====
function extractDefinitionSummary(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const cells = tempDiv.querySelectorAll('.content-cell');
    const labels = tempDiv.querySelectorAll('.label-cell');
    
    let summary = '';
    labels.forEach((label, index) => {
        if (cells[index]) {
            summary += label.textContent.trim() + ' : ' + cells[index].textContent.trim() + '\n';
        }
    });
    
    if (!summary) {
        summary = tempDiv.textContent || tempDiv.innerText || htmlContent;
    }
    
    return summary;
}

// ===== WELCOME SEND =====
async function handleWelcomeSend() {
    if (state.projetNom && state.definitionData) {
        startOrientation();
    }
}

// ===== CHAT SEND =====
async function handleChatSend() {
    if (state.cadrageComplete || el.chatInput.disabled) return;
    const message = el.chatInput.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    el.chatInput.value = '';
    el.chatInput.style.height = 'auto';
    await sendToAPI(message);
}

// ===== MESSAGES =====
function addMessage(content, type, saveToHistory = true) {
    const div = document.createElement('div');
    div.className = 'message ' + type;
    div.innerHTML = '<div class="message-content">' + formatMessage(content) + '</div>';
    el.chatMessages.appendChild(div);
    if (type === 'ai' && saveToHistory) addFeedbackThumbs(div);
    scrollToBottom();
    if (saveToHistory) state.history.push({ type, content });
}

function formatMessage(text) {
    let html = text.replace(/\n/g, '<br>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return html;
}

function scrollToBottom() {
    requestAnimationFrame(() => { el.chatMessages.scrollTop = el.chatMessages.scrollHeight; });
}

function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typingIndicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    el.chatMessages.appendChild(typing);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// ===== API =====
async function sendToAPI(message) {
    showTypingIndicator();
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'chat', 
                message, 
                history: state.history.slice(0, -1),
                docType: 'orientation_solution'
            })
        });
        hideTypingIndicator();
        const data = await response.json();

        if (data.action === 'generate') {
            const cleanResponse = data.response.replace('[GENERATE]', '').trim();
            addMessage(cleanResponse, 'ai', true);
            disableChatInput();
            await delay(500);
            addMessage('Je vais generer votre document d\'orientation...', 'ai', false);
            showTypingIndicator();
            await generateDocumentsInBackground();
            hideTypingIndicator();
            addMessage('Le document est pret ! Vous pouvez le consulter depuis le menu.', 'ai', false);
            showCadrageComplete();
        } else {
            addMessage(data.response, 'ai', true);
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Erreur de connexion. Reessayez.', 'ai', false);
    }
}

function delay(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

function disableChatInput() {
    el.chatInput.disabled = true;
    el.chatSend.disabled = true;
    el.chatInput.placeholder = 'Orientation en cours...';
}

function showCadrageComplete() {
    state.cadrageComplete = true;
    el.chatInput.disabled = true;
    el.chatSend.disabled = true;
    el.chatInput.placeholder = 'Orientation terminee - Consultez votre document';
    el.chatInput.style.opacity = '0.6';
    el.chatSend.style.opacity = '0.6';

    if (state.documentCache['orientation_solution']) {
        showDocument('orientation_solution', state.documentCache['orientation_solution'], {
            projetNom: state.projetNom,
            createdAt: new Date().toISOString()
        });
    }
}

// ===== GENERATION =====
async function generateDocumentsInBackground() {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    const userId = userData ? userData.id : null;
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'generate', 
                docType: 'orientation_solution', 
                history: state.history,
                userId: userId,
                projetNom: state.projetNom
            })
        });
        const data = await response.json();
        if (data.success) {
            const baseUrl = window.location.origin;
            state.documentCache['orientation_solution'] = data.document.replace(/PLACEHOLDER_BASE_URL/g, baseUrl);
        }
    } catch (error) {
        console.error('Erreur generation:', error);
    }
}

// ===== DOCUMENT DISPLAY =====
function showDocument(docType, content, metadata) {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    let ownerName = 'Utilisateur Ark';
    
    if (userData) {
        const prenom = userData.prenom || '';
        const nom = userData.nom || '';
        ownerName = (prenom + ' ' + nom).trim() || 'Utilisateur Ark';
    }
    
    const projectName = (metadata && metadata.projetNom) || state.projetNom || 'Projet sans nom';
    
    let formattedDate = 'A definir';
    if (metadata && metadata.createdAt) {
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
    el.documentTitle.textContent = DOC_NAMES[docType] || docType;
    
    const trimmedContent = updatedContent.trim();
    if (trimmedContent.startsWith('<!DOCTYPE html>') || 
        trimmedContent.startsWith('<html') ||
        trimmedContent.includes('<table>')) {
        el.documentBody.innerHTML = updatedContent;
        addFeedbackStars(el.documentBody);
    } else {
        el.documentBody.innerHTML = markdownToHtml(updatedContent);
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
        return '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>';
    });
    html = html.replace(/<!--separator-->/g, '');
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^(?!<[hultro])(.*$)/gm, (match) => match.trim() ? '<p>' + match + '</p>' : '');
    html = html.replace(/<p><\/p>/g, '');
    return html;
}

// ===== DOCUMENT ACTIONS =====
function copyDocument() {
    if (state.currentDoc) {
        navigator.clipboard.writeText(state.currentDoc.content);
        el.copyDoc.textContent = 'Copie !';
        setTimeout(() => el.copyDoc.textContent = 'Copier', 2000);
    }
}

function toggleDocMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('docDropdownMenu');
    if (menu) {
        const isVisible = menu.classList.contains('visible');
        menu.classList.toggle('visible');
        if (!isVisible) {
            setTimeout(() => document.addEventListener('click', closeDocMenuOnClickOutside), 10);
        } else {
            document.removeEventListener('click', closeDocMenuOnClickOutside);
        }
    }
}

function closeDocMenuOnClickOutside(event) {
    const menu = document.getElementById('docDropdownMenu');
    const menuBtn = document.getElementById('docMenuBtn');
    if (menu && !menu.contains(event.target) && event.target !== menuBtn) {
        menu.classList.remove('visible');
        document.removeEventListener('click', closeDocMenuOnClickOutside);
    }
}

function printDocument() {
    const menu = document.getElementById('docDropdownMenu');
    if (menu) menu.classList.remove('visible');
    window.print();
}

async function deleteCurrentDocument() {
    if (!state.currentDoc) return;
    const menu = document.getElementById('docDropdownMenu');
    if (menu) menu.classList.remove('visible');
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        alert('Vous devez etre connecte pour supprimer un document');
        return;
    }

    window.location.href = '/documents/documents.html';
}

// ===== SHARE =====
function handleShareDocument() {
    if (!state.currentDoc) return;
    
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
        alert('Vous devez etre connecte pour partager un document');
        return;
    }

    if (!state.projetNom || state.projetNom === 'mon-projet') {
        alert('Nom du projet manquant. Veuillez generer un nouveau document.');
        return;
    }

    const normalizeString = (str) => {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/['']/g, ' ').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    };

    const prenom = normalizeString(userData.prenom || '');
    const nom = normalizeString(userData.nom || '');
    const projet = normalizeString(state.projetNom);
    const baseUrl = window.location.origin;
    const shareUrl = baseUrl + '/ark/' + prenom + '-' + nom + '/' + projet;
    
    showShareModal(shareUrl);
}

function showShareModal(shareUrl) {
    el.shareLinkInput.value = shareUrl;
    el.shareModal.classList.add('visible');
}

function closeShareModal() {
    el.shareModal.classList.remove('visible');
}

function copyShareLink() {
    el.shareLinkInput.select();
    navigator.clipboard.writeText(el.shareLinkInput.value);
    el.copyLinkBtn.textContent = 'Copie !';
    setTimeout(() => el.copyLinkBtn.textContent = 'Copier', 2000);
}

function shareWhatsApp() {
    const shareUrl = el.shareLinkInput.value;
    if (shareUrl && state.currentDoc) {
        const message = 'Decouvrez mon projet : ' + DOC_NAMES[state.currentDoc.type] + '\n\n' + shareUrl + '\n\nGenere par Ark Intelligence';
        window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
    }
}

function shareEmail() {
    const shareUrl = el.shareLinkInput.value;
    if (shareUrl && state.currentDoc) {
        const subject = encodeURIComponent('Projet : ' + DOC_NAMES[state.currentDoc.type]);
        const body = encodeURIComponent('Bonjour,\n\nDecouvrez mon projet "' + (state.projetNom || 'Mon projet') + '" :\n\n' + shareUrl + '\n\nDocument genere par Ark Intelligence');
        window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    }
}

// ===== AUTO RESIZE =====
function autoResize(textarea, maxHeight) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadProjects();

    el.welcomeSend.addEventListener('click', handleWelcomeSend);
    el.welcomeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWelcomeSend(); }
    });
    el.welcomeInput.addEventListener('input', () => autoResize(el.welcomeInput, 200));

    el.chatSend.addEventListener('click', handleChatSend);
    el.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
    });
    el.chatInput.addEventListener('input', () => autoResize(el.chatInput, 150));

    el.documentBack.addEventListener('click', () => switchScreen('chat'));
    el.copyDoc.addEventListener('click', copyDocument);
    el.shareDoc.addEventListener('click', handleShareDocument);
    el.docMenuBtn.addEventListener('click', toggleDocMenu);
    el.printDoc.addEventListener('click', printDocument);
    el.deleteDoc.addEventListener('click', deleteCurrentDocument);

    el.shareModalClose.addEventListener('click', closeShareModal);
    el.shareModal.addEventListener('click', (e) => { if (e.target === el.shareModal) closeShareModal(); });
    el.copyLinkBtn.addEventListener('click', copyShareLink);
    el.shareWhatsApp.addEventListener('click', shareWhatsApp);
    if (el.shareEmail) el.shareEmail.addEventListener('click', shareEmail);

    el.newChatBtnMobile.addEventListener('click', () => { window.location.href = '/'; });

    switchScreen('welcome');
});
