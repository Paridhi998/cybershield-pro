/** 
 * --- AUTHENTICATION MANAGER ---
 */
const AuthManager = (() => {
    const state = {
        token: localStorage.getItem('cs_token'),
        user: null
    };

    const init = () => {
        const loginTrigger = document.getElementById('loginTrigger');
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginTrigger) loginTrigger.onclick = () => showModal(true);
        if (loginBtn) loginBtn.onclick = () => handleAuth('login');
        if (signupBtn) signupBtn.onclick = () => handleAuth('register');
        if (logoutBtn) logoutBtn.onclick = logout;

        if (state.token) fetchUser();
    };

    const showModal = (show) => {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.toggle('hidden', !show);
        const errorBar = document.getElementById('authError');
        if (errorBar) errorBar.innerText = '';
    };

    const handleAuth = async (type) => {
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;
        const errorBar = document.getElementById('authError');

        try {
            const res = await fetch(`/api/auth/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.error) {
                errorBar.innerText = data.error;
            } else {
                localStorage.setItem('cs_token', data.token);
                state.token = data.token;
                location.reload(); 
            }
        } catch (e) {
            errorBar.innerText = 'Server connection failed.';
        }
    };

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/user', {
                headers: { 'x-auth-token': state.token }
            });
            if (res.status === 401) return logout();
            state.user = await res.json();
            updateUI();
            GameManager.syncWithServer(); 
        } catch (e) {
            console.error("Auth: Failed to fetch user.");
        }
    };

    const updateUI = () => {
        const authNav = document.getElementById('authNav');
        const userNav = document.getElementById('userNav');
        const usernameDisplay = document.getElementById('usernameDisplay');
        
        if (authNav) authNav.classList.add('hidden');
        if (userNav) userNav.classList.remove('hidden');
        if (usernameDisplay) usernameDisplay.innerText = state.user.username;
        showModal(false);
    };

    const logout = () => {
        localStorage.removeItem('cs_token');
        location.reload();
    };

    return { init, state };
})();

/** 
 * --- GAMIFICATION ENGINE v3 (Full-Stack) ---
 */
const FRONTEND_MODULES = [
    { id: 1, title: "Digital Foundations", icon: "🛡️", xp: 100, desc: "Basics of safety" },
    { id: 2, title: "The Art of Phishing", icon: "🎣", xp: 150, desc: "Spotting the hook" },
    { id: 3, title: "Bulletproof Credentials", icon: "🔑", xp: 150, desc: "Mastering MFA" },
    { id: 4, title: "Cyber Guardian", icon: "💎", xp: 200, desc: "Advanced defense" }
];

const GameManager = (() => {
    let serverState = null;

    const syncWithServer = async () => {
        if (!AuthManager.state.token) return renderQuestPath(); 

        try {
            const res = await fetch('/api/learn/status', {
                headers: { 'x-auth-token': AuthManager.state.token }
            });
            serverState = await res.json();
            updateDashboard();
            renderQuestPath();
        } catch (e) {
            console.error("Game: Sync failed.");
        }
    };

    const updateDashboard = () => {
        if (!serverState) return;

        const thresholds = [0, 150, 350, 600];
        const xpForNext = thresholds[serverState.level] || 600;

        document.getElementById('currentXP').innerText = serverState.xp;
        document.getElementById('nextLevelXP').innerText = xpForNext;
        document.getElementById('userLevel').innerText = serverState.level;
        document.getElementById('xpFill').style.width = `${Math.min((serverState.xp / xpForNext) * 100, 100)}%`;

        const ranks = ["Script Kiddie", "Novice Defender", "Cyberspace Scout", "System Sentinel", "Cyber Guardian"];
        document.getElementById('userRank').innerText = ranks[Math.min(serverState.level - 1, ranks.length - 1)];

        document.querySelectorAll('.badge-icon').forEach((icon, i) => {
            icon.classList.toggle('earned', serverState.completedModules.includes(i + 1));
        });
    };

    const renderQuestPath = () => {
        const pathContainer = document.getElementById('questPath');
        if (!pathContainer) return;
        pathContainer.innerHTML = '';

        FRONTEND_MODULES.forEach((mod, index) => {
            const isUnlocked = !serverState ? (index === 0) : (index === 0 || serverState.completedModules.includes(FRONTEND_MODULES[index - 1].id));
            const isCompleted = serverState ? serverState.completedModules.includes(mod.id) : false;

            const node = document.createElement('div');
            node.className = `quest-node ${isUnlocked ? 'unlocked' : 'locked'}`;
            node.innerHTML = `
                <div class="node-icon">${isUnlocked ? mod.icon : '🔒'}</div>
                <div class="node-info">
                  <h4>Module ${mod.id}: ${mod.title}</h4>
                  <p style="font-size: 0.8rem; color: var(--text-muted)">${mod.desc}</p>
                  <span class="node-status ${isCompleted ? 'status-completed' : (isUnlocked ? 'status-unlocked' : 'status-locked')}">
                    ${isCompleted ? '✓ Completed' : (isUnlocked ? 'Available' : 'Locked')}
                  </span>
                </div>
            `;

            node.onclick = () => {
                if (!isUnlocked) return alert("❌ Complete previous modules first.");
                fetchModuleContent(mod.id);
            };
            pathContainer.appendChild(node);
        });
    };

    const fetchModuleContent = async (id) => {
        const mod = FRONTEND_MODULES.find(m => m.id === id);
        document.getElementById('moduleTitle').innerText = mod.title;
        document.getElementById('moduleContent').innerHTML = `<p>Loading secure content...</p>`;
        document.getElementById('moduleOverlay').classList.remove('hidden');

        const staticContent = {
            1: `<h3>Basics of Online Safety</h3><p>Cybersecurity starts with <strong>you</strong>.</p><ul><li>Never reuse passwords.</li><li>Keep software updated.</li></ul>`,
            2: `<h3>Spotting the Hook</h3><p>Phishing uses <strong>Urgency, Fear, or Greed</strong> to trick you.</p>`,
            3: `<h3>Mastering MFA</h3><p>MFA is your strongest defense.</p>`,
            4: `<h3>Advanced Defense</h3><p>Use hardware keys for max security.</p>`
        };
        const quizzes = {
            1: { q: "Which of these is the MOST common initial vector for an attack?", o: ["Social Engineering", "Hardware fail", "Power outage"] },
            2: { q: "What is the primary psychological trigger used in phishing?", o: ["Happiness", "Boredom", "Urgency/Panic"] },
            3: { q: "Does MFA make your account 100% unhackable?", o: ["Yes", "No"] },
            4: { q: "What if you accidentally click a suspicious link?", o: ["Ignore it", "Disconnect, change passwords, scan malware"] }
        };

        document.getElementById('moduleContent').innerHTML = staticContent[id];
        renderQuiz(id, quizzes[id]);
    };

    const renderQuiz = (moduleId, quiz) => {
        document.getElementById('quizSection').classList.remove('hidden');
        document.getElementById('startQuizBtn').classList.add('hidden');
        document.getElementById('completeModuleBtn').classList.add('hidden');

        document.getElementById('quizQuestion').innerText = quiz.q;
        const options = document.getElementById('quizOptions');
        options.innerHTML = '';

        quiz.o.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.innerText = opt;
            btn.onclick = () => submitAnswer(moduleId, idx, btn);
            options.appendChild(btn);
        });
    };

    const submitAnswer = async (moduleId, answerIndex, btn) => {
        try {
            const res = await fetch('/api/learn/complete-module', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': AuthManager.state.token
                },
                body: JSON.stringify({ moduleId, answerIndex })
            });
            const data = await res.json();

            if (data.error) {
                btn.classList.add('incorrect');
                alert(data.error);
            } else {
                btn.classList.add('correct');
                document.getElementById('completeModuleBtn').classList.remove('hidden');
                document.getElementById('completeModuleBtn').onclick = () => {
                    document.getElementById('moduleOverlay').classList.add('hidden');
                    syncWithServer(); 
                };
            }
        } catch (e) {
            alert("Verification failed. Check server connection.");
        }
    };

    return { init: () => { }, syncWithServer };
})();

/**
 * --- CORE UI MODULES ---
 */

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.panel');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href.startsWith('#')) return;
            
            e.preventDefault();
            const targetId = href.substring(1);

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(section => {
                section.classList.toggle('active', section.id === targetId);
                section.classList.toggle('hidden', section.id !== targetId);
            });
        });
    });
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(c => c.classList.toggle('hidden', c.id !== target));
        });
    });
}

let isScanning = false;
let scanTimeout = null;

function initTextScanner() {
    const scanBtn = document.getElementById('scanBtn');
    if (!scanBtn) return;

    scanBtn.onclick = () => {
        if (isScanning) return;
        if (scanTimeout) clearTimeout(scanTimeout);
        
        scanTimeout = setTimeout(async () => {
            const message = document.getElementById('scanInput').value.trim();
            if (!message) return alert("Enter text.");

            isScanning = true;
            scanBtn.disabled = true;
            scanBtn.innerText = "Scanning...";
            showLoading(true);

            try {
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': AuthManager.state.token || '' },
                    body: JSON.stringify({ message })
                });
                const data = await res.json();
                if (data.isFallback) showAIWarning("⚠️ AI temporarily unavailable. Using secure local scan.");
                else hideAIWarning();
                displayResults(data);
            } catch (e) {
                alert("Scan failed.");
            } finally {
                showLoading(false);
                isScanning = false;
                scanBtn.disabled = false;
                scanBtn.innerText = "Scan Message";
            }
        }, 500);
    };

    document.getElementById('clearBtn').onclick = () => {
        document.getElementById('scanInput').value = '';
        document.getElementById('scanResults').classList.add('hidden');
        hideAIWarning();
    };
}

function showAIWarning(msg) {
    let warningBox = document.getElementById('aiWarningBox');
    if (!warningBox) {
        warningBox = document.createElement('div');
        warningBox.id = 'aiWarningBox';
        warningBox.style.background = 'rgba(239, 68, 68, 0.1)';
        warningBox.style.color = '#ef4444';
        warningBox.style.padding = '10px';
        warningBox.style.borderRadius = '8px';
        warningBox.style.marginBottom = '15px';
        warningBox.style.fontSize = '0.8rem';
        warningBox.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        document.getElementById('scanResults').prepend(warningBox);
    }
    warningBox.innerText = msg;
    warningBox.classList.remove('hidden');
}

function hideAIWarning() {
    const warningBox = document.getElementById('aiWarningBox');
    if (warningBox) warningBox.classList.add('hidden');
}

function initImageScanner() {
    const uploadBox = document.getElementById('uploadBox');
    const imageInput = document.getElementById('imageInput');
    const scanImageBtn = document.getElementById('scanImageBtn');
    if (!uploadBox) return;

    uploadBox.onclick = () => imageInput.click();
    imageInput.onchange = () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const prev = document.getElementById('previewImage');
                prev.src = e.target.result;
                prev.classList.remove('hidden');
                uploadBox.classList.add('hidden');
                scanImageBtn.classList.remove('hidden');
                document.getElementById('resetImageBtn').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };

    scanImageBtn.onclick = async () => {
        if (isScanning) return;
        
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        
        isScanning = true;
        scanImageBtn.disabled = true;
        scanImageBtn.innerText = "Extracting...";
        
        showLoading(true, true);
        try {
            const res = await fetch('/api/scan-image', { 
                method: 'POST', 
                headers: { 'x-auth-token': AuthManager.state.token || '' },
                body: formData 
            });
            displayResults(await res.json());
        } catch (e) { 
            alert("OCR analysis failed."); 
        } finally { 
            showLoading(false); 
            isScanning = false;
            scanImageBtn.disabled = false;
            scanImageBtn.innerText = "Scan Image";
        }
    };

    document.getElementById('resetImageBtn').onclick = () => location.reload();
}

let currentScenario = null;

function initSimulator() {
    const closeBtn = document.getElementById('closeSim');
    if (closeBtn) closeBtn.onclick = closeSimulation;
}

function closeSimulation() {
    document.getElementById('simOverlay').classList.add('hidden');
    document.getElementById('forensicView').classList.remove('active');
    document.getElementById('forensicView').classList.add('hidden');
}

async function startSimulation(type) {
    const overlay = document.getElementById('simOverlay');
    const appContent = document.getElementById('simAppContent');
    const forensicView = document.getElementById('forensicView');
    
    overlay.classList.remove('hidden');
    forensicView.classList.add('hidden');
    forensicView.classList.remove('active');
    
    // Show Loading state
    appContent.innerHTML = `
        <div class="app-loader">
            <div class="pulse"></div>
            <p>Generating Random Attack Scenario...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/simulator/generate?type=${type}`);
        currentScenario = await response.json();
        renderScenario();
    } catch (error) {
        appContent.innerHTML = `<p class="error">Failed to load simulation. Please check your connection.</p>`;
    }
}

function renderScenario() {
    const appContent = document.getElementById('simAppContent');
    const s = currentScenario;

    appContent.innerHTML = `
        <div class="sim-msg-container">
            <div class="sim-sender">${s.sender}</div>
            <div class="sim-bubble">${s.content}</div>
        </div>
        <div class="sim-actions">
            <button class="btn btn-report" onclick="handleSimChoice(true)">Report Scam</button>
            <button class="btn btn-perform" onclick="handleSimChoice(false)">Open / Reply</button>
        </div>
    `;
}

function handleSimChoice(reported) {
    const isCorrect = reported === currentScenario.isScam;
    
    // Award XP
    if (isCorrect) {
        GameManager.addXP(50);
        showSimFeedback("✅ Correctly Identified!", "Your security awareness is sharp.");
    } else {
        showSimFeedback("⚠️ Security Breach", "You've been successfully phished in this simulation.");
    }
    
    showForensicReview();
}

function showSimFeedback(title, msg) {
    // We can use a simple toast or just log it
    console.log(`${title}: ${msg}`);
}

function showForensicReview() {
    const forensicView = document.getElementById('forensicView');
    const flagsList = document.getElementById('redFlagsList');
    const explanation = document.getElementById('simExplanation');

    flagsList.innerHTML = currentScenario.redFlags.map(f => `<li>${f}</li>`).join('');
    explanation.innerText = currentScenario.explanation;

    forensicView.classList.remove('hidden');
    setTimeout(() => forensicView.classList.add('active'), 50);
}

function showLoading(show, ocr = false) {
    // Ensure the results container is visible if we are loading OR if we have data
    document.getElementById('scanResults').classList.remove('hidden');
    
    // Toggle the loader spinner
    document.getElementById('processingLoader').classList.toggle('hidden', !show);
    
    // Toggle the results content (hide while loading, show when done)
    document.getElementById('resultsContent').classList.toggle('hidden', show);
}

function displayResults(data) {
    document.getElementById('riskValue').innerText = data.score + "%";
    document.getElementById('meterFill').style.width = data.score + "%";
    document.getElementById('verdictText').innerText = data.verdict;
    document.getElementById('explanationText').innerText = data.explanation;
    document.getElementById('findingsList').innerHTML = data.reasons.map(r => `<li>${r}</li>`).join('');
    if (data.extractedText) {
        document.getElementById('extractedSection').classList.remove('hidden');
        document.getElementById('extractedText').innerText = data.extractedText;
    }
}

/**
 * --- APP INITIALIZATION ---
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 CyberShield UI Loaded");
    
    // Core Handlers
    initNavigation();
    initTabs();
    initTextScanner();
    initImageScanner();
    initSimulator();
    
    // 2. Initialize Game Systems
    GameManager.syncWithServer();
    
    // UI Close Listeners
    const closeModule = document.getElementById('closeModule');
    if (closeModule) closeModule.onclick = () => document.getElementById('moduleOverlay').classList.add('hidden');
    
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) startQuizBtn.onclick = () => document.getElementById('quizSection').classList.remove('hidden');

    // 3. Initialize AI Assistant
    if (typeof AssistantModule !== 'undefined') AssistantModule.init();
});

/**
 * --- DETACHABLE AI ASSISTANT MODULE ---
 */
const AI_ASSISTANT_ENABLED = true;

const AssistantModule = (() => {
    let isAssistantChatting = false;

    const renderUI = () => {
        if (document.getElementById('aiAssistantContainer')) return;
        
        const container = document.createElement('div');
        container.id = 'aiAssistantContainer';
        container.innerHTML = `
            <button id="aiAssistantBtn" class="floating-btn">
                <span class="icon">💬</span>
                <span class="label">Assistance</span>
            </button>
            <div id="assistantWindow" class="assistant-window hidden">
                <div class="assistant-header">
                    <h3>Shield AI Assistant</h3>
                    <button id="closeAssistant">×</button>
                </div>
                <div id="assistantMessages" class="assistant-messages">
                    <div class="msg ai">Hello! I'm your cybersecurity assistant. Let's keep your data safe.</div>
                </div>
                <div class="assistant-input-area">
                    <textarea id="assistantInput" placeholder="Ask about scam risks..." maxlength="500"></textarea>
                    <button id="sendAssistantMsg">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    };

    const init = () => {
        try {
            if (!AI_ASSISTANT_ENABLED) {
                const container = document.getElementById('aiAssistantContainer');
                if (container) container.remove();
                return;
            }

            renderUI(); // Force-inject UI components

            const btn = document.getElementById('aiAssistantBtn');
            const close = document.getElementById('closeAssistant');
            const send = document.getElementById('sendAssistantMsg');
            const input = document.getElementById('assistantInput');

            if (btn) btn.onclick = toggleWindow;
            if (close) close.onclick = () => toggleWindow(false);
            if (send) send.onclick = handleSend;
            if (input) {
                input.onkeydown = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                };
            }
            console.log("🛡️ Shield AI Assistant: Operational (Force-Injected)");
        } catch (e) {
            console.error("AI Assistant: Injection Failure.", e);
        }
    };

    const toggleWindow = (show) => {
        const win = document.getElementById('assistantWindow');
        if (win) {
            if (typeof show === 'boolean') win.classList.toggle('hidden', !show);
            else win.classList.toggle('hidden');
        }
    };

    const addMessage = (text, type = 'ai') => {
        const box = document.getElementById('assistantMessages');
        if (!box) return;
        
        // Remove typing indicator if it exists
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();

        const msg = document.createElement('div');
        msg.className = `msg ${type}`;
        msg.innerText = text;
        box.appendChild(msg);
        box.scrollTop = box.scrollHeight;
    };

    const showTyping = () => {
        const box = document.getElementById('assistantMessages');
        if (!box) return;
        if (document.getElementById('typingIndicator')) return;

        const typing = document.createElement('div');
        typing.id = 'typingIndicator';
        typing.className = 'msg ai typing';
        typing.innerText = "Analyzing query...";
        box.appendChild(typing);
        box.scrollTop = box.scrollHeight;
    };

    const handleSend = async (forcedText) => {
        const input = document.getElementById('assistantInput');
        const text = forcedText || input.value.trim();

        if (!text || isAssistantChatting) return;
        
        if (!forcedText) {
            addMessage(text, 'user');
            input.value = '';
        }
        
        showTyping();
        isAssistantChatting = true;

        try {
            const res = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.substring(0, 500) })
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'System offline');
            addMessage(data.reply, 'ai');
        } catch (e) {
            addMessage('⚠️ AI Assistant currently busy. Please try again soon.', 'ai');
        } finally {
            isAssistantChatting = false;
        }
    };

    const explainResult = (data) => {
        if (!AI_ASSISTANT_ENABLED) return;
        toggleWindow(true);
        
        // --- LOCAL OPTIMIZATION ---
        // Instead of calling the API, use the forensic explanation we already have!
        addMessage("Can you explain my last scan result?", 'user');
        
        const forensicExplanation = data.explanation || "No deep analysis available for this scan.";
        addMessage(`🛡️ Forensic Review:\n\n${forensicExplanation}\n\nVerdict: ${data.verdict}\nRisk Score: ${data.score}%`, 'ai');
        
        addMessage("Would you like a deeper cloud-AI dive into any specific finding?", 'ai');
        // Users can now type their specific follow-up, saving an automated quota-pull.
    };

    return { init, explainResult };
})();

// Extended displayResults to include AI Explanation Button
const originalDisplayResults = displayResults;
displayResults = (data) => {
    originalDisplayResults(data);
    
    const oldBtn = document.getElementById('aiExplainBtn');
    if (oldBtn) oldBtn.remove();

    const findingsList = document.getElementById('findingsList');
    if (findingsList && AI_ASSISTANT_ENABLED && !data.isFallback) {
        const explainBtn = document.createElement('button');
        explainBtn.id = 'aiExplainBtn';
        explainBtn.className = 'btn btn-outline';
        explainBtn.style.marginTop = '15px';
        explainBtn.style.width = '100%';
        explainBtn.innerHTML = '🛡️ Ask Assistant to Explain';
        explainBtn.onclick = () => AssistantModule.explainResult(data);
        findingsList.parentNode.appendChild(explainBtn);
    }
};