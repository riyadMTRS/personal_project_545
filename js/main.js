// Reminder: Thoroughly test all functionalities, especially dynamic content loading (news, fun facts), navigation, and interactive UI components (stepper, swiper, tasbeeh counter) across different devices and browsers.
// Global state to manage the current page and content
const appState = {
    currentPage: 'home',
    funFact: '',
    isLoadingFact: false,
    newsArticles: [],
    isLoadingNews: false,
    // Stepper state
    stepperCurrentStep: 1,
    stepperDirection: 0, // 1 for next, -1 for back
    // Tasbeeh Counter state
    tasbeehCount: 0,
    // Card Swiper state
    currentCardIndex: 0
};

// --- Core Application Logic ---
let mainContentDiv;
let navLinksDiv;

function navigateTo(page) {
    appState.currentPage = page;
    renderApp();
}

// Declare globally to be accessible by initCircuitNavigation and renderApp
let updateActiveCircuitNode;

let heroTextEffectCleanup = null;
let stepperCleanup = null;
let tasbeehCounterCleanup = null;
let cardSwiperCleanup = null;


function renderApp() {
    // Render navigation links - initCircuitNavigation returns a function to update active node
    // That function is assigned to the global updateActiveCircuitNode
    // If it's not the first render, just call the update function
    if (updateActiveCircuitNode) {
        updateActiveCircuitNode();
    }
    // Note: The initial call to initCircuitNavigation which sets up the DOM elements for nav
    // and assigns to updateActiveCircuitNode happens in DOMContentLoaded

    // Cleanup previous effects to prevent memory leaks or duplicate effects
    if (heroTextEffectCleanup) {
        heroTextEffectCleanup();
        heroTextEffectCleanup = null;
    }
    if (stepperCleanup) {
        stepperCleanup(); // Assuming this function handles its own null check if needed
        stepperCleanup = null;
    }
    if (tasbeehCounterCleanup) {
        tasbeehCounterCleanup(); // Assuming this function handles its own null check
        tasbeehCounterCleanup = null;
    }
    if (cardSwiperCleanup) {
        cardSwiperCleanup(); // Assuming this function handles its own null check
        cardSwiperCleanup = null;
    }


    // Render main content
    let pageHtml = '';
    switch (appState.currentPage) {
        case 'home':
            pageHtml = getHomePageHtml(); // From ui-components.js
            // After rendering, initialize the effects for the home page
            setTimeout(() => {
                heroTextEffectCleanup = initHeroTextEffect('hero-text-effect-container', "Hello, I am Riyad Hossain"); // From three-effects.js
                initRotatingTagline( // From ui-components.js
                    'rotating-tagline-container',
                    [
                        "A Digital Architect crafting immersive web experiences.",
                        "An AI Explorer, delving into the future of intelligent systems.",
                        "A Quantum Enthusiast, fascinated by the universe's deepest principles.",
                        "Constantly learning, building, and innovating."
                    ],
                    4000
                );
                stepperCleanup = initStepper('contact-stepper-container'); // From ui-components.js
                tasbeehCounterCleanup = initTasbeehCounter('tasbeeh-counter-container'); // From ui-components.js
                cardSwiperCleanup = initCardSwiper('projects-swiper-container'); // From ui-components.js
            }, 0);
            break;
        case 'news':
            pageHtml = getNewsPageHtml(); // From ui-components.js
            // After rendering, attach event listener for news button
            setTimeout(() => {
                const fetchNewsBtn = document.getElementById('fetch-news-btn');
                if (fetchNewsBtn) {
                    fetchNewsBtn.onclick = fetchNewsArticles; // From ui-components.js
                    fetchNewsBtn.disabled = appState.isLoadingNews;
                    fetchNewsBtn.textContent = appState.isLoadingNews ? 'Generating...' : 'Get New News';
                }
            }, 0);
            break;
        case 'ai-llm':
            pageHtml = getAILLMPageHtml(); // From ui-components.js
            break;
        case 'ai-agent':
            pageHtml = getAIAgentPageHtml(); // From ui-components.js
            break;
        case 'knowledge':
            pageHtml = getKnowledgePageHtml(); // From ui-components.js
            // After rendering, attach event listener for fun fact button
            setTimeout(() => {
                const funFactBtn = document.getElementById('fetch-fun-fact-btn');
                if (funFactBtn) {
                    funFactBtn.onclick = fetchFunFact; // From ui-components.js
                    funFactBtn.disabled = appState.isLoadingFact;
                    funFactBtn.textContent = appState.isLoadingFact ? 'Generating...' : 'Get a New Fun Fact';
                }
                const funFactText = document.getElementById('fun-fact-text');
                if (funFactText) {
                    funFactText.textContent = appState.isLoadingFact ? 'Loading a fascinating fact...' : appState.funFact || 'Click the button to get a fun fact!';
                }
            }, 0);
            break;
        default:
            pageHtml = getHomePageHtml(); // From ui-components.js
    }
    mainContentDiv.innerHTML = pageHtml;

    // If on knowledge page and no fun fact, fetch one
    if (appState.currentPage === 'knowledge' && !appState.funFact && !appState.isLoadingFact) {
        fetchFunFact(); // From ui-components.js
    }
    // If on news page and no news, fetch news
    if (appState.currentPage === 'news' && appState.newsArticles.length === 0 && !appState.isLoadingNews) {
        fetchNewsArticles(); // From ui-components.js
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    mainContentDiv = document.getElementById('main-content');
    navLinksDiv = document.getElementById('circuit-nav-links');

    document.getElementById('current-year').textContent = new Date().getFullYear();

    initParticlesBackground('particles-background-container'); // From three-effects.js

    // Initialize circuit navigation and get the update function
    // This initCircuitNavigation is from ui-components.js
    // It will set up the nav items and return a function to update their active state.
    // This returned function is assigned to the global updateActiveCircuitNode.
    updateActiveCircuitNode = initCircuitNavigation('circuit-nav-links');

    renderApp(); // Initial render of the application
});
