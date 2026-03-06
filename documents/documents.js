// FICHIER : documents/documents.js
// ===== STATE =====
const state = {
    allDocuments: [],
    currentDoc: null,
    projetNom: null,
    currentZoom: 1
};

// ===== ELEMENTS =====
const el = {
    mydocsList: document.getElementById('mydocsList'),
    documentScreen: document.getElementById('documentScreen'),
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
    statsModal: document.getElementById('statsModal'),
    statsModalClose: document.getElementById('statsModalClose'),
    statsCount: document.getElementById('statsCount'),
    statsList: document.getElementById('statsList'),
    docMenuBtn: document.getElementById('docMenuBtn'),
    printDoc: document.getElementById('printDoc'),
    deleteDoc: document.getElementById('deleteDoc'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomFit: document.getElementById('zoomFit'),
    zoomLevel: document.getElementById('zoomLevel'),
    zoomControls: document.getElementById('zoomControls')
};

// ===== LOAD DOCUMENTS =====
async function loadDocuments() {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) {
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
        console.error('Erreur recuperation documents:', error);
        state.allDocuments = [];
        renderMyDocuments([]);
    }
}

function renderMyDocuments(docs) {
    if (docs.length === 0) {
        el.mydocsList.innerHTML = '<div class="mydocs-empty"><div>Vous n\'avez pas encore de documents generes</div></div>';
        return;
    }
    
    let html = '';
    docs.forEach(doc => {
        const date = new Date(doc.created_at).toLocaleDateString('fr-FR');
        html += '<div class="doc-card" onclick="openDocument(\'' + doc.id + '\')">' +
            '<div class="doc-card-header"><div>' +
            '<div class="doc-card-title">' + (doc.projet_nom || 'Sans titre') + '</div>' +
            '<div class="doc-card-type">' + (DOC_NAMES[doc.doc_type] || doc.doc_type) + '</div>' +
            '</div></div>' +
            '<div class="doc-card-meta"><div class="doc-card-meta-item"><span>&#128197;</span><span>' + date + '</span></div></div>' +
            '</div>';
    });
    el.mydocsList.innerHTML = html;
}


