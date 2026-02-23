// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    document.querySelectorAll('.hamburger-btn').forEach(btn => {
        btn.classList.toggle('active');
    });
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    
    document.querySelectorAll('.hamburger-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ===== INIT SIDEBAR EVENTS =====
document.addEventListener('DOMContentLoaded', () => {
    // Hamburger buttons
    document.querySelectorAll('.hamburger-btn').forEach(btn => {
        btn.addEventListener('click', toggleSidebar);
    });

    // Overlay click to close
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Home button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            closeSidebar();
            window.location.href = '/';
        });
    }

    // New project button (mobile)
    const newProjectBtn = document.getElementById('newProjectBtnWelcome');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            closeSidebar();
            window.location.href = '/';
        });
    }

    // Sidebar doc items navigation
    const docRoutes = {
        definition_projet: '/definition/definition.html',
        orientation_solution: '/orientation/orientation.html',
        formulation_solution: '/formulation/formulation.html',
        design_thinking: '/design-thinking/design-thinking.html',
        business_model: '/business-model/business-model.html',
        lean_startup: '/lean-startup/lean-startup.html',
        agile: '/agile/agile.html'
    };

    document.querySelectorAll('.doc-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;
            closeSidebar();
            const route = docRoutes[item.dataset.doc];
            if (route) window.location.href = route;
        });
    });

    // Mes documents button
    const myDocsBtn = document.getElementById('myDocsBtnSidebar');
    if (myDocsBtn) {
        myDocsBtn.addEventListener('click', () => {
            closeSidebar();
            window.location.href = '/documents/documents.html';
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            closeSidebar();
            window.location.href = '/parametres/parametres.html';
        });
    }
});
