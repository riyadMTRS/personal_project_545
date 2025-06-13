// --- Typing Effect Logic (No longer used for hero text, but kept for reference) ---
function initTypingEffect(elementId, text, speed = 100) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`TypingEffect: Element with ID '${elementId}' not found.`);
        return;
    }
    element.textContent = ''; // Clear existing text
    element.classList.add('typing-text'); // Add typing animation class

    let i = 0;
    const type = () => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            // Remove typing cursor after typing is complete
            element.classList.remove('typing-text');
        }
    };
    type();
}

// --- Rotating Tagline Effect Logic ---
function initRotatingTagline(containerId, texts, interval = 3000) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`RotatingTagline: Container with ID '${containerId}' not found.`);
        return;
    }

    let currentTextIndex = 0;
    let textElements = []; // To hold multiple elements for smooth transition

    // Create initial text element
    let initialTextElement = document.createElement('span');
    initialTextElement.className = 'rotating-tagline-content active';
    initialTextElement.textContent = texts[currentTextIndex];
    container.appendChild(initialTextElement);
    textElements.push(initialTextElement);

    const updateText = () => {
        // Create new element for the next text
        const newTextElement = document.createElement('span');
        newTextElement.className = 'rotating-tagline-content';
        currentTextIndex = (currentTextIndex + 1) % texts.length;
        newTextElement.textContent = texts[currentTextIndex];
        container.appendChild(newTextElement);
        textElements.push(newTextElement);

        // Fade out old elements
        textElements.forEach(el => {
            if (el !== newTextElement) {
                el.classList.remove('active');
            }
        });

        // Fade in new element
        setTimeout(() => {
            newTextElement.classList.add('active');
        }, 50); // Small delay to ensure transition applies

        // Remove old elements after their transition
        setTimeout(() => {
            while (textElements.length > 1) {
                const oldEl = textElements.shift();
                if (oldEl.parentNode === container) {
                    container.removeChild(oldEl);
                }
            }
        }, 500); // Match CSS transition duration
    };

    setInterval(updateText, interval);
}

// --- Circuit Board Navigation Logic ---
function initCircuitNavigation(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`CircuitNavigation: Container with ID '${containerId}' not found.`);
        return;
    }

    const navItemsData = [
        { name: 'Home', page: 'home' },
        { name: 'News', page: 'news' },
        { name: 'LLMs', page: 'ai-llm' },
        { name: 'Agents', page: 'ai-agent' },
        { name: 'Hub', page: 'knowledge' }
    ];

    // Clear existing content
    container.innerHTML = '';

    // Create node wrappers and nodes
    const nodeElements = navItemsData.map(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'circuit-node-wrapper';

        const label = document.createElement('div');
        label.className = 'circuit-node-label';
        label.textContent = item.name;
        wrapper.appendChild(label);

        const button = document.createElement('button');
        button.className = `circuit-node`;
        button.dataset.page = item.page;
        button.textContent = item.name; // Text inside the node
        wrapper.appendChild(button);

        return wrapper;
    });

    nodeElements.forEach(node => container.appendChild(node));

    // Create traces between nodes
    const traces = [];
    for (let i = 0; i < nodeElements.length - 1; i++) {
        const node1 = nodeElements[i].querySelector('.circuit-node');
        const node2 = nodeElements[i + 1].querySelector('.circuit-node');

        const trace = document.createElement('div');
        trace.className = 'circuit-trace';
        container.appendChild(trace); // Append to the same container as nodes
        traces.push({ element: trace, node1: node1, node2: node2 });
    }

    const updateTracesPosition = () => {
        traces.forEach(trace => {
            const rect1 = trace.node1.getBoundingClientRect();
            const rect2 = trace.node2.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const x1 = rect1.left + rect1.width / 2 - containerRect.left;
            const y1 = rect1.top + rect1.height / 2 - containerRect.top;
            const x2 = rect2.left + rect2.width / 2 - containerRect.left;
            const y2 = rect2.top + rect2.height / 2 - containerRect.top;

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            trace.element.style.width = `${length}px`;
            trace.element.style.left = `${x1}px`;
            trace.element.style.top = `${y1 - trace.element.offsetHeight / 2}px`; // Center vertically
            trace.element.style.transform = `rotate(${angle}deg)`;
            trace.element.style.transformOrigin = `0 50%`; // Rotate from the left edge
        });
    };

    // Initial positioning and update on resize
    window.addEventListener('resize', updateTracesPosition);
    setTimeout(updateTracesPosition, 0); // Call once after initial render

    // Add hover/active logic
    nodeElements.forEach((wrapper, index) => {
        const button = wrapper.querySelector('.circuit-node');
        button.onclick = () => navigateTo(button.dataset.page); // navigateTo will be in main.js

        button.addEventListener('mouseenter', () => {
            // Highlight current node
            button.classList.add('hovered');
            // Highlight adjacent traces
            if (index > 0) {
                traces[index - 1].element.classList.add('hovered');
            }
            if (index < traces.length) {
                traces[index].element.classList.add('hovered');
            }
        });

        button.addEventListener('mouseleave', () => {
            // Remove highlight from current node
            button.classList.remove('hovered');
            // Remove highlight from adjacent traces
            if (index > 0) {
                traces[index - 1].element.classList.remove('hovered');
            }
            if (index < traces.length) {
                traces[index].element.classList.remove('hovered');
            }
        });
    });

    // Function to update active state - this will be assigned to the global updateActiveCircuitNode
    const updateActiveNode = () => {
        nodeElements.forEach(wrapper => {
            const button = wrapper.querySelector('.circuit-node');
            const isActive = appState.currentPage === button.dataset.page; // appState will be in main.js
            button.classList.toggle('active', isActive);

            // Also activate traces connected to the active node
            const index = navItemsData.findIndex(item => item.page === button.dataset.page);
            if (isActive) {
                if (index > 0) {
                    traces[index - 1].element.classList.add('active');
                }
                if (index < traces.length) {
                    traces[index].element.classList.add('active');
                }
            } else {
                if (index > 0) {
                    traces[index - 1].element.classList.remove('active');
                }
                if (index < traces.length) {
                    traces[index].element.classList.remove('active');
                }
            }
        });
    };

    // Initial active state setup
    updateActiveNode();

    // Return update function for renderApp to call/assign
    return updateActiveNode;
}