// ===== IFRAME RENDERER =====
function renderInIframe(container, htmlContent) {
    container.innerHTML = '';
    const isLandscape = htmlContent.includes('dt-wrapper') || htmlContent.includes('bmc-wrapper');
    const desktopWidth = isLandscape ? 1100 : 820;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const wrapper = document.createElement('div');
    const iframe = document.createElement('iframe');

    // Mobile : scrolling auto pour liberer le zoom natif
    // Desktop : scrolling no pour eviter le scroll interne
    iframe.setAttribute('scrolling', isMobile ? 'auto' : 'no');

    // CSS injecte dans le srcdoc pour eviter le texte coupe sur mobile
    const mobileCss = `@media (max-width: 768px) {
        td, th { overflow: visible !important; white-space: normal !important; height: auto !important; word-wrap: break-word !important; word-break: break-word !important; }
        .dt-canvas, .bmc-grid { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
        .dt-column, .bmc-cell { min-width: 0 !important; overflow: visible !important; }
    }`;
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:white;width:${desktopWidth}px;}${mobileCss}</style></head><body>${htmlContent}</body></html>`;

    // Styles initiaux pour eviter tout debordement avant le load
    iframe.style.cssText = 'border:none;display:block;width:' + desktopWidth + 'px;opacity:0;';
    wrapper.style.cssText = 'width:100%;overflow:visible;background:white;';

    iframe.srcdoc = fullHtml;
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    iframe.addEventListener('load', function() {
        try {
            const applyScale = function() {
                const contentHeight = iframe.contentDocument.documentElement.scrollHeight;
                // window.innerWidth est toujours fiable — documentBody peut retourner 0
                // On soustrait le padding du document-content (24px * 2 = 48px)
                const docContent = document.querySelector('.document-content');
                const availableWidth = docContent 
                    ? docContent.getBoundingClientRect().width - 48
                    : window.innerWidth - 48;
                const scale = Math.min(1, availableWidth / desktopWidth);

                if (isMobile) {
                    iframe.style.cssText = 'border:none;display:block;width:' + desktopWidth + 'px;height:' + contentHeight + 'px;transform-origin:top left;transform:scale(' + scale + ');opacity:1;';
                    wrapper.style.cssText = 'width:100%;overflow:hidden;background:white;height:' + Math.ceil(contentHeight * scale) + 'px;';
                } else {
                    const scaledWidth = Math.ceil(desktopWidth * scale);
                    iframe.style.cssText = 'border:none;display:block;width:' + desktopWidth + 'px;height:' + contentHeight + 'px;transform-origin:top left;transform:scale(' + scale.toFixed(2) + ');opacity:1;';
                    wrapper.style.cssText = 'width:' + scaledWidth + 'px;overflow:visible;background:white;height:' + Math.ceil(contentHeight * scale) + 'px;margin:0 auto;';
                }
            };

            if (!isMobile) {
                requestAnimationFrame(() => requestAnimationFrame(applyScale));
            } else {
                applyScale();
            }
        } catch(e) {
            iframe.style.cssText = 'border:none;display:block;width:100%;height:' + (isLandscape ? '650px' : '1000px') + ';opacity:1;';
        }
    });
}

// ===== OPEN DOCUMENT =====
function openDocument(documentId) {
    const doc = state.allDocuments.find(d => d.id === documentId);
    if (!doc) return;
    
    state.projetNom = doc.projet_nom;
    showDocument(doc.doc_type, doc.contenu, {
        id: doc.id,
        projetNom: doc.projet_nom,
        createdAt: doc.created_at
    });
}

function showDocument(docType, content, metadata) {
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    let ownerName = 'Utilisateur Ark';
    if (userData) {
        ownerName = ((userData.prenom || '') + ' ' + (userData.nom || '')).trim() || 'Utilisateur Ark';
    }
    
    const projectName = (metadata && metadata.projetNom) || state.projetNom || 'Projet sans nom';
    let formattedDate = 'A definir';
    if (metadata && metadata.createdAt) {
        formattedDate = new Date(metadata.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    let updatedContent = content
        .replace(/\{\{OWNER_NAME\}\}/g, ownerName)
        .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
        .replace(/\{\{DATE\}\}/g, formattedDate)
        .replace(/arkintelligence\.vercel\.app/g, 'www.arkintelligence.africa')
        .replace(/https:\/\/arkintelligence\.vercel\.app/g, 'https://www.arkintelligence.africa');
    
    state.currentDoc = { type: docType, content: updatedContent, id: (metadata && metadata.id) || null };
    el.documentTitle.textContent = DOC_NAMES[docType] || docType;
    el.documentScreen.classList.add('visible');
    document.body.classList.add('document-open');

    // Boutons zoom : visibles uniquement pour DT et BMC sur desktop
    const isLandscapeDoc = docType === 'design_thinking' || docType === 'business_model';
    if (el.zoomControls) {
        el.zoomControls.style.display = (isLandscapeDoc && window.matchMedia('(min-width: 769px)').matches) ? 'flex' : 'none';
    }
    // Reset zoom a 100%
    state.currentZoom = 1;
    if (el.zoomLevel) el.zoomLevel.textContent = '100%';

    // Desktop : masquer la sidebar AVANT renderInIframe pour que la largeur soit correcte
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.matchMedia('(min-width: 769px)').matches) {
        sidebar.style.display = 'none';
    }

    const trimmed = updatedContent.trim();
    if (trimmed.startsWith('<!DOCTYPE html>') || trimmed.startsWith('<html') || trimmed.includes('<table>') || trimmed.includes('dt-wrapper') || trimmed.includes('bmc-wrapper') || trimmed.includes('<style>')) {
        renderInIframe(el.documentBody, updatedContent);
    } else {
        renderInIframe(el.documentBody, markdownToHtml(updatedContent));
    }
}

function hideDocument() {
    el.documentScreen.classList.remove('visible');
    document.body.classList.remove('document-open');

    // Restaurer la sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = '';
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
    if (!userData || !userData.id) return;
    
    if (!state.currentDoc.id) { alert('Impossible de supprimer ce document'); return; }
    const doc = state.allDocuments.find(d => d.id === state.currentDoc.id);
    if (!doc) { alert('Impossible de supprimer ce document'); return; }
    
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'deleteDocument', documentId: doc.id, userId: userData.id })
        });
        const data = await response.json();
        if (data.success) {
            state.allDocuments = state.allDocuments.filter(d => d.id !== doc.id);
            hideDocument();
            renderMyDocuments(state.allDocuments);
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        alert('Erreur de connexion');
    }
}

// ===== SHARE =====
function handleShareDocument() {
    if (!state.currentDoc) return;
    const userData = JSON.parse(localStorage.getItem('ark_user'));
    if (!userData || !userData.id) return;
    if (!state.projetNom) return;

    const normalizeString = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/['']/g, ' ').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();

    const prenom = normalizeString(userData.prenom || '');
    const nom = normalizeString(userData.nom || '');
    const projet = normalizeString(state.projetNom);
    const shareUrl = window.location.origin + '/ark/' + prenom + '-' + nom + '/' + projet;
    
    el.shareLinkInput.value = shareUrl;
    el.shareModal.classList.add('visible');
}

function closeShareModal() { el.shareModal.classList.remove('visible'); }

function copyShareLink() {
    el.shareLinkInput.select();
    navigator.clipboard.writeText(el.shareLinkInput.value);
    el.copyLinkBtn.textContent = 'Copie !';
    setTimeout(() => el.copyLinkBtn.textContent = 'Copier', 2000);
}

function shareWhatsApp() {
    const url = el.shareLinkInput.value;
    if (url && state.currentDoc) {
        window.open('https://wa.me/?text=' + encodeURIComponent('Decouvrez mon projet\n\n' + url + '\n\nGenere par Ark Intelligence'), '_blank');
    }
}

function shareEmail() {
    const url = el.shareLinkInput.value;
    if (url && state.currentDoc) {
        window.location.href = 'mailto:?subject=' + encodeURIComponent('Mon projet') + '&body=' + encodeURIComponent('Decouvrez mon projet :\n\n' + url);
    }
}

function closeStatsModal() { el.statsModal.classList.remove('visible'); }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadDocuments();

    el.documentBack.addEventListener('click', hideDocument);
    el.copyDoc.addEventListener('click', copyDocument);
    el.shareDoc.addEventListener('click', handleShareDocument);
    el.docMenuBtn.addEventListener('click', toggleDocMenu);
    el.printDoc.addEventListener('click', printDocument);
    el.deleteDoc.addEventListener('click', deleteCurrentDocument);

    el.shareModalClose.addEventListener('click', closeShareModal);
    el.shareModal.addEventListener('click', (e) => { if (e.target === el.shareModal) closeShareModal(); });
    el.copyLinkBtn.addEventListener('click', copyShareLink);
    el.shareWhatsApp.addEventListener('click', shareWhatsApp);
    el.shareEmail.addEventListener('click', shareEmail);

    el.statsModalClose.addEventListener('click', closeStatsModal);
    el.statsModal.addEventListener('click', (e) => { if (e.target === el.statsModal) closeStatsModal(); });

    // Zoom buttons
    if (el.zoomIn) el.zoomIn.addEventListener('click', () => applyZoom(0.1));
    if (el.zoomOut) el.zoomOut.addEventListener('click', () => applyZoom(-0.1));
    if (el.zoomFit) el.zoomFit.addEventListener('click', () => {
        const isActive = el.zoomFit.classList.toggle('active');
        applyZoom(0, isActive ? 1.2 : 1);
    });
});

// ===== ZOOM =====
function applyZoom(delta, target) {
    const iframe = el.documentBody.querySelector('iframe');
    const wrapper = el.documentBody.querySelector('div');
    if (!iframe || !wrapper) return;

    const isLandscape = state.currentDoc && (state.currentDoc.type === 'design_thinking' || state.currentDoc.type === 'business_model');
    const desktopWidth = isLandscape ? 1100 : 820;

    if (target !== undefined) {
        state.currentZoom = target;
    } else {
        state.currentZoom = Math.min(2, Math.max(0.3, state.currentZoom + delta));
        if (el.zoomFit) el.zoomFit.classList.remove('active');
    }

    const contentHeight = iframe.contentDocument ? iframe.contentDocument.documentElement.scrollHeight : parseInt(iframe.style.height);
    const scaledWidth = Math.ceil(desktopWidth * state.currentZoom);
    iframe.style.transform = 'scale(' + state.currentZoom.toFixed(2) + ')';
    wrapper.style.width = scaledWidth + 'px';
    wrapper.style.height = Math.ceil(contentHeight * state.currentZoom) + 'px';
    if (el.zoomLevel) el.zoomLevel.textContent = Math.round(state.currentZoom * 100) + '%';
}
