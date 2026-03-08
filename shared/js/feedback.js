// FICHIER : shared/js/feedback.js

// ===== SYSTEME DE FEEDBACK - Pouces (reponses) + Etoiles (documents) =====

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    var FEEDBACK_CONFIG = {
        supabaseUrl: typeof CONFIG !== 'undefined' ? CONFIG.supabaseUrl : '',
        supabaseKey: typeof CONFIG !== 'undefined' ? CONFIG.supabaseKey : ''
    };

    // ===== UTILITAIRE : recuperer le user_id =====
    function getUserId() {
        try {
            var user = JSON.parse(localStorage.getItem('ark_user'));
            return user ? user.id : null;
        } catch (e) {
            return null;
        }
    }

    // ===== UTILITAIRE : detecter le module actif =====
    function getCurrentModule() {
        var chatTitle = document.getElementById('chatTitle');
        if (chatTitle) return chatTitle.textContent.trim();
        var path = window.location.pathname;
        if (path.includes('definition')) return 'definition_projet';
        if (path.includes('orientation')) return 'orientation_solution';
        if (path.includes('formulation')) return 'formulation_solution';
        if (path.includes('design')) return 'design_thinking';
        if (path.includes('business')) return 'business_model';
        if (path.includes('lean')) return 'lean_startup';
        if (path.includes('agile')) return 'agile';
        return 'inconnu';
    }

    // ===== ENVOYER FEEDBACK A SUPABASE =====
    function sendFeedback(table, data) {
        if (!FEEDBACK_CONFIG.supabaseUrl || !FEEDBACK_CONFIG.supabaseKey) return;

        fetch(FEEDBACK_CONFIG.supabaseUrl + '/rest/v1/' + table, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': FEEDBACK_CONFIG.supabaseKey,
                'Authorization': 'Bearer ' + FEEDBACK_CONFIG.supabaseKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        }).catch(function(err) {
            console.log('Feedback error:', err);
        });
    }

    // ===== COMPTEUR DE QUESTIONS IA =====
    var aiMessageCount = 0;

    // ===== CREER LES POUCES POUR UNE REPONSE IA =====
    function createThumbs(questionNumber) {
        var container = document.createElement('div');
        container.className = 'feedback-thumbs';
        container.setAttribute('data-question', questionNumber);

        // Pouce haut
        var upBtn = document.createElement('button');
        upBtn.className = 'thumb-btn';
        upBtn.setAttribute('data-rating', 'up');
        upBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
        upBtn.title = 'Bonne reponse';

        // Pouce bas
        var downBtn = document.createElement('button');
        downBtn.className = 'thumb-btn';
        downBtn.setAttribute('data-rating', 'down');
        downBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>';
        downBtn.title = 'Mauvaise reponse';

        // Gestion du clic
        function handleThumbClick(e) {
            var btn = e.currentTarget;
            var rating = btn.getAttribute('data-rating');
            var userId = getUserId();
            var module = getCurrentModule();

            // Desactiver les deux boutons
            upBtn.classList.add('disabled');
            downBtn.classList.add('disabled');
            container.classList.add('voted');

            // Activer le bouton clique
            if (rating === 'up') {
                upBtn.classList.add('active-up');
            } else {
                downBtn.classList.add('active-down');
            }

            // Envoyer a Supabase
            sendFeedback('feedback_reponses', {
                user_id: userId,
                module: module,
                question_number: questionNumber,
                rating: rating
            });
        }

        upBtn.addEventListener('click', handleThumbClick);
        downBtn.addEventListener('click', handleThumbClick);

        container.appendChild(upBtn);
        container.appendChild(downBtn);

        return container;
    }

    // ===== CREER LES ETOILES POUR UN DOCUMENT =====
    function createStars() {
        var container = document.createElement('div');
        container.className = 'feedback-stars-container';
        container.id = 'feedbackStars';

        var label = document.createElement('span');
        label.className = 'feedback-stars-label';
        label.textContent = 'Notez ce document :';

        var starsDiv = document.createElement('div');
        starsDiv.className = 'feedback-stars';

        var thanks = document.createElement('span');
        thanks.className = 'feedback-stars-thanks';
        thanks.textContent = 'Merci !';

        var stars = [];

        for (var i = 1; i <= 5; i++) {
            var starBtn = document.createElement('button');
            starBtn.className = 'star-btn';
            starBtn.setAttribute('data-star', i);
            starBtn.innerHTML = '&#9733;';
            starBtn.title = i + ' etoile' + (i > 1 ? 's' : '');
            stars.push(starBtn);

            // Hover : illuminer les etoiles
            starBtn.addEventListener('mouseenter', function() {
                var val = parseInt(this.getAttribute('data-star'));
                for (var j = 0; j < stars.length; j++) {
                    if (j < val) {
                        stars[j].classList.add('active');
                    } else {
                        stars[j].classList.remove('active');
                    }
                }
            });

            // Clic : enregistrer la note
            starBtn.addEventListener('click', function() {
                var val = parseInt(this.getAttribute('data-star'));
                var userId = getUserId();
                var module = getCurrentModule();

                // Figer les etoiles
                for (var j = 0; j < stars.length; j++) {
                    stars[j].classList.add('disabled');
                    if (j < val) {
                        stars[j].classList.add('active');
                    } else {
                        stars[j].classList.remove('active');
                    }
                }

                // Afficher merci
                thanks.classList.add('visible');
                label.textContent = val + '/5';

                // Envoyer a Supabase
                sendFeedback('feedback_documents', {
                    user_id: userId,
                    module: module,
                    stars: val
                });
            });

            starsDiv.appendChild(starBtn);
        }

        // Reset hover quand la souris quitte
        starsDiv.addEventListener('mouseleave', function() {
            var voted = starsDiv.querySelector('.disabled');
            if (voted) return; // deja vote, ne pas reset
            for (var j = 0; j < stars.length; j++) {
                stars[j].classList.remove('active');
            }
        });

        container.appendChild(label);
        container.appendChild(starsDiv);
        container.appendChild(thanks);

        return container;
    }

    // ===== API PUBLIQUE =====

    // Appeler apres chaque addMessage('...', 'ai')
    window.addFeedbackThumbs = function(messageDiv) {
        aiMessageCount++;
        var thumbs = createThumbs(aiMessageCount);
        var content = messageDiv.querySelector('.message-content');
        if (content) {
            content.appendChild(thumbs);
        } else {
            messageDiv.appendChild(thumbs);
        }
    };

    // Appeler quand le document est affiche
    window.addFeedbackStars = function(targetElement) {
        // Eviter les doublons
        if (document.getElementById('feedbackStars')) return;
        var starsWidget = createStars();
        if (targetElement) {
            targetElement.appendChild(starsWidget);
        }
    };

    // Reset le compteur (nouveau chat)
    window.resetFeedbackCount = function() {
        aiMessageCount = 0;
    };

})();
