const API_BASE_URL = "https://cybershield-pro-1x15.onrender.com";
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
            const res = await fetch(`${API_BASE_URL}/api/auth/${type}`, {
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
            console.error('Auth Error:', e);
            errorBar.innerText = 'Server connection failed.';
        }
    };

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/user`, {
                headers: { 'x-auth-token': state.token }
            });
            if (res.status === 401) return logout();
            state.user = await res.json();
            updateUI();
            GameManager.syncWithServer();
        } catch (e) {
            console.error("Auth: Failed to fetch user.", e);
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
            const res = await fetch(`${API_BASE_URL}/api/learn/status`, {
                headers: { 'x-auth-token': AuthManager.state.token }
            });
            serverState = await res.json();
            updateDashboard();
            renderQuestPath();
        } catch (e) {
            console.error("Game: Sync failed.", e);
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
            const res = await fetch(`${API_BASE_URL}/api/learn/complete-module`, {
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
            console.error("Module completion error:", e);
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

let scanTimeout = null;
let isScanning = false;


/**
 * Core Scanning Logic with Concurrency Guard
 */
async function performScan() {
    if (isScanning) return;

    const input = document.getElementById('scanInput');
    const btn = document.getElementById('scanBtn');
    if (!input || !btn) return;

    const message = input.value.trim();
    if (!message) return;

    isScanning = true;
    btn.disabled = true;
    btn.innerText = "Analyzing...";
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': AuthManager.state.token || ''
            },
            body: JSON.stringify({ text: message })
        });

        // Check if response is successful and is JSON
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Received non-JSON response from server. Check backend configuration.");
        }

        const data = await response.json();

        if (data.isFallback) showAIWarning("⚠️ AI temporarily unavailable. Using secure local scan.");
        else hideAIWarning();

        displayResults(data);
    } catch (e) {
        console.error("Scan Error:", e);
        // Show user-friendly error in the UI if possible
        const resultsContent = document.getElementById('resultsContent');
        if (resultsContent) {
            resultsContent.innerHTML = `<p class="error">⚠️ Scan Failed: ${e.message}</p>`;
            document.getElementById('scanResults').classList.remove('hidden');
        }
    } finally {
        showLoading(false);
        isScanning = false;
        btn.disabled = false;
        btn.innerText = "Scan Message";
    }
}

/**
 * Debounced Trigger: Ensures only one request after typing stops
 */
function debouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
        performScan();
    }, 500);
}

function initTextScanner() {
    const scanBtn = document.getElementById('scanBtn');
    const scanInput = document.getElementById('scanInput');
    if (!scanBtn || !scanInput) return;

    // Trigger on click (Immediate check)
    scanBtn.onclick = () => {
        if (scanTimeout) clearTimeout(scanTimeout);
        performScan();
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
        formData.append('file', imageInput.files[0]);

        isScanning = true;
        scanImageBtn.disabled = true;
        scanImageBtn.innerText = "Extracting...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/scan-image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

            const data = await response.json();
            displayResults(data);
        } catch (e) {
            console.error("OCR analysis failed:", e);
            alert("OCR analysis failed: " + e.message);
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
        const response = await fetch(`${API_BASE_URL}/api/simulator`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Backend returned HTML/Text instead of JSON. Ensure your Render backend is running.");
        }

        currentScenario = await response.json();
        renderScenario();
    } catch (error) {
        console.error("Simulator Error:", error);
        appContent.innerHTML = `<div class="error-msg">
            <p><strong>⚠️ Connection Failed</strong></p>
            <p>${error.message}</p>
            <button class="btn btn-perform" onclick="location.reload()">Retry Connection</button>
        </div>`;
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
    // --- SAFETY SHIELD: Prevent app crash on API failure ---
    if (!data || typeof data !== 'object') {
        console.error("UI: Received invalid scan data", data);
        return;
    }

    // Default fallbacks to prevent UI glitches
    const score = data.score ?? 0;
    const verdict = data.verdict || "Unknown";
    const explanation = data.explanation || "No analysis available.";
    const reasons = Array.isArray(data.reasons) ? data.reasons : [];

    document.getElementById('riskValue').innerText = score + "%";
    document.getElementById('meterFill').style.width = score + "%";
    document.getElementById('verdictText').innerText = verdict;
    document.getElementById('explanationText').innerText = explanation;

    // Safety check for .map() to prevent crashes
    document.getElementById('findingsList').innerHTML = reasons.map(r => `<li>${r}</li>`).join('');

    const extractedSection = document.getElementById('extractedSection');
    if (extractedSection) {
        if (data.extractedText) {
            extractedSection.classList.remove('hidden');
            document.getElementById('extractedText').innerText = data.extractedText;
        } else {
            extractedSection.classList.add('hidden');
        }
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


});
