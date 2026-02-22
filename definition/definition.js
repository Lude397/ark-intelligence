// ===== STATE =====
const state = {
    history: [],
    documentCache: {},
    currentDoc: null,
    cadrageComplete: false,
    projetNom: null
};

// ===== ELEMENTS =====
const el = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatScreen: document.getElementById('chatScreen'),
    loadingScreen: document.getElementById('loadingScreen'),
    documentScreen: document.getElementById('documentScreen'),
    welcomeInput: document.getElementById('welcomeInput'),
    welcomeSend: document.getElementById('welcomeSend'),
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

// ===== WELCOME SEND =====
async function handleWelcomeSend() {
    const message = el.welcomeInput.value.trim();
    if (!message) return;
    
    state.projetNom = message.substring(0, 100);
    switchScreen('chat');
    addMessage(message, 'user');
    el.welcomeInput.value = '';
    el.welcomeInput.style.height = 'auto';
    await sendToAPI(message);
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
            body: JSON.stringify({ mode: 'chat', message, history: state.history.slice(0, -1) })
        });
        hideTypingIndicator();
        const data = await response.json();

        if (data.action === 'generate') {
            const cleanResponse = data.response.replace('[GENERATE]', '').trim();
            
            const nomMatch = cleanResponse.match(/\*\*Nom du projet\s*:\s*(.+?)\*\*/);
            if (nomMatch && nomMatch[1]) {
                state.projetNom = nomMatch[1].trim();
            }
            
            addMessage(cleanResponse, 'ai', true);
            disableChatInput();
            await delay(500);
            addMessage('Je vais generer votre document...', 'ai', false);
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
    el.chatInput.placeholder = 'Cadrage en cours...';
}

function showCadrageComplete() {
    state.cadrageComplete = true;
    el.chatInput.disabled = true;
    el.chatSend.disabled = true;
    el.chatInput.placeholder = 'Cadrage termine - Consultez votre document';
    el.chatInput.style.opacity = '0.6';
    el.chatSend.style.opacity = '0.6';

    // Afficher automatiquement le document
    if (state.documentCache['definition_projet']) {
        showDocument('definition_projet', state.documentCache['definition_projet'], {
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
                docType: 'definition_projet', 
                history: state.history,
                userId: userId,
                projetNom: state.projetNom
            })
        });
        const data = await response.json();
        if (data.success) {
            const baseUrl = window.location.origin;
            state.documentCache['definition_projet'] = data.document.replace(/PLACEHOLDER_BASE_URL/g, baseUrl);
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

    // Redirect to documents page after deletion attempt
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

    // Welcome events
    el.welcomeSend.addEventListener('click', handleWelcomeSend);
    el.welcomeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWelcomeSend(); }
    });
    el.welcomeInput.addEventListener('input', () => autoResize(el.welcomeInput, 200));
    el.welcomeInput.focus();

    // Chat events
    el.chatSend.addEventListener('click', handleChatSend);
    el.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
    });
    el.chatInput.addEventListener('input', () => autoResize(el.chatInput, 150));

    // Document events
    el.documentBack.addEventListener('click', () => switchScreen('chat'));
    el.copyDoc.addEventListener('click', copyDocument);
    el.shareDoc.addEventListener('click', handleShareDocument);
    el.docMenuBtn.addEventListener('click', toggleDocMenu);
    el.printDoc.addEventListener('click', printDocument);
    el.deleteDoc.addEventListener('click', deleteCurrentDocument);

    // Share modal events
    el.shareModalClose.addEventListener('click', closeShareModal);
    el.shareModal.addEventListener('click', (e) => { if (e.target === el.shareModal) closeShareModal(); });
    el.copyLinkBtn.addEventListener('click', copyShareLink);
    el.shareWhatsApp.addEventListener('click', shareWhatsApp);
    if (el.shareEmail) el.shareEmail.addEventListener('click', shareEmail);

    // New chat mobile
    el.newChatBtnMobile.addEventListener('click', () => { window.location.href = '/'; });

    switchScreen('welcome');
});
