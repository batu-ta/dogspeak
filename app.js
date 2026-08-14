/* ==========================================================================
   WEB AUDIO API SYNTHESIZER ENGINE
   ========================================================================== */
let audioCtx = null;
let noiseBuffer = null;
let pantInterval = null;
let isPanting = false;

// Initialize Audio Context lazily on user interaction
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Create noise buffer once
        noiseBuffer = createNoiseBuffer(audioCtx);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Generate White Noise Buffer
function createNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// 1. HAPPY BARK SYNTHESIS
function playBark() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Pitch Carrier (Oscillator)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    
    // Pitch envelope: drops rapidly from 400Hz to 120Hz (mimics bark vocal shape)
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    // Raspy Noise component
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.Q.setValueAtTime(2.0, now);

    // Gain Nodes (Volume Envelopes)
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Connections
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Start & Stop
    osc.start(now);
    osc.stop(now + 0.12);
    noise.start(now);
    noise.stop(now + 0.12);

    // Animate mouth on CSS Art Dog
    const mouth = document.getElementById('dog-mouth');
    if (mouth) {
        mouth.classList.add('mouth-bark');
        setTimeout(() => {
            mouth.classList.remove('mouth-bark');
        }, 110);
    }
}

// 2. PLAYFUL GROWL SYNTHESIS
function playGrowl() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 0.9;

    // Low rumble carrier
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, now);

    // LFO to create rapid vibration/rumble (vibrato)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(42, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(8, now);

    // Lowpass filter to keep it deep and chesty
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(130, now);

    // Volume envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.7, now + 0.1);
    gainNode.gain.setValueAtTime(0.7, now + duration - 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Start & Stop
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + duration);
    osc.stop(now + duration);
}

// 3. WHIMPER / WHINE SYNTHESIS
function playWhine() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 0.7;

    // High pitch sine carrier
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(850, now + duration);

    // LFO for crying vibrato
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(25, now);

    // Volume Envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + duration);
    osc.stop(now + duration);
}

// 4. PANNING GENERATOR (Breathing loop)
function triggerSinglePant() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Breath component using noise
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.5, now);

    const gainNode = ctx.createGain();
    // Exhale burst
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.18);
}

function startPanting(speedMs) {
    if (isPanting) clearInterval(pantInterval);
    isPanting = true;
    
    // Quick loop to simulate panting
    pantInterval = setInterval(() => {
        triggerSinglePant();
    }, speedMs);
}

function stopPanting() {
    isPanting = false;
    clearInterval(pantInterval);
}

/* ==========================================================================
   INTERACTIVE JAVASCRIPT CONTROLLERS
   ========================================================================== */

// 1. Theme Toggles
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.body.className = '';
        document.body.classList.add(`theme-${btn.dataset.theme}`);
    });
});

// 2. Dog Parts Body Language Translator
const bodyLanguageData = {
    ears: {
        title: "👂 Ears (Body Language)",
        desc: "Perked ears indicate interest, attention, or readiness. Flipped back or flattened ears signal friendliness, submission, or fear depending on context."
    },
    snout: {
        title: "👃 Snout & Mouth",
        desc: "A relaxed, slightly open mouth indicates content. Yawning can indicate tiredness or stress. A tight closed mouth signals focus or potential warning."
    },
    paws: {
        title: "🐾 Paws (Play Signals)",
        desc: "A paw lifted up is an invitation to play, a request for food/attention, or a sign of submission. Scratching the ground means marking scent."
    },
    tail: {
        title: "🐕 Tail (Emotional Guide)",
        desc: "Tail wags are emotional indicators. Higher wags indicate happiness, broad side-to-side wags mean playfulness, and a tucked tail means submission or fear."
    }
};

const interactiveElements = document.querySelectorAll('[data-part]');
const titleEl = document.getElementById('interpreter-title');
const descEl = document.getElementById('interpreter-desc');

interactiveElements.forEach(el => {
    el.addEventListener('click', (e) => {
        const part = el.dataset.part;
        const data = bodyLanguageData[part];
        if (data) {
            titleEl.textContent = data.title;
            descEl.textContent = data.desc;
            
            // Play corresponding sound as feedback
            if (part === 'snout') playBark();
            else if (part === 'ears') playWhine();
            else if (part === 'tail') playBark();
            else if (part === 'paws') playBark();
        }
        e.stopPropagation();
    });
});

// 3. Tail Physics Sandbox Slider
const slider = document.getElementById('excitement-slider');
const valBadge = document.getElementById('excitement-value');
const stateText = document.getElementById('tail-state-text');
const dogTail = document.getElementById('dog-tail');
const dogEarLeft = document.getElementById('dog-ear-left');
const dogEarRight = document.getElementById('dog-ear-right');

slider.addEventListener('input', () => {
    const value = parseInt(slider.value, 10);
    valBadge.textContent = `${value}%`;

    // Clear previous wag classes
    dogTail.className = 'dog-tail';
    document.querySelector('.dog-container').className = 'dog-container';

    if (value <= 20) {
        // Submissive / Fearful
        dogTail.classList.add('tail-tucked');
        document.querySelector('.dog-container').classList.add('ears-back');
        stateText.textContent = "Tucked / Fearful";
        stopPanting();
        document.getElementById('pant-text').textContent = "Start Panting";
    }
    else if (value <= 50) {
        // Relaxed
        dogTail.classList.add('tail-wag-slow');
        stateText.textContent = "Relaxed / Friendly";
        stopPanting();
        document.getElementById('pant-text').textContent = "Start Panting";
    }
    else if (value <= 80) {
        // Playful / Excited
        dogTail.classList.add('tail-wag-medium');
        document.querySelector('.dog-container').classList.add('ears-perked');
        stateText.textContent = "Excited / Playful";
        startPanting(300); // Normal panting
        document.getElementById('pant-text').textContent = "Stop Panting";
    }
    else {
        // Pure Joy / Helicopter Wag
        dogTail.classList.add('tail-wag-fast');
        document.querySelector('.dog-container').classList.add('ears-perked');
        stateText.textContent = "Pure Joy / Helicopter Wag";
        startPanting(180); // Rapid panting
        document.getElementById('pant-text').textContent = "Stop Panting";
    }
});

