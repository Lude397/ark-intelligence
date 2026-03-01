// ==================== FIT TO PAGE ====================
// Ajuste automatiquement la font-size pour que le document
// remplisse correctement une page A4 (ni trop, ni trop peu)

function fitToPage(container) {
    if (!container || !container.innerHTML.trim()) return;

    // Detecter le type de document (paysage ou portrait)
    const isLandscape = container.querySelector('.dt-wrapper, .bmc-wrapper') !== null;
    
    // Hauteur cible en px (A4 avec marges de ~10mm)
    // Portrait : 297mm - 20mm marges = 277mm ~ 1047px
    // Paysage  : 210mm - 20mm marges = 190mm ~ 718px
    const TARGET_HEIGHT = isLandscape ? 718 : 1047;
    const MIN_FILL = 0.88; // Le contenu doit remplir au moins 88% de la page
    const MAX_FILL = 1.0;  // Ne doit pas depasser 100%

    // Trouver le wrapper du document
    const wrapper = container.querySelector('.doc-wrapper, .dt-wrapper, .bmc-wrapper');
    if (!wrapper) return;

    // Sauvegarder la font-size d'origine
    const originalSize = parseFloat(window.getComputedStyle(wrapper).fontSize) || 12;
    let currentSize = originalSize;
    const MIN_FONT = 8;   // Ne jamais descendre en dessous de 8px
    const MAX_FONT = 18;  // Ne jamais monter au dessus de 18px
    let iterations = 0;
    const MAX_ITER = 20;

    // Boucle d'ajustement
    while (iterations < MAX_ITER) {
        wrapper.style.fontSize = currentSize + 'px';
        
        // Forcer le recalcul du layout
        void wrapper.offsetHeight;
        
        const contentHeight = wrapper.scrollHeight;
        const ratio = contentHeight / TARGET_HEIGHT;

        if (ratio > MAX_FILL && currentSize > MIN_FONT) {
            // Trop grand -> reduire
            currentSize -= 0.5;
        } else if (ratio < MIN_FILL && currentSize < MAX_FONT) {
            // Trop petit -> augmenter
            currentSize += 0.5;
        } else {
            // Dans la zone ideale
            break;
        }
        iterations++;
    }

    // Appliquer la taille finale sur tous les elements texte
    applyFontScale(wrapper, currentSize / originalSize);
}

function applyFontScale(wrapper, scale) {
    if (scale === 1) return;
    
    // Elements a ajuster
    const textElements = wrapper.querySelectorAll('td, th, div, span, p, a, li');
    
    textElements.forEach(function(el) {
        const computed = window.getComputedStyle(el);
        const currentFontSize = parseFloat(computed.fontSize);
        const currentLineHeight = parseFloat(computed.lineHeight);
        const currentPadding = parseFloat(computed.paddingTop);
        
        if (currentFontSize) {
            el.style.fontSize = (currentFontSize * scale) + 'px';
        }
        if (currentLineHeight && !isNaN(currentLineHeight)) {
            el.style.lineHeight = (currentLineHeight * scale) + 'px';
        }
        // Ajuster les paddings proportionnellement (mais moins agressivement)
        if (currentPadding > 4) {
            const paddingScale = 1 + (scale - 1) * 0.5; // Reduction a moitie
            el.style.paddingTop = (parseFloat(computed.paddingTop) * paddingScale) + 'px';
            el.style.paddingBottom = (parseFloat(computed.paddingBottom) * paddingScale) + 'px';
        }
    });
}
