/* ==========================================================================
   WEB AUDIO API SYNTHESIZER ENGINE (WITH ANALYSER & MODULATORS)
   ========================================================================== */
let audioCtx = null;
let noiseBuffer = null;
let pantInterval = null;
let isPanting = false;
let analyser = null;

// Initialize Audio Context lazily on user interaction
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        noiseBuffer = createNoiseBuffer(audioCtx);
        
        // Setup Analyser Node
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(audioCtx.destination);
        
        // Start Canvas Oscilloscope Loop
        drawVisualizer();
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

// Get dynamic synthesis values from sliders
function getPitchValue() {
    const slider = document.getElementById('slider-pitch');
    return slider ? parseFloat(slider.value) : 380;
}

function getRaspValue() {
    const slider = document.getElementById('slider-rasp');
    return slider ? parseFloat(slider.value) / 100 : 0.4;
}

// 1. HAPPY BARK SYNTHESIS (WITH PARAMETRIC MODULATION & HEAD SHAKE)
function playBark() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const basePitch = getPitchValue();
    const noiseLevel = getRaspValue();

    // Pitch Carrier (Oscillator)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    
    // Pitch envelope: drops rapidly (mimics bark vocal shape)
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 0.28, now + 0.08);

    // Raspy Noise component
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(basePitch * 0.75, now);
    noiseFilter.Q.setValueAtTime(2.0, now);

    // Gain Nodes (Volume Envelopes)
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(noiseLevel, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Connections to Analyser (Visualizer)
    osc.connect(oscGain);
    oscGain.connect(analyser);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(analyser);

    // Start & Stop
    osc.start(now);
    osc.stop(now + 0.12);
    noise.start(now);
    noise.stop(now + 0.12);

    // Trigger physical reaction animations
    const mouth = document.getElementById('dog-mouth');
    const head = document.getElementById('dog-head-element');
    
    if (mouth && head) {
        mouth.classList.add('mouth-bark');
        head.classList.add('head-bark');
        setExpression('happy');
        
        setTimeout(() => {
            mouth.classList.remove('mouth-bark');
            head.classList.remove('head-bark');
            // reset expression after bark if not in extreme slider modes
            const sliderVal = parseInt(document.getElementById('excitement-slider').value, 10);
            if (sliderVal > 20 && sliderVal < 80) {
                setExpression(null);
            }
        }, 120);
    }
}

// 2. PLAYFUL GROWL SYNTHESIS (WITH PARAMETRIC MODULATION & ANGRY EXPRESSION)
function playGrowl() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 0.9;
    
    const basePitch = getPitchValue() * 0.22; // Low pitch
    const noiseLevel = getRaspValue() * 0.6;

    // Low rumble carrier
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(basePitch, now);

    // LFO to create rapid vibration/rumble (vibrato)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(38, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(10, now);

    // Lowpass filter to keep it deep and chesty
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(basePitch * 1.8, now);

    // Raspy Noise overlay
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(100, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(noiseLevel, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

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
    gainNode.connect(analyser);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(analyser);

    // Start & Stop
    lfo.start(now);
    osc.start(now);
    noise.start(now);
    lfo.stop(now + duration);
    osc.stop(now + duration);
    noise.stop(now + duration);

    // Angry visual expression
    setExpression('angry');
    setTimeout(() => {
        const sliderVal = parseInt(document.getElementById('excitement-slider').value, 10);
        if (sliderVal > 20 && sliderVal < 80) setExpression(null);
        else if (sliderVal <= 20) setExpression('sad');
        else if (sliderVal >= 80) setExpression('happy');
    }, duration * 1000);
}

// 3. WHIMPER / WHINE SYNTHESIS (WITH PARAMETRIC MODULATION & SAD EXPRESSION)
function playWhine() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 0.75;
    
    const basePitch = getPitchValue() * 2.5; // High pitch whimper

    // High pitch sine carrier
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.linearRampToValueAtTime(basePitch * 1.15, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 0.9, now + duration);

    // LFO for crying vibrato
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(13, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(30, now);

    // Volume Envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gainNode);
    gainNode.connect(analyser);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + duration);
    osc.stop(now + duration);

    // Sad/Scared visual expression
    setExpression('sad');
    setTimeout(() => {
        const sliderVal = parseInt(document.getElementById('excitement-slider').value, 10);
        if (sliderVal > 20 && sliderVal < 80) setExpression(null);
        else if (sliderVal >= 80) setExpression('happy');
    }, duration * 1000);
}

// 4. PANNING GENERATOR (Breathing loop)
function triggerSinglePant() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noiseLevel = getRaspValue();

    // Breath component using noise
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(noiseLevel * 0.35, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(analyser);

    noise.start(now);
    noise.stop(now + 0.18);
}

function startPanting(speedMs) {
    if (isPanting) clearInterval(pantInterval);
    isPanting = true;
    
    pantInterval = setInterval(() => {
        triggerSinglePant();
    }, speedMs);
}

function stopPanting() {
    isPanting = false;
    clearInterval(pantInterval);
}

/* ==========================================================================
   CANVAS OSCILLOSCOPE WAVEFORM VISUALIZER
   ========================================================================== */
function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if (!analyser) return;

    const canvas = document.getElementById('visualizer-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fit canvas width/height to CSS display dimensions
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = canvas.clientHeight;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    
    ctx.clearRect(0, 0, width, height);
    
    // Set background color matching the active theme background
    const bgAppColor = getComputedStyle(document.body).getPropertyValue('--bg-app').trim() || '#f9f9f9';
    ctx.fillStyle = bgAppColor;
    ctx.fillRect(0, 0, width, height);
    
    // Line style matching the theme primary accent
    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#333';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = accentColor;
    
    // Waveform glow effect
    ctx.shadowBlur = 6;
    ctx.shadowColor = accentColor;
    
    ctx.beginPath();
    
    const sliceWidth = width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

/* ==========================================================================
   INTERACTIVE JAVASCRIPT CONTROLLERS
   ========================================================================== */

// 1. Expressions helper
const headElement = document.getElementById('dog-head-element');
function setExpression(expression) {
    if (!headElement) return;
    headElement.classList.remove('express-angry', 'express-sad', 'express-happy');
    if (expression) {
        headElement.classList.add(`express-${expression}`);
    }
}

// 2. Theme Toggles
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.body.className = '';
        document.body.classList.add(`theme-${btn.dataset.theme}`);
    });
});

// 3. Eyeballs Mouse Tracking
const sandboxArea = document.getElementById('dog-sandbox-area');
const pupilL = document.getElementById('pupil-l');
const pupilR = document.getElementById('pupil-r');

if (sandboxArea && pupilL && pupilR) {
    sandboxArea.addEventListener('mousemove', (e) => {
        const rect = sandboxArea.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get parent eye elements offsets relative to sandbox
        const eyeLRect = pupilL.parentElement.getBoundingClientRect();
        const eyeRRect = pupilR.parentElement.getBoundingClientRect();
        
        const eyeLX = eyeLRect.left - rect.left + eyeLRect.width / 2;
        const eyeLY = eyeLRect.top - rect.top + eyeLRect.height / 2;
        
        const eyeRX = eyeRRect.left - rect.left + eyeRRect.width / 2;
        const eyeRY = eyeRRect.top - rect.top + eyeRRect.height / 2;
        
        // Compute displacement for Left eye
        const dxL = mouseX - eyeLX;
        const dyL = mouseY - eyeLY;
        const angleL = Math.atan2(dyL, dxL);
        const distL = Math.min(4.5, Math.hypot(dxL, dyL) / 18);
        pupilL.style.transform = `translate(${Math.cos(angleL) * distL}px, ${Math.sin(angleL) * distL}px)`;
        
        // Compute displacement for Right eye
        const dxR = mouseX - eyeRX;
        const dyR = mouseY - eyeRY;
        const angleR = Math.atan2(dyR, dxR);
        const distR = Math.min(4.5, Math.hypot(dxR, dyR) / 18);
        pupilR.style.transform = `translate(${Math.cos(angleR) * distR}px, ${Math.sin(angleR) * distR}px)`;
    });
    
    // Reset eyes when cursor leaves sandbox
    sandboxArea.addEventListener('mouseleave', () => {
        pupilL.style.transform = 'translate(0px, 0px)';
        pupilR.style.transform = 'translate(0px, 0px)';
    });
}

// 4. Dog Parts Body Language Translator
const bodyLanguageData = {
    ears: {
        title: "👂 Ears (Behavior Profile)",
        desc: "Perked ears indicate alertness, focus, or curious listening. Drooped or flattened ears suggest submission, friendliness, or minor anxiety."
    },
    snout: {
        title: "👃 Snout & Mouth",
        desc: "A relaxed, open mouth with tongue showing means content. A tight closed mouth shows high focus. Licking lips indicates self-soothing or mild stress."
    },
    paws: {
        title: "🐾 Play Bow & Paw Signals",
        desc: "Lifting a single paw is an invitation to play or a request for attention. Digging behavior indicates scent marking or burrowing instincts."
    },
    tail: {
        title: "🐕 Tail Position Analyzer",
        desc: "A broad horizontal wag indicates friendliness. A high vertical wag signals high energy or excitement. A low, tucked tail shows submission or fear."
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
            
            // Audio Feedback
            if (part === 'snout') playBark();
            else if (part === 'ears') playWhine();
            else if (part === 'tail') playBark();
            else if (part === 'paws') playBark();
        }
        e.stopPropagation();
    });
});

// 5. Tail Physics Slider
const slider = document.getElementById('excitement-slider');
const valBadge = document.getElementById('excitement-value');
const stateText = document.getElementById('tail-state-text');
const dogTail = document.getElementById('dog-tail');
const dogContainer = document.querySelector('.dog-container');

slider.addEventListener('input', () => {
    const value = parseInt(slider.value, 10);
    valBadge.textContent = `${value}%`;

    // Clear classes
    dogTail.className = 'dog-tail';
    dogContainer.classList.remove('ears-back', 'ears-perked');

    if (value <= 20) {
        dogTail.classList.add('tail-tucked');
        dogContainer.classList.add('ears-back');
        stateText.textContent = "Tucked / Submissive";
        setExpression('sad');
        stopPanting();
        document.getElementById('pant-text').textContent = "Start Panting";
    }
    else if (value <= 50) {
        dogTail.classList.add('tail-wag-slow');
        stateText.textContent = "Relaxed / Friendly";
        setExpression(null);
        stopPanting();
        document.getElementById('pant-text').textContent = "Start Panting";
    }
    else if (value <= 80) {
        dogTail.classList.add('tail-wag-medium');
        dogContainer.classList.add('ears-perked');
        stateText.textContent = "Excited / Playful";
        setExpression(null);
        startPanting(300); // normal panting speed
        document.getElementById('pant-text').textContent = "Stop Panting";
    }
    else {
        dogTail.classList.add('tail-wag-fast');
        dogContainer.classList.add('ears-perked');
        stateText.textContent = "Helicopter Wag / Ecstatic";
        setExpression('happy');
        startPanting(160); // fast panting speed
        document.getElementById('pant-text').textContent = "Stop Panting";
    }
});

// 6. Soundboard Trigger Events
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

// 7. Canine Matcher Quiz
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
    const questionEl = document.getElementById('quiz-question');
    const optionsGrid = document.getElementById('quiz-options');
    const progressFill = document.getElementById('quiz-progress-fill');

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
        currentQuizStep = 0;
        quizScores = { frenchie: 0, golden: 0, shiba: 0, collie: 0 };
        loadQuizQuestion();
    });
}

// Start Quiz on load
loadQuizQuestion();