// --- Stepper Logic (Vanilla JS adaptation) ---
function initStepper(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Stepper: Container with ID '${containerId}' not found.`);
        return;
    }

    const stepsData = [
        {
            title: "Your Info",
            content: `
                <div class="space-y-4">
                    <input type="text" placeholder="Your Name" class="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                    <input type="email" placeholder="Your Email" class="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
            `
        },
        {
            title: "Your Message",
            content: `
                <div class="space-y-4">
                    <input type="text" placeholder="Subject" class="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                    <textarea placeholder="Your Message" rows="5" class="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                </div>
            `
        },
        {
            title: "Confirmation",
            content: `
                <div class="text-center py-8">
                    <p class="text-lg text-green-400 font-semibold mb-4">Thank you for your message!</p>
                    <p class="text-gray-300">We will get back to you as soon as possible.</p>
                    <p class="text-gray-500 text-sm mt-2">You can now close this form or navigate away.</p>
                </div>
            `
        }
    ];
    const totalSteps = stepsData.length;

    let stepperCurrentStep = appState.stepperCurrentStep; // appState from main.js
    let stepperDirection = appState.stepperDirection; // appState from main.js

    const renderStepper = () => {
        const isCompleted = stepperCurrentStep > totalSteps;
        const isLastStep = stepperCurrentStep === totalSteps;

        // Build Step Indicators
        const stepIndicatorsHtml = stepsData.map((step, index) => {
            const stepNumber = index + 1;
            const status = stepperCurrentStep === stepNumber ? "active" : stepperCurrentStep < stepNumber ? "inactive" : "complete";
            const isNotLastStep = index < totalSteps - 1;

            return `
                <div class="stepper-step-indicator ${status}" data-step="${stepNumber}">
                    <div class="stepper-step-indicator-inner">
                        ${status === "complete" ? `<svg class="stepper-check-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : status === "active" ? `<div class="stepper-active-dot"></div>` : `<span class="stepper-step-number">${stepNumber}</span>`}
                    </div>
                </div>
                ${isNotLastStep ? `<div class="stepper-step-connector ${stepperCurrentStep > stepNumber ? 'complete' : ''}"><div class="stepper-step-connector-inner"></div></div>` : ''}
            `;
        }).join('');

        // Build Step Content
        const currentStepContentHtml = isCompleted ? '' : stepsData[stepperCurrentStep - 1].content;

        // Build Footer
        const footerHtml = !isCompleted ? `
            <div class="stepper-footer-container">
                <div class="stepper-footer-nav ${stepperCurrentStep !== 1 ? "spread" : "end"}">
                    ${stepperCurrentStep !== 1 ? `<button id="stepper-back-btn" class="stepper-button stepper-back-button">Back</button>` : ''}
                    <button id="stepper-next-btn" class="stepper-button stepper-next-button">
                        ${isLastStep ? "Complete" : "Continue"}
                    </button>
                </div>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="stepper-step-circle-container">
                <div class="stepper-step-indicator-row">
                    ${stepIndicatorsHtml}
                </div>
                <div id="stepper-content-wrapper" class="stepper-step-content-wrapper">
                    <div id="stepper-current-step-content" class="stepper-step-content">
                        ${currentStepContentHtml}
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;

        // Attach Event Listeners
        container.querySelectorAll('.stepper-step-indicator').forEach(indicator => {
            indicator.onclick = (e) => {
                const clickedStep = parseInt(e.currentTarget.dataset.step);
                if (clickedStep !== stepperCurrentStep) {
                    stepperDirection = clickedStep > stepperCurrentStep ? 1 : -1;
                    stepperCurrentStep = clickedStep;
                    appState.stepperCurrentStep = stepperCurrentStep; // Update global state
                    appState.stepperDirection = stepperDirection; // Update global state
                    renderStepper();
                }
            };
        });

        const backBtn = document.getElementById('stepper-back-btn');
        if (backBtn) {
            backBtn.onclick = () => {
                if (stepperCurrentStep > 1) {
                    stepperDirection = -1;
                    stepperCurrentStep--;
                    appState.stepperCurrentStep = stepperCurrentStep;
                    appState.stepperDirection = stepperDirection;
                    renderStepper();
                }
            };
        }

        const nextBtn = document.getElementById('stepper-next-btn');
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (!isLastStep) {
                    stepperDirection = 1;
                    stepperCurrentStep++;
                    appState.stepperCurrentStep = stepperCurrentStep;
                    appState.stepperDirection = stepperDirection;
                    renderStepper();
                } else {
                    // Handle completion
                    stepperDirection = 1;
                    stepperCurrentStep++; // Move past last step to indicate completion
                    appState.stepperCurrentStep = stepperCurrentStep;
                    appState.stepperDirection = stepperDirection;
                    renderStepper(); // Re-render to show completion message
                }
            };
        }

        // Handle content transitions and height
        const contentWrapper = document.getElementById('stepper-content-wrapper');
        const currentContentDiv = document.getElementById('stepper-current-step-content');

        if (contentWrapper && currentContentDiv) {
            // Apply transition classes
            currentContentDiv.classList.remove('enter-right', 'enter-left', 'exit-right', 'exit-left', 'center');
            if (stepperDirection === 1) { // Moving next
                currentContentDiv.classList.add('enter-right');
                setTimeout(() => {
                    currentContentDiv.classList.remove('enter-right');
                    currentContentDiv.classList.add('center');
                }, 50); // Small delay for transition to apply
            } else if (stepperDirection === -1) { // Moving back
                currentContentDiv.classList.add('enter-left');
                setTimeout(() => {
                    currentContentDiv.classList.remove('enter-left');
                    currentContentDiv.classList.add('center');
                }, 50);
            } else { // Initial load or direct navigation
                currentContentDiv.classList.add('center');
            }

            // Adjust wrapper height after content is rendered and transitioned
            setTimeout(() => {
                if (currentContentDiv.offsetHeight > 0) {
                    contentWrapper.style.height = `${currentContentDiv.offsetHeight}px`;
                } else if (isCompleted) {
                    contentWrapper.style.height = '0px';
                }
            }, 100);
        }
    };

    renderStepper();
    return renderStepper;
}


// --- Tasbeeh Counter Logic (Vanilla JS adaptation) ---
function initTasbeehCounter(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`TasbeehCounter: Container with ID '${containerId}' not found.`);
        return;
    }

    let tasbeehCount = appState.tasbeehCount; // appState from main.js
    const fontSize = 48;
    const height = fontSize * 1.2;

    const renderCounter = () => {
        const countString = String(tasbeehCount).padStart(3, '0');
        const digitsHtml = countString.split('').map(digitChar => {
            const digitValue = parseInt(digitChar);
            const translateY = -digitValue * height;
            return `
                <div class="tasbeeh-digit-wrapper" style="height: ${height}px; width: ${fontSize * 0.6}px;">
                    <div class="tasbeeh-digit-numbers" style="transform: translateY(${translateY}px);">
                        ${Array.from({ length: 10 }, (_, i) => `<span class="tasbeeh-digit-number" style="height: ${height}px;">${i}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="tasbeeh-display" style="font-size: ${fontSize}px;">
                ${digitsHtml}
            </div>
            <div class="tasbeeh-buttons">
                <button id="tasbeeh-count-btn" class="tasbeeh-button">Count</button>
                <button id="tasbeeh-reset-btn" class="tasbeeh-button tasbeeh-reset-button">Reset</button>
            </div>
        `;

        document.getElementById('tasbeeh-count-btn').onclick = () => {
            tasbeehCount++;
            appState.tasbeehCount = tasbeehCount;
            renderCounter();
        };

        document.getElementById('tasbeeh-reset-btn').onclick = () => {
            tasbeehCount = 0;
            appState.tasbeehCount = tasbeehCount;
            renderCounter();
        };
    };

    renderCounter();
    return renderCounter;
}

// --- Card Swiper Logic (New) ---
function initCardSwiper(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`CardSwiper: Container with ID '${containerId}' not found.`);
        return;
    }

    const projectData = [
        {
            title: "AI Chatbot Platform",
            description: "Developed a scalable AI chatbot platform using Gemini API for enhanced customer support and lead generation.",
            image: "https://placehold.co/300x200/00E600/1A1A1A?text=AI+Chatbot",
            link: "#"
        },
        {
            title: "Quantum Computing Simulator",
            description: "Built a basic quantum circuit simulator visualizing qubit states and entanglement using Three.js.",
            image: "https://placehold.co/300x200/90EE90/1A1A1A?text=Quantum+Sim",
            link: "#"
        },
        {
            title: "Decentralized Identity System",
            description: "Prototyped a blockchain-based decentralized identity management system for secure user authentication.",
            image: "https://placehold.co/300x200/00CC00/1A1A1A?text=Decentralized+ID",
            link: "#"
        },
        {
            title: "Smart Home Automation",
            description: "Designed and implemented a smart home system with voice control and IoT device integration.",
            image: "https://placehold.co/300x200/00A000/1A1A1A?text=Smart+Home",
            link: "#"
        }
    ];

    let currentCardIndex = appState.currentCardIndex; // appState from main.js
    const totalCards = projectData.length;

    const renderCards = () => {
        container.innerHTML = '';

        container.innerHTML = `
            <button id="swiper-prev-btn" class="swiper-nav-button left">&#10094;</button>
            <button id="swiper-next-btn" class="swiper-nav-button right">&#10095;</button>
        `;

        projectData.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'swiper-card';
            card.innerHTML = `
                <img src="${project.image}" alt="${project.title}" class="swiper-card-image" onerror="this.onerror=null;this.src='https://placehold.co/300x200/CCCCCC/000000?text=Image+Error';">
                <h3 class="swiper-card-title">${project.title}</h3>
                <p class="swiper-card-description">${project.description}</p>
                <a href="${project.link}" class="swiper-card-link" target="_blank" rel="noopener noreferrer">View Project</a>
            `;
            container.appendChild(card);
        });

        updateCardPositions();

        document.getElementById('swiper-prev-btn').onclick = showPrevCard;
        document.getElementById('swiper-next-btn').onclick = showNextCard;
    };

    const updateCardPositions = () => {
        const cards = Array.from(container.querySelectorAll('.swiper-card'));
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev', 'next', 'hidden');

            if (index === currentCardIndex) {
                card.classList.add('active');
            } else if (index === (currentCardIndex - 1 + totalCards) % totalCards) {
                card.classList.add('prev');
            } else if (index === (currentCardIndex + 1) % totalCards) {
                card.classList.add('next');
            } else {
                card.classList.add('hidden');
            }
        });
    };

    const showNextCard = () => {
        currentCardIndex = (currentCardIndex + 1) % totalCards;
        appState.currentCardIndex = currentCardIndex;
        updateCardPositions();
    };

    const showPrevCard = () => {
        currentCardIndex = (currentCardIndex - 1 + totalCards) % totalCards;
        appState.currentCardIndex = currentCardIndex;
        updateCardPositions();
    };

    renderCards();
    return renderCards;
}


// --- Page Content Functions ---
function getHomePageHtml() {
    return `
        <section class="text-center py-16 md:py-24 animate-fade-in">
            <div id="hero-text-effect-container" class="text-4xl md:text-6xl lg:text-7xl font-extrabold text-green-400 mb-4">
                <!-- Three.js canvas for text effect will be injected here -->
            </div>
            <div id="rotating-tagline-container" class="rotating-tagline-container text-lg md:text-xl max-w-3xl mx-auto">
                <!-- Rotating taglines will be rendered here by JavaScript -->
            </div>
            <div class="mt-8 flex justify-center space-x-4">
                <a href="#" class="btn-glow py-3 px-6 rounded-lg shadow-lg font-bold transition-transform transform hover:scale-105">
                    My Projects
                </a>
                <a href="#" class="btn-glow py-3 px-6 rounded-lg shadow-lg font-bold transition-transform transform hover:scale-105">
                    Contact Me
                </a>
            </div>

            <!-- My Projects Section with Card Swiper -->
            <section class="py-16">
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">My Projects</h2>
                <div id="projects-swiper-container" class="projects-swiper-container">
                    <!-- Cards and buttons will be injected here by JavaScript -->
                </div>
            </section>

            <!-- New Stepper Section -->
            <section class="py-16">
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Get in Touch</h2>
                <div id="contact-stepper-container" class="stepper-outer-container">
                    <!-- Stepper will be injected here by JavaScript -->
                </div>
            </section>

            <!-- New Tasbeeh Counter Section -->
            <section class="py-16">
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Digital Tasbeeh Counter</h2>
                <div id="tasbeeh-counter-container" class="tasbeeh-container">
                    <!-- Tasbeeh Counter will be injected here by JavaScript -->
                </div>
            </section>
        </section>
    `;
}

function getNewsPageHtml() {
    const newsContent = appState.newsArticles.length > 0  // appState from main.js
        ? appState.newsArticles.map(article => getNewsCardHtml(article.title, article.date, article.description, article.link || '#')).join('')
        : `<div class="col-span-full text-center text-gray-400 p-4 border border-dashed border-gray-700 rounded-lg">
            ${appState.isLoadingNews ? 'Generating AI news...' : 'No news articles available. Click "Get New News" to generate some!'}
           </div>`;

    return `
        <section class="py-8 animate-fade-in">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Latest in News</h2>
            <div class="text-center mb-8">
                <button id="fetch-news-btn" class="btn-glow py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${appState.isLoadingNews ? 'opacity-50 cursor-not-allowed' : ''}" ${appState.isLoadingNews ? 'disabled' : ''}>
                    ${appState.isLoadingNews ? 'Generating...' : 'Get New News'}
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${newsContent}
            </div>
        </section>
    `;
}

function getNewsCardHtml(title, date, description, link) {
    return `
        <div class="card-glow rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <h3 class="text-xl font-semibold text-green-300 mb-2">${title}</h3>
            <p class="text-sm text-gray-500 mb-3">${date}</p>
            <p class="text-gray-300 mb-4">${description}</p>
            <a href="${link}" class="text-green-400 hover:text-green-300 font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">
                Read More &rarr;
            </a>
        </div>
    `;
}

function getAILLMPageHtml() {
    return `
        <section class="py-8 animate-fade-in">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Large Language Models (LLMs)</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${getLLMCardHtml("Gemini", "Multimodal", "Google's family of multimodal large language models, designed for various tasks from text generation to image understanding.", "https://gemini.google.com/")}
                ${getLLMCardHtml("GPT-4", "General Purpose", "OpenAI's advanced large language model, known for its strong reasoning and generation capabilities.", "https://openai.com/gpt-4")}
                ${getLLMCardHtml("Llama 3", "Open Source", "Meta AI's powerful open-source large language model, available in various sizes for diverse applications.", "https://llama.meta.com/")}
                ${getLLMCardHtml("Claude 3", "Conversational", "Anthropic's family of models, designed for helpful, harmless, and honest AI interactions.", "https://www.anthropic.com/news/claude-3")}
                ${getLLMCardHtml("Falcon 180B", "Open Source", "A large-scale open-source language model from Technology Innovation Institute (TII), known for its strong performance.", "https://falconllm.tii.ae/")}
                ${getLLMCardHtml("Mistral 7B", "Open Source", "A powerful and efficient language model from Mistral AI, optimized for performance and cost-effectiveness.", "https://mistral.ai/news/announcing-mistral-7b/")}
                ${getLLMCardHtml("Cohere Command", "Enterprise AI", "Cohere's flagship language model designed for enterprise applications, offering strong performance in various business contexts.", "https://cohere.com/models/command")}
                <div class="col-span-full text-center text-gray-400 p-4 border border-dashed border-gray-700 rounded-lg">
                    Exploring more LLMs and their unique applications!
                </div>
            </div>
        </section>
    `;
}

function getLLMCardHtml(name, category, description, link) {
    return `
        <div class="card-glow rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <h3 class="text-xl font-semibold text-cyan-300 mb-2">${name}</h3>
            <p class="text-sm text-gray-500 mb-3">Category: ${category}</p>
            <p class="text-gray-300 mb-4">${description}</p>
            <a href="${link}" class="text-green-400 hover:text-green-300 font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">
                Learn More &rarr;
            </a>
        </div>
    `;
}

function getAIAgentPageHtml() {
    return `
        <section class="py-8 animate-fade-in">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Agents</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${getAIAgentCardHtml("Auto-GPT", "Autonomous Task Agent", "An experimental open-source attempt to make GPT-4 fully autonomous, capable of achieving goals without human intervention.", "https://github.com/Significant-Gravitas/Auto-GPT")}
                ${getAIAgentCardHtml("BabyAGI", "Task Management Agent", "A simplified version of an AI agent that focuses on creating, prioritizing, and executing tasks.", "https://github.com/yoheinakajima/babyagi")}
                ${getAIAgentCardHtml("LangChain Agents", "Framework Agents", "Agents built using the LangChain framework, capable of using tools to interact with the world and achieve complex goals.", "https://www.langchain.com/agents")}
                ${getAIAgentCardHtml("SuperAGI", "Autonomous AI Platform", "An open-source platform for building, deploying, and managing autonomous AI agents.", "https://superagi.com/")}
                ${getAIAgentCardHtml("AgentGPT", "No-Code Agent Builder", "Allows users to configure and deploy autonomous AI agents directly from their browser, without coding.", "https://agentgpt.reworkd.ai/")}
                ${getAIAgentCardHtml("MetaGPT", "Multi-Agent Framework", "A multi-agent framework that assigns different roles to LLMs to simulate a software development team.", "https://github.com/deepmind/metagpt")}
                <div class="col-span-full text-center text-gray-400 p-4 border border-dashed border-gray-700 rounded-lg">
                    Discovering and documenting more innovative AI agents!
                </div>
            </div>
        </section>
    `;
}

function getAIAgentCardHtml(name, category, description, link) {
    return `
        <div class="card-glow rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <h3 class="text-xl font-semibold text-blue-300 mb-2">${name}</h3>
            <p class="text-sm text-gray-500 mb-3">Category: ${category}</p>
            <p class="text-gray-300 mb-4">${description}</p>
            <a href="${link}" class="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">
                Explore &rarr;
            </a>
        </div>
    `;
}

function getKnowledgePageHtml() {
    return `
        <section class="py-8 animate-fade-in">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Hub</h2>

            <!-- Fun Fact Section -->
            <div class="card-glow rounded-xl shadow-lg p-6 mb-8">
                <h3 class="text-2xl font-semibold text-yellow-300 mb-4">Did You Know?</h3>
                <p id="fun-fact-text" class="text-gray-300 text-lg mb-4">
                    ${appState.isLoadingFact ? 'Loading a fascinating fact...' : appState.funFact || 'Click the button to get a fun fact!'}
                </p>
                <button id="fetch-fun-fact-btn" class="btn-glow py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${appState.isLoadingFact ? 'opacity-50 cursor-not-allowed' : ''}" ${appState.isLoadingFact ? 'disabled' : ''}>
                    ${appState.isLoadingFact ? 'Generating...' : 'Get a New Fun Fact'}
                </button>
            </div>

            <!-- Pi Calculation Section -->
            <div class="card-glow rounded-xl shadow-lg p-6 mb-8">
                <h3 class="text-2xl font-semibold text-purple-300 mb-4">The Marvel of Pi ($\pi$)</h3>
                <p class="text-gray-300 mb-4">
                    Did you know Pi ($\pi$) is an irrational number, meaning its decimal representation never ends and never repeats? It's the ratio of a circle's circumference to its diameter, approximately $3.14159$. Mathematicians have calculated Pi to trillions of digits!
                </p>
                <p class="text-gray-400 text-sm">
                    <a href="https://en.wikipedia.org/wiki/Pi" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:underline">Learn more about Pi</a>
                </p>
            </div>

            <!-- Other Knowledge Sections -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                ${getKnowledgeCardHtml("History of the Internet", "From ARPANET to the World Wide Web, explore the fascinating journey of how the internet came to be and evolved into what it is today.", "https://en.wikipedia.org/wiki/History_of_the_Internet")}
                ${getKnowledgeCardHtml("Space Related Content", "Dive into the cosmos: black holes, exoplanets, nebulae, and the latest discoveries from space telescopes and missions.", "https://en.wikipedia.org/wiki/Space_exploration")}
                ${getKnowledgeCardHtml("Quantum Computing Explained", "Unravel the mysteries of quantum mechanics applied to computing. Learn about qubits, superposition, entanglement, and their potential." , "https://en.wikipedia.org/wiki/Quantum_computing")}
                ${getKnowledgeCardHtml("IT Explained", "Demystifying information technology: networks, databases, cybersecurity, operating systems, and the infrastructure that powers our digital world.", "https://en.wikipedia.org/wiki/Information_technology")}
                ${getKnowledgeCardHtml("Critical Math & Computer Problems", "Explore some of the most challenging problems in mathematics and computer science, their significance, and proposed solutions (or why they remain unsolved).", "https://en.wikipedia.org/wiki/Unsolved_problems_in_mathematics")}
                ${getKnowledgeCardHtml("Computer Science Fundamentals", "A journey through algorithms, data structures, programming paradigms, and the theoretical foundations of computation.", "https://en.wikipedia.org/wiki/Computer_science")}
            </div>
        </section>
    `;
}

function getKnowledgeCardHtml(title, content, link) {
    return `
        <div class="card-glow rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold text-orange-300 mb-2">${title}</h3>
            <p class="text-gray-300 mb-4">${content}</p>
            <a href="${link}" class="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">
                Explore Topic &rarr;
            </a>
        </div>
    `;
}

async function fetchFunFact() {
    appState.isLoadingFact = true; // appState from main.js
    appState.funFact = 'Generating a fun fact...';
    renderApp(); // renderApp from main.js

    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: "Tell me a very short, interesting, and lesser-known fun fact about technology or science." }] });
        const payload = { contents: chatHistory };
        // TODO: Add your Gemini API Key here. For example: const apiKey = "YOUR_API_KEY";
        const apiKey = "";
        if (!apiKey) {
            console.warn("API key is missing for fetchFunFact. Please add it to js/ui-components.js");
            appState.funFact = "API Key needed to fetch fun facts. Please add your Gemini API key in js/ui-components.js.";
            appState.isLoadingFact = false;
            if (typeof renderApp === 'function') { // renderApp is in main.js, ensure it's callable
                renderApp();
            }
            return; // Stop further execution
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            appState.funFact = text;
        } else {
            appState.funFact = 'Could not generate a fun fact. Please try again.';
        }
    } catch (error) {
        console.error("Error fetching fun fact:", error);
        appState.funFact = 'Failed to load fun fact. Please check your connection or API key.';
    } finally {
        appState.isLoadingFact = false;
        if (typeof renderApp === 'function') {
            renderApp();
        }
    }
}

async function fetchNewsArticles() {
    appState.isLoadingNews = true; // appState from main.js
    appState.newsArticles = [];
    renderApp(); // renderApp from main.js

    try {
        let chatHistory = [];
        chatHistory.push({
            role: "user",
            parts: [{
                text: `Generate 3 short, concise, and recent (as of June 2025) AI news headlines with a brief description and a highly relevant, valid external link (URL) based on the content of the news.
                       Provide the output as a JSON array of objects, each with 'title', 'date', 'description', and 'link' properties.
                       Example: [{"title": "AI Breakthrough", "date": "June 1, 2025", "description": "New AI model achieves...", "link": "https://example.com/ai-breakthrough"}]`
            }]
        });
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "title": { "type": "STRING" },
                            "date": { "type": "STRING" },
                            "description": { "type": "STRING" },
                            "link": { "type": "STRING" }
                        },
                        "propertyOrdering": ["title", "date", "description", "link"]
                    }
                }
            }
        };
        // TODO: Add your Gemini API Key here. For example: const apiKey = "YOUR_API_KEY";
        const apiKey = "";
        if (!apiKey) {
            console.warn("API key is missing for fetchNewsArticles. Please add it to js/ui-components.js");
            appState.newsArticles = [{ title: "API Key Needed", date: "", description: "Please add your Gemini API key in js/ui-components.js to fetch news.", link: "#" }];
            appState.isLoadingNews = false;
            if (typeof renderApp === 'function') { // renderApp is in main.js, ensure it's callable
                renderApp();
            }
            return; // Stop further execution
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            try {
                const parsedNews = JSON.parse(jsonString);
                if (Array.isArray(parsedNews)) {
                    appState.newsArticles = parsedNews;
                } else {
                    console.error("API response is not an array:", parsedNews);
                    appState.newsArticles = [{ title: "Error", date: "", description: "Failed to parse news articles.", link: "#" }];
                }
            } catch (parseError) {
                console.error("Error parsing news JSON:", parseError, jsonString);
                appState.newsArticles = [{ title: "Error", date: "", description: "Failed to parse news articles.", link: "#" }];
            }
        } else {
            appState.newsArticles = [{ title: "No News", date: "", description: "Could not generate news articles. Please try again.", link: "#" }];
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        appState.newsArticles = [{ title: "Error Fetching News", date: "", description: "Failed to load news. Please check your connection or API key.", link: "#" }];
    } finally {
        appState.isLoadingNews = false;
        if (typeof renderApp === 'function') {
            renderApp();
        }
    }
}