// 4. Soundboard Button Listeners
document.getElementById('btn-bark').addEventListener('click', playBark);
document.getElementById('btn-growl').addEventListener('click', playGrowl);
document.getElementById('btn-whine').addEventListener('click', playWhine);

const pantBtn = document.getElementById('btn-pant');
pantBtn.addEventListener('click', () => {
    if (isPanting) {
        stopPanting();
        document.getElementById('pant-text').textContent = "Start Panting";
        pantBtn.classList.remove('active');
    } else {
        startPanting(280);
        document.getElementById('pant-text').textContent = "Stop Panting";
        pantBtn.classList.add('active');
    }
});

// 5. Quiz Engine
const quizQuestions = [
    {
        q: "What is your typical energy level during the weekend?",
        opts: [
            { text: "🛋️ Relaxing, reading books or watching movies", score: { frenchie: 3, shiba: 1 } },
            { text: "🚶 Walking around the park or meeting friends", score: { golden: 3, shiba: 2 } },
            { text: "⛰️ Running, hiking, active training", score: { collie: 3, golden: 1 } }
        ]
    },
    {
        q: "Where will your companion spend most of their time?",
        opts: [
            { text: "🏢 In a cozy, compact apartment", score: { frenchie: 3, shiba: 2 } },
            { text: "🏡 In a house with a medium-sized backyard", score: { golden: 3, collie: 1 } },
            { text: "🚜 Out in a spacious countryside or farm", score: { collie: 3, golden: 1 } }
        ]
    },
    {
        q: "How would you describe your ideal bonding style?",
        opts: [
            { text: "❤️ Super affectionate, constant cuddle buddy", score: { golden: 3, frenchie: 2 } },
            { text: "🧠 Intelligent partner, happy to learn tricks", score: { collie: 3, golden: 2 } },
            { text: "🦊 Independent, clean, and content with space", score: { shiba: 3 } }
        ]
    }
];

let currentQuizStep = 0;
let quizScores = { frenchie: 0, golden: 0, shiba: 0, collie: 0 };

function loadQuizQuestion() {
    const quizWorkspace = document.getElementById('quiz-workspace');
    const questionEl = document.getElementById('quiz-question');
    const optionsGrid = document.getElementById('quiz-options');
    const progressFill = document.getElementById('quiz-progress-fill');

    // Update Progress
    const progress = (currentQuizStep / quizQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;

    if (currentQuizStep >= quizQuestions.length) {
        showQuizResult();
        return;
    }

    const currentQ = quizQuestions[currentQuizStep];
    questionEl.textContent = currentQ.q;
    optionsGrid.innerHTML = '';

    currentQ.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
            // Add Scores
            for (let key in opt.score) {
                quizScores[key] += opt.score[key];
            }
            currentQuizStep++;
            loadQuizQuestion();
        });
        optionsGrid.appendChild(btn);
    });
}

const breedDetails = {
    frenchie: {
        title: "French Bulldog 🐶",
        desc: "You matched with a French Bulldog! Perfect for apartment living and low-key environments. They are incredibly affectionate, quiet, and love cuddling on the sofa."
    },
    golden: {
        title: "Golden Retriever 🦮",
        desc: "You matched with a Golden Retriever! You value warmth, affection, and active walks. Goldens are highly social, eager to please, and make perfect family companions."
    },
    shiba: {
        title: "Shiba Inu 🦊",
        desc: "You matched with a Shiba Inu! You appreciate independence, cleanliness, and a companion that doesn't demand constant attention. Shibas are loyal, proud, and apartment-friendly."
    },
    collie: {
        title: "Border Collie 🎓",
        desc: "You matched with a Border Collie! You have a high-energy lifestyle and appreciate intelligence. Collies need plenty of running, training, and mental challenges to stay happy."
    }
};

function showQuizResult() {
    const questionEl = document.getElementById('quiz-question');
    const optionsGrid = document.getElementById('quiz-options');
    const progressFill = document.getElementById('quiz-progress-fill');

    progressFill.style.width = '100%';
    questionEl.textContent = "Your Match Results";
    optionsGrid.innerHTML = '';

    // Find highest score
    let highestBreed = 'frenchie';
    let maxScore = -1;
    for (let key in quizScores) {
        if (quizScores[key] > maxScore) {
            maxScore = quizScores[key];
            highestBreed = key;
        }
    }

    const result = breedDetails[highestBreed];

    const resultCard = document.createElement('div');
    resultCard.className = 'quiz-result-card';
    resultCard.innerHTML = `
        <h4>${result.title}</h4>
        <p>${result.desc}</p>
        <button class="quiz-reset-btn" id="btn-reset-quiz">Try Again</button>
    `;

    optionsGrid.appendChild(resultCard);

    document.getElementById('btn-reset-quiz').addEventListener('click', () => {
        // Reset state
        currentQuizStep = 0;
        quizScores = { frenchie: 0, golden: 0, shiba: 0, collie: 0 };
        loadQuizQuestion();
    });
}

// Start Quiz on page load
loadQuizQuestion();
