document.addEventListener('DOMContentLoaded', function() {

    // ======================================================================
    // 1. AUDIO & WELCOME SCREEN
    // ======================================================================
    const welcomeScreen = document.getElementById('welcome-screen');
    const enterBtn = document.getElementById('enter-btn');
    const bgAudio = document.getElementById('bg-audio'); 

    // Lock scroll initially
    document.body.style.overflow = 'hidden';

    if (enterBtn && welcomeScreen && bgAudio) {
        enterBtn.addEventListener('click', () => {
            // Hide Welcome Screen
            welcomeScreen.classList.add('hide-welcome');
            
            // Play Audio (initiated by user click)
            bgAudio.volume = 0.6; 
            bgAudio.play().catch(error => console.log("Audio playback failed:", error));
            
            // Unlock Scroll
            document.body.style.overflow = 'auto';
        });
    }

    // ======================================================================
    // 2. SCROLL ANIMATIONS
    // ======================================================================
    const observerOptions = { threshold: 0.1 };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.slide-up').forEach(el => observer.observe(el));

    // ======================================================================
    // 3. COUNTDOWN TIMER
    // ======================================================================
    const targetDate = new Date("April 17, 2026 12:00:00").getTime();
    const countdownGrid = document.getElementById('countdown');

    const SECOND = 1000;
    const MINUTE = SECOND * 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    let timerInterval;

    function updateTimer() {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff < 0) {
            if (countdownGrid) {
                countdownGrid.innerHTML = '<div class="cd-box" style="width:100%; border-color:white;"><span class="cd-num">Mubarak!</span><span class="cd-label">Celebration Started</span></div>';
            }
            clearInterval(timerInterval); 
            return;
        }

        const days = Math.floor(diff / DAY);
        const hours = Math.floor((diff % DAY) / HOUR);
        const mins = Math.floor((diff % HOUR) / MINUTE);
        const secs = Math.floor((diff % MINUTE) / SECOND);

        if (countdownGrid) {
            countdownGrid.innerHTML = `
                <div class="cd-box"><span class="cd-num">${days}</span><span class="cd-label">Days</span></div>
                <div class="cd-box"><span class="cd-num">${hours}</span><span class="cd-label">Hrs</span></div>
                <div class="cd-box"><span class="cd-num">${mins}</span><span class="cd-label">Min</span></div>
                <div class="cd-box"><span class="cd-num">${secs}</span><span class="cd-label">Sec</span></div>
            `;
        }
    }

    if (countdownGrid) {
        timerInterval = setInterval(updateTimer, SECOND); 
        updateTimer();
    }
    
    // ======================================================================
    // 4. WISHES SYSTEM (LOCAL STORAGE & REPLY LOGIC)
    // ======================================================================
    
    const wishForm = document.getElementById('wish-form');
    const wishesFeed = document.getElementById('wishes-feed');

    let savedWishes = JSON.parse(localStorage.getItem('sathiWishes')) || [];
    savedWishes = savedWishes.map(wish => ({
        ...wish,
        replies: wish.replies || [] 
    }));

    function saveWishes() {
        localStorage.setItem('sathiWishes', JSON.stringify(savedWishes));
    }

    function renderWishes() {
        if (!wishesFeed) return;
        wishesFeed.innerHTML = ''; 

        if (savedWishes.length === 0) {
            wishesFeed.innerHTML = '<p class="no-wishes" style="text-align:center; color:#777; padding-top: 10px;">Be the first to send a wish!</p>';
        }

        savedWishes.forEach((wish, index) => {
            const hasReplies = wish.replies && wish.replies.length > 0;
            const wishCard = document.createElement('div');
            wishCard.className = 'wish-card slide-up visible'; 
            wishCard.setAttribute('data-index', index);

            let htmlContent = `
                <div class="wish-main">
                    <p class="wish-text">"${wish.msg}"</p>
                    <p class="wish-author">- ${wish.name}</p>
                    <div class="wish-actions">
                        <button class="delete-btn" data-index="${index}">🗑️ Delete</button>
                        <button class="reply-btn" data-index="${index}">💬 Reply</button>
                    </div>
                </div>
            `;
            
            htmlContent += `
                <div class="replies-section" id="replies-${index}">
            `;
            
            if (hasReplies) {
                htmlContent += `<h4>Replies:</h4>`;
                
                wish.replies.forEach(reply => {
                    const safeName = reply.name.replace(/</g, "<").replace(/>/g, ">");
                    const safeMsg = reply.message.replace(/</g, "<").replace(/>/g, ">");
                    htmlContent += `<p class="reply-item"><strong>${safeName}:</strong> ${safeMsg}</p>`;
                });
            }
            
            htmlContent += `
                    <form class="reply-form" data-index="${index}">
                        <input type="text" placeholder="Your Name" required>
                        <input type="text" placeholder="Your Reply" required>
                        <button type="submit">Post Reply</button>
                    </form>
                </div>
            `;
            
            wishCard.innerHTML = htmlContent;
            wishesFeed.prepend(wishCard);
            
            const repliesSection = wishCard.querySelector(`#replies-${index}`);
            if (!hasReplies) {
                repliesSection.style.display = 'none'; 
            }
        });

        addWishesEventListeners();
    }

    function addWishesEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => deleteWish(parseInt(e.target.dataset.index));
        });

        document.querySelectorAll('.reply-btn').forEach(button => {
            button.onclick = (e) => {
                const index = parseInt(e.target.dataset.index);
                const repliesSection = document.getElementById(`replies-${index}`);
                
                const form = repliesSection ? repliesSection.querySelector('.reply-form') : null;
                
                if (form && repliesSection) {
                    const formIsVisible = form.style.display === 'flex';

                    if (formIsVisible) {
                        form.style.display = 'none';
                        button.textContent = '💬 Reply'; 
                        
                        const hasReplies = savedWishes[index].replies && savedWishes[index].replies.length > 0;
                        if (!hasReplies) {
                            repliesSection.style.display = 'none'; 
                        }
                    } else {
                        repliesSection.style.display = 'block'; 
                        form.style.display = 'flex';           
                        button.textContent = '❌ Cancel Reply';
                    }
                }
            };
        });

        document.querySelectorAll('.reply-form').forEach(form => {
            form.onsubmit = function(e) {
                e.preventDefault();
                const index = parseInt(e.target.dataset.index);
                const replyName = e.target.querySelector('input:nth-child(1)').value.trim();
                const replyMsg = e.target.querySelector('input:nth-child(2)').value.trim();
                
                if (replyName && replyMsg) {
                    addReply(index, replyName, replyMsg);
                    e.target.reset();
                }
            };
        });
    }

    function deleteWish(index) {
        if (confirm("Are you sure you want to delete your wish? This is irreversible.")) {
            savedWishes.splice(index, 1);
            saveWishes();
            renderWishes(); 
        }
    }

    function addReply(index, name, message) {
        if (!savedWishes[index].replies) {
            savedWishes[index].replies = [];
        }
        savedWishes[index].replies.push({ name, message, timestamp: new Date().toISOString() });
        
        saveWishes();
        renderWishes(); 
    }

    if (wishForm) {
        wishForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const nameInput = document.getElementById('user-name');
            const messageInput = document.getElementById('user-msg');
            
            if (!nameInput || !messageInput) return;

            const name = nameInput.value.trim();
            const message = messageInput.value.trim();

            if (!name || !message) return;

            const newWish = { name, msg: message, replies: [] };
            savedWishes.unshift(newWish);
            saveWishes(); 
            
            wishForm.reset();
            renderWishes(); 
        });
    }

    // Initial Render
    renderWishes();

    // ======================================================================
    // 5. EVENT FILTERING LOGIC (DYNAMIC VISIBILITY)
    // ======================================================================

    function filterEvents() {
        const urlParams = new URLSearchParams(window.location.search);
        const filterType = urlParams.get('show'); 

        // Get the card elements using their IDs
        const mehndiCard = document.getElementById('mehndi-card');
        const baratCard = document.getElementById('barat-card');
        const walimaCard = document.getElementById('walima-card');
        
        // List all cards
        const allCards = [mehndiCard, baratCard, walimaCard];
        
        // Hide all cards by default before deciding which to show
        allCards.forEach(card => {
            if (card) card.style.display = 'none';
        });


        // Decide which card(s) to show based on the URL parameter
        switch (filterType) {
            case 'walima':
                if (walimaCard) walimaCard.style.display = 'block';
                break;
            case 'barat':
                if (baratCard) baratCard.style.display = 'block';
                break;
            case 'mehndi':
                if (mehndiCard) mehndiCard.style.display = 'block';
                break;
            case 'baratwalima':
                if (baratCard) baratCard.style.display = 'block';
                if (walimaCard) walimaCard.style.display = 'block';
                break;
            case 'mehindbarat':
                if (mehndiCard) mehndiCard.style.display = 'block';
                if (baratCard) baratCard.style.display = 'block';
                break;
            case 'mehndiorwalima': 
                if (mehndiCard) mehndiCard.style.display = 'block';
                if (walimaCard) walimaCard.style.display = 'block';
                break;
            case 'all':
            default:
                // Fallback: If parameter is missing or unknown, show all events
                allCards.forEach(card => {
                    if (card) card.style.display = 'block';
                });
                break;
        }
    }
    
    // Run the filter function when the page loads
    filterEvents();
});