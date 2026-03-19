// =====================================================
// APP.JS — English Learning App Core Logic
// =====================================================

import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    setDoc, 
    getDoc,
    doc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { askFilo, generateLesson } from './ai-service.js?v=4.0';
import { LESSONS } from './lessons.js';

// ── STATE ──────────────────────────────────────────
let state = {
    xp: 0,
    streak: 0,
    lives: 5,
    completedLessons: [],
    currentLesson: null,
    currentExerciseIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    wordOrderSelected: [],   // for word_order exercises
    user: null,
    isSignup:       false,
    isRecording:    false,
    isVoiceActive:  false,
};

// ── DOM REFS ────────────────────────────────────────
const screens = {
    auth:   document.getElementById('screen-auth'),
    home:   document.getElementById('screen-home'),
    lesson: document.getElementById('screen-lesson'),
    result: document.getElementById('screen-result'),
};
const els = {
    streakCount:        document.getElementById('streak-count'),
    xpCount:            document.getElementById('xp-count'),
    livesDisplay:       document.getElementById('lives-display'),
    lessonLives:        document.getElementById('lesson-lives'),
    lessonsGrid:        document.getElementById('lessons-grid'),
    exerciseArea:       document.getElementById('exercise-area'),
    lessonProgressFill: document.getElementById('lesson-progress-fill'),
    btnCloseLesson:     document.getElementById('btn-close-lesson'),
    btnContinueResult:  document.getElementById('btn-continue-result'),
    resultTitle:        document.getElementById('result-title'),
    resultSubtitle:     document.getElementById('result-subtitle'),
    resultXp:           document.getElementById('result-xp'),
    resultAccuracy:     document.getElementById('result-accuracy'),
    resultStreak:       document.getElementById('result-streak'),
    feedbackOverlay:    document.getElementById('feedback-overlay'),
    feedbackContent:    document.getElementById('feedback-content'),
    feedbackIcon:       document.getElementById('feedback-icon'),
    feedbackMessage:    document.getElementById('feedback-message'),
    feedbackDetail:     document.getElementById('feedback-detail'),
    btnNextExercise:    document.getElementById('btn-next-exercise'),
    // Auth
    authEmail:          document.getElementById('auth-email'),
    authPassword:       document.getElementById('auth-password'),
    authConfirmPassword: document.getElementById('auth-confirm-password'),
    groupConfirmPassword: document.getElementById('group-confirm-password'),
    passwordCount:      document.getElementById('password-count'),
    btnAuthPrimary:     document.getElementById('btn-auth-primary'),
    btnGoogle:          document.getElementById('btn-google'),
    linkToggleAuth:     document.getElementById('link-toggle-auth'),
    authForm:           document.getElementById('auth-form'),
    authLoading:        document.getElementById('auth-loading'),
    btnLogout:          document.getElementById('btn-logout'),
    // AI Chat
    aiChatWindow:       document.getElementById('ai-chat-window'),
    aiChatMessages:     document.getElementById('ai-chat-messages'),
    aiInput:            document.getElementById('ai-input'),
    btnSendChat:        document.getElementById('btn-send-chat'),
    btnOpenChat:        document.querySelector('.btn-float-chat'),
    btnCloseChat:       document.getElementById('btn-close-chat'),
    btnMic:             document.getElementById('btn-mic'),
    btnVoiceToggle:     document.getElementById('btn-voice-toggle'),
    aiTyping:           document.getElementById('ai-typing'),
    recordingStatus:    document.getElementById('recording-status'),
};

// ── PERSISTENCE ─────────────────────────────────────
function saveState() {
    const today = new Date().toDateString();
    const data = {
        xp:               state.xp,
        streak:           state.streak,
        lives:            state.lives,
        lastPlay:         today,
        completedLessons: state.completedLessons
    };

    localStorage.setItem('eng_state', JSON.stringify(data));
    localStorage.setItem('eng_last_play', today); // Also save separately for finishLesson logic

    // Sync to Firebase if logged in
    if (state.user) {
        const userRef = doc(db, "users", state.user.uid);
        setDoc(userRef, data, { merge: true }).catch(err => console.error("Sync error:", err));
    }
}

async function loadState() {
    let data = JSON.parse(localStorage.getItem('eng_state') || '{}');

    // Sync from Firebase if logged in
    if (state.user) {
        try {
            const userRef = doc(db, "users", state.user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                data = userSnap.data();
            }
        } catch (err) { console.error("Load error:", err); }
    }

    const lastPlay = data.lastPlay;
    const today    = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    state.xp               = parseInt(data.xp || 0);
    state.lives            = parseInt(data.lives || 5);
    state.completedLessons = data.completedLessons || [];
    state.streak           = parseInt(data.streak || 0);

    // Streak logic
    if (lastPlay !== today && lastPlay !== yesterday && lastPlay) {
        state.streak = 0; // Streak broken
    }

    // Reset lives daily
    if (lastPlay !== today) {
        state.lives = 5;
    }
}

// ── SCREEN NAVIGATION ───────────────────────────────
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo(0, 0);
}

// ── HOME ────────────────────────────────────────────
function renderHome() {
    els.streakCount.textContent = state.streak;
    els.xpCount.textContent     = state.xp;
    renderLives(state.lives, els.livesDisplay);

    els.lessonsGrid.innerHTML = '';
    LESSONS.forEach((lesson, idx) => {
        const isCompleted = state.completedLessons.includes(lesson.id);
        // AI lessons (mod 6) are unlocked if any lesson is completed
        const isUnlocked  = idx === 0 || 
                           (idx > 0 && state.completedLessons.includes(LESSONS[idx - 1].id)) || 
                           (lesson.module === 6 && state.completedLessons.length > 0);

        const node = document.createElement('div');
        node.className = `lesson-node ${isCompleted ? 'completed' : ''} ${!isUnlocked && !isCompleted ? 'locked' : ''}`;
        node.innerHTML = `
            <div class="lesson-icon">${lesson.icon}</div>
            <div class="lesson-info">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-meta">Módulo ${lesson.module} · ${lesson.exercises ? lesson.exercises.length : '5+'} exercícios · +${lesson.xpReward} XP</div>
            </div>
            <div class="lesson-badge">${isCompleted ? '✅' : isUnlocked ? '▶' : '🔒'}</div>
        `;

        if (isUnlocked || isCompleted) {
            node.addEventListener('click', () => startLesson(lesson.id));
        }

        els.lessonsGrid.appendChild(node);
    });
}

function renderLives(count, el) {
    const full  = '❤️';
    const empty = '🖤';
    el.textContent = full.repeat(Math.max(0, count)) + empty.repeat(Math.max(0, 5 - count));
}

// ── LESSON START ────────────────────────────────────
async function startLesson(id) {
    const lesson = LESSONS.find(l => l.id === id);
    if (!lesson) return;

    // Reset progress
    state.currentExerciseIndex = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.lives = 5;

    // IF AI LESSON: Hybrid Pool Logic
    if (lesson.isAi) {
        // Show loading state
        els.exerciseArea.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <div class="mascot-badge" style="font-size: 5rem;">🦫✨</div>
                <h2 style="margin-top:20px;">Filó está preparando sua lição...</h2>
                <p style="color: var(--text-secondary);">Buscando o melhor conteúdo para você!</p>
                <div class="spinner" style="margin: 20px auto;"></div>
            </div>
        `;
        showScreen('lesson');

        // 1. Try to get from Pool first (Rotation)
        let exercises = await getLessonFromPool(lesson.module, lesson.theme);
        
        if (!exercises) {
            console.log("Pool empty for this theme, generating with AI...");
            const aiData = await generateLesson(lesson.theme, lesson.module, state.xp);
            if (aiData && aiData.exercises && aiData.exercises.length > 0) {
                exercises = aiData.exercises;
                // 2. Save to Pool for future users
                saveLessonToPool(lesson.module, lesson.theme, exercises);
            }
        } else {
            console.log("Loaded exercises from Pool (Hybrid System)");
        }

        if (exercises && exercises.length > 0) {
            // Shuffle exercises for rotation
            state.currentLesson = { ...lesson, exercises: exercises.sort(() => Math.random() - 0.5) };
        } else {
            alert("A Filó não conseguiu carregar essa lição agora. Verifique sua conexão!");
            showScreen('home');
            return;
        }
    } else {
        state.currentLesson = lesson;
        showScreen('lesson');
    }

    updateLessonProgress();
    renderLives(state.lives, els.lessonLives);
    renderExercise();
}

async function getLessonFromPool(moduleId, theme) {
    try {
        const poolRef = collection(db, "exercises_pool");
        const q = query(poolRef, where("module", "==", moduleId), where("theme", "==", theme), limit(5));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Pick a random set from the pool results
            const randomIndex = Math.floor(Math.random() * querySnapshot.docs.length);
            return querySnapshot.docs[randomIndex].data().exercises;
        }
    } catch (err) {
        console.error("Error fetching from pool:", err);
    }
    return null;
}

async function saveLessonToPool(moduleId, theme, exercises) {
    try {
        const poolRef = collection(db, "exercises_pool");
        // We only save if the set is valid
        if (exercises && exercises.length >= 3) {
            await addDoc(poolRef, {
                module: moduleId,
                theme: theme,
                exercises: exercises,
                createdAt: serverTimestamp()
            });
            console.log("New exercise set saved to Pool!");
        }
    } catch (err) {
        console.error("Error saving to pool:", err);
    }
}

function updateLessonProgress() {
    const lesson  = state.currentLesson;
    const percent = (state.currentExerciseIndex / lesson.exercises.length) * 100;
    els.lessonProgressFill.style.width = `${percent}%`;
}

// ── EXERCISE RENDERER ───────────────────────────────
function renderExercise() {
    const lesson   = state.currentLesson;
    const exercise = lesson.exercises[state.currentExerciseIndex];
    els.exerciseArea.innerHTML = '';

    if (exercise.type === 'multiple_choice') renderMultipleChoice(exercise);
    else if (exercise.type === 'fill_blank')  renderFillBlank(exercise);
    else if (exercise.type === 'word_order')  renderWordOrder(exercise);

    // Auto-speak prompt if it's a new exercise
    if (exercise.sentence) speak(exercise.sentence);
    else if (exercise.word) speak(exercise.word);
}

function speak(text, btn = null) {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean text: strip emojis, symbols, and all punctuation
    // We only keep letters, numbers and spaces for the speech engine
    const cleanText = text
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Remove emojis
        .replace(/[^a-zA-Z0-9\s]/g, ' ') // Remove everything else except letters/numbers/spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; 

    if (btn) {
        utterance.onstart = () => btn.classList.add('playing');
        utterance.onend = () => btn.classList.remove('playing');
    }

    window.speechSynthesis.speak(utterance);
}

// ── MULTIPLE CHOICE ─────────────────────────────────
function renderMultipleChoice(ex) {
    const letters = ['A', 'B', 'C', 'D'];
    if (ex.options) ex.options.sort(() => Math.random() - 0.5); // Embaralha as opções
    els.exerciseArea.innerHTML = `
        <p class="exercise-prompt">${ex.prompt}</p>
        ${ex.word ? `
        <div class="word-card">
            <button class="btn-audio" id="btn-speak-word">🔊</button>
            <div class="word-english">${ex.word}</div>
            <div class="word-pronunciation">${ex.pronunciation}</div>
            <div class="word-pronunciation-label">Como pronunciar</div>
        </div>` : ''}
        <div class="options-list" id="options-list">
            ${ex.options.map((opt, i) => `
                <button class="option-btn" data-index="${i}">
                    <div class="option-letter">${letters[i]}</div>
                    <div class="option-text-wrap">
                        <div class="option-text">${opt.text}</div>
                        ${opt.pronunciation ? `<div class="option-pronunciation">${opt.pronunciation}</div>` : ''}
                    </div>
                </button>
            `).join('')}
        </div>
    `;

    const speakBtn = document.getElementById('btn-speak-word');
    if (speakBtn) speakBtn.addEventListener('click', () => speak(ex.word, speakBtn));

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx     = parseInt(btn.dataset.index);
            const correct = ex.options[idx].correct;
            
            // Pronounce choice
            speak(ex.options[idx].text);

            handleAnswer(correct, btn, ex);
        });
    });
}

// ── FILL BLANK ───────────────────────────────────────
function renderFillBlank(ex) {
    const letters = ['A', 'B', 'C'];
    if (ex.options) ex.options.sort(() => Math.random() - 0.5); // Embaralha as opções
    els.exerciseArea.innerHTML = `
        <p class="exercise-prompt">${ex.prompt}</p>
        <div class="fill-blank-sentence">
            <button class="btn-audio" id="btn-speak-sentence">🔊</button>
            ${ex.sentence.replace('___', `<span class="blank" id="blank-display">___</span>`)}
        </div>
        <p class="fill-pronunciation">${ex.sentence_pronunciation}</p>
        <p style="text-align:center; color: var(--text-secondary); font-size:0.85rem; margin-top:8px;">${ex.translation}</p>
        <div class="options-list" style="margin-top:16px;">
            ${ex.options.map((opt, i) => `
                <button class="option-btn" data-index="${i}">
                    <div class="option-letter">${letters[i]}</div>
                    <div class="option-text-wrap">
                        <div class="option-text">${opt.text}</div>
                        ${opt.pronunciation ? `<div class="option-pronunciation">${opt.pronunciation}</div>` : ''}
                    </div>
                </button>
            `).join('')}
        </div>
    `;

    const speakBtn = document.getElementById('btn-speak-sentence');
    if (speakBtn) speakBtn.addEventListener('click', () => speak(ex.sentence.replace('___', ex.options.find(o => o.correct).text), speakBtn));

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx     = parseInt(btn.dataset.index);
            const opt     = ex.options[idx];
            
            // Update visual
            const blankDisplay = document.getElementById('blank-display');
            if (blankDisplay) {
                blankDisplay.textContent = opt.text;
                if (opt.correct) {
                    blankDisplay.style.color = 'var(--green)';
                    blankDisplay.style.borderColor = 'var(--green)';
                }
            }

            // Pronounce full sentence with chosen word
            speak(ex.sentence.replace('___', opt.text));

            handleAnswer(opt.correct, btn, ex);
        });
    });
}

// ── WORD ORDER ───────────────────────────────────────
function renderWordOrder(ex) {
    state.wordOrderSelected = [];

    els.exerciseArea.innerHTML = `
        <p class="exercise-prompt">${ex.prompt}</p>
        <p style="text-align:center; color: var(--text-secondary); font-size:0.9rem;">"${ex.translation}"</p>
        <div class="word-order-area">
            <div class="word-order-sentence-wrap">
                 <button class="btn-audio" id="btn-speak-wo" style="margin: 0 0 10px 0;">🔊</button>
                 <div class="word-order-sentence" id="wo-sentence"></div>
            </div>
            <div class="word-order-bank" id="wo-bank">
                ${ex.words.map((w, i) => `
                    <div class="word-chip" data-index="${i}">
                        <span class="chip-text">${w.text}</span>
                        ${w.pronunciation ? `<span class="chip-pronunciation">${w.pronunciation}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        <button class="btn-submit" id="btn-wo-submit" disabled>Verificar ✔</button>
    `;

    const speakBtn = document.getElementById('btn-speak-wo');
    if (speakBtn) speakBtn.addEventListener('click', () => {
        const text = state.wordOrderSelected.map(idx => ex.words[idx].text).join(' ');
        if (text) speak(text, speakBtn);
        else speak(ex.translation, speakBtn); // fallback to something if empty
    });

    // Shuffle chips display
    const bank = document.getElementById('wo-bank');
    const chips = Array.from(bank.children);
    for (let i = chips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        bank.appendChild(chips[j]);
    }

    // Click chip → move to sentence
    document.querySelectorAll('.word-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('placed')) return;
            const idx = parseInt(chip.dataset.index);
            state.wordOrderSelected.push(idx);
            chip.classList.add('placed');

            // Pronounce word on select
            speak(ex.words[idx].text);

            const sentence = document.getElementById('wo-sentence');
            const ghost = document.createElement('div');
            ghost.className = 'word-chip';
            ghost.dataset.selectedIndex = state.wordOrderSelected.length - 1;
            ghost.dataset.wordIndex = idx;
            ghost.innerHTML = chip.innerHTML;
            ghost.addEventListener('click', () => {
                // Click placed chip → return to bank
                const selIdx = parseInt(ghost.dataset.selectedIndex);
                const wordIdx = parseInt(ghost.dataset.wordIndex);
                state.wordOrderSelected = state.wordOrderSelected.filter((_, i) => i !== selIdx);
                // re-index remaining
                document.querySelectorAll('#wo-sentence .word-chip').forEach((g, newI) => {
                    g.dataset.selectedIndex = newI;
                });
                chip.classList.remove('placed');
                ghost.remove();
                sentence.classList.toggle('has-words', sentence.children.length > 0);
                document.getElementById('btn-wo-submit').disabled = state.wordOrderSelected.length === 0;
            });

            sentence.appendChild(ghost);
            sentence.classList.add('has-words');
            document.getElementById('btn-wo-submit').disabled = false;
        });
    });

    document.getElementById('btn-wo-submit').addEventListener('click', () => {
        const correct = JSON.stringify(state.wordOrderSelected) === JSON.stringify(ex.correct_order);
        handleAnswer(correct, null, ex);
    });
}

// ── ANSWER HANDLING ──────────────────────────────────
function handleAnswer(correct, btn, ex) {
    // Disable all options
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const submitBtn = document.getElementById('btn-wo-submit');
    if (submitBtn) submitBtn.disabled = true;

    if (correct) {
        state.correctCount++;
        playSound(true);
        if (btn) btn.classList.add('correct');
        showFeedback(true, ex);

        // 20% chance of a didactic tip even when correct
        if (Math.random() < 0.2) {
            getAiTip(ex);
        }
    } else {
        state.wrongCount++;
        state.lives = Math.max(0, state.lives - 1);
        renderLives(state.lives, els.lessonLives);
        renderLives(state.lives, els.livesDisplay);
        playSound(false);
        if (btn) btn.classList.add('wrong');

        // Highlight correct answer
        if (ex.type === 'multiple_choice' || ex.type === 'fill_blank') {
            document.querySelectorAll('.option-btn').forEach((b, i) => {
                if (ex.options[i].correct) b.classList.add('correct');
            });
        }
        showFeedback(false, ex);

        // Smart explanation via AI
        getAiExplanation(ex);
    }
}

async function getAiExplanation(ex) {
    els.feedbackDetail.textContent = "Filó está pensando em uma explicação... 🦫";
    
    let rightAnswer = 'N/A';
    if (ex.options) rightAnswer = ex.options.find(o => o.correct).text;
    else if (ex.words) rightAnswer = ex.correct_order.map(i => ex.words[i].text).join(' ');

    const prompt = `O usuário cometeu um erro didático. 
        Tipo de Exercício: ${ex.type}. 
        Enunciado: ${ex.prompt}. 
        Resposta Correta: ${rightAnswer}. 
        
        Aja como a Filó (Capivara Tutora). Explique em português a lógica por trás da resposta correta, mencione a regra gramatical se houver, e dê um exemplo curto de uso. Seja breve e muito gentil. 🦫`;
    const explanation = await askFilo(prompt, "Explicando um erro de exercício");
    els.feedbackDetail.textContent = explanation;
}

async function getAiTip(ex) {
    let targetText = ex.word;
    if (!targetText && ex.options) targetText = ex.options.find(o => o.correct).text;
    if (!targetText && ex.words) targetText = ex.correct_order.map(i => ex.words[i].text).join(' ');

    const prompt = `O usuário acertou o exercício sobre "${ex.prompt}". 
        Dê uma curiosidade rápida ou uma dica extra de uso para a palavra/frase "${targetText}". 
        Seja a Filó: curta, didática e divertida. 🦫✨`;
    const tip = await askFilo(prompt, "Dando uma dica extra de acerto");
    if (els.feedbackOverlay.classList.contains('visible')) {
        els.feedbackDetail.textContent = "Dica da Filó: " + tip;
    }
}

// ── FEEDBACK OVERLAY ─────────────────────────────────
function showFeedback(correct, ex) {
    const overlay = els.feedbackOverlay;
    const content = els.feedbackContent;
    overlay.classList.remove('hidden');
    overlay.classList.add('visible');

    content.className = `feedback-content ${correct ? 'correct-feedback' : 'wrong-feedback'}`;
    els.feedbackIcon.textContent    = correct ? '🎉' : '😕';
    els.feedbackMessage.textContent = correct ? 'Correto! Ótimo!' : 'Resposta errada';

    if (!correct) {
        if (ex.options) {
            const rightOpt = ex.options.find(o => o.correct);
            els.feedbackDetail.textContent = `Resposta certa: ${rightOpt.text}${rightOpt.pronunciation ? ' (' + rightOpt.pronunciation + ')' : ''}`;
        } else if (ex.words && ex.correct_order) {
            const rightSentence = ex.correct_order.map(i => ex.words[i].text).join(' ');
            els.feedbackDetail.textContent = `Resposta certa: ${rightSentence}`;
        }
    } else {
        els.feedbackDetail.textContent = '';
    }
}

els.btnNextExercise.addEventListener('click', () => {
    els.feedbackOverlay.classList.add('hidden');
    els.feedbackOverlay.classList.remove('visible');
    nextExercise();
});

function nextExercise() {
    const lesson = state.currentLesson;
    state.currentExerciseIndex++;
    updateLessonProgress();

    if (state.currentExerciseIndex >= lesson.exercises.length || state.lives <= 0) {
        finishLesson();
    } else {
        renderExercise();
    }
}

// ── LESSON FINISH ────────────────────────────────────
function finishLesson() {
    try {
        const lesson   = state.currentLesson;
        const total    = lesson.exercises.length;
        const accuracy = Math.round((state.correctCount / total) * 100);
        const xpGained = state.lives > 0 ? lesson.xpReward : Math.floor(lesson.xpReward * 0.4);

        state.xp += xpGained;
        if (!state.completedLessons.includes(lesson.id)) {
            state.completedLessons.push(lesson.id);
        }

        // Streak: if this is the first lesson of today
        const lastPlay = localStorage.getItem('eng_last_play');
        const today    = new Date().toDateString();
        if (lastPlay !== today) {
            state.streak++;
        }

        saveState();

        // Result screen
        if (els.resultTitle) els.resultTitle.textContent = accuracy >= 80 ? 'Incrível! 🎉' : accuracy >= 50 ? 'Bom trabalho! 👍' : 'Continue tentando! 💪';
        if (els.resultSubtitle) els.resultSubtitle.textContent = `${lesson.title} — concluída`;
        if (els.resultXp) els.resultXp.textContent = `+${xpGained} XP`;
        if (els.resultAccuracy) els.resultAccuracy.textContent = `${accuracy}%`;
        if (els.resultStreak) els.resultStreak.textContent = state.streak;

        showScreen('result');
    } catch (err) {
        console.error("Crash em finishLesson:", err);
        alert("Ops! Ocorreu um erro ao finalizar a lição. Por favor, tente recarregar o app. Erro: " + err.message);
    }
}

// ── SOUND ────────────────────────────────────────────
let audioCtx;
function playSound(correct) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
        if (correct) {
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
        } else {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.15);
        }
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) { /* Audio not available */ }
}

// ── EVENT LISTENERS ──────────────────────────────────
els.btnCloseLesson.addEventListener('click', () => {
    showScreen('home');
    renderHome();
});

els.btnContinueResult.addEventListener('click', () => {
    showScreen('home');
    renderHome();
});

// ── AUTH LOGIC ──────────────────────────────────────
els.btnAuthPrimary.addEventListener('click', async () => {
    const email = els.authEmail.value;
    const pass  = els.authPassword.value;
    const confirmPass = els.authConfirmPassword.value;
    
    if (!email || !pass) return alert("Preencha todos os campos!");
    
    if (state.isSignup) {
        if (pass.length < 6) return alert("A senha deve ter pelo menos 6 caracteres!");
        if (pass !== confirmPass) return alert("As senhas não coincidem!");
    }

    els.authForm.classList.add('hidden');
    els.authLoading.classList.remove('hidden');

    try {
        if (state.isSignup) {
            await createUserWithEmailAndPassword(auth, email, pass);
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
    } catch (error) {
        console.error("Erro Auth:", error);
        
        // Hide loading and show form again
        els.authForm.classList.remove('hidden');
        els.authLoading.classList.add('hidden');
        
        let msg = "Erro ao autenticar.";
        if (error.code === 'auth/configuration-not-found') {
            msg = "Erro: O login por E-mail não foi ativado no Console do Firebase. Por favor, siga as instruções no guia.";
        } else if (error.code === 'auth/invalid-credential') {
            msg = "E-mail ou senha incorretos.";
        } else if (error.code === 'auth/email-already-in-use') {
            msg = "Este e-mail já está em uso.";
        }
        
        alert(msg);
    }
});

els.btnGoogle.addEventListener('click', async () => {
    try {
        els.authForm.classList.add('hidden');
        els.authLoading.classList.remove('hidden');
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Erro Google Auth:", error);
        els.authForm.classList.remove('hidden');
        els.authLoading.classList.add('hidden');
        alert("Erro ao entrar com Google: " + error.message);
    }
});

els.linkToggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    state.isSignup = !state.isSignup;
    els.btnAuthPrimary.textContent = state.isSignup ? "Cadastrar" : "Entrar";
    els.linkToggleAuth.textContent = state.isSignup ? "Entre" : "Cadastre-se";
    
    // Toggle confirm password field
    if (state.isSignup) {
        els.groupConfirmPassword.classList.remove('hidden');
    } else {
        els.groupConfirmPassword.classList.add('hidden');
    }
});

els.authPassword.addEventListener('input', () => {
    els.passwordCount.textContent = els.authPassword.value.length;
});

els.btnLogout.addEventListener('click', () => {
    if (confirm("Deseja realmente sair?")) {
        signOut(auth).catch(err => console.error("Logout error:", err));
    }
});

// ── FILÓ AI CHAT LOGIC ───────────────────────────────
function addChatMessage(text, role, save = true) {
    const msg = document.createElement('div');
    msg.className = `ai-message ${role}`;
    msg.textContent = text;
    els.aiChatMessages.appendChild(msg);
    els.aiChatMessages.scrollTop = els.aiChatMessages.scrollHeight;

    if (save && state.user) {
        saveMessageToFirestore(text, role);
    }
}

async function saveMessageToFirestore(text, role) {
    try {
        const chatRef = collection(db, "users", state.user.uid, "chat_history");
        await addDoc(chatRef, {
            text,
            role,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error("Error saving chat:", err);
    }
}

async function loadChatHistory() {
    if (!state.user) return;
    try {
        const chatRef = collection(db, "users", state.user.uid, "chat_history");
        const q = query(chatRef, orderBy("timestamp", "asc"), limit(50));
        const querySnapshot = await getDocs(q);
        
        // Clear default welcome if history exists
        if (!querySnapshot.empty) {
            els.aiChatMessages.innerHTML = '';
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            addChatMessage(data.text, data.role, false); // false to not re-save
        });
    } catch (err) {
        console.error("Error loading chat:", err);
    }
}

els.btnOpenChat.addEventListener('click', () => {
    els.aiChatWindow.classList.toggle('hidden');
    els.aiInput.focus();
});

els.btnCloseChat.addEventListener('click', () => els.aiChatWindow.classList.add('hidden'));

const sendMessage = async () => {
    const userMessage = els.aiInput.value.trim();
    if (!userMessage) return;

    addChatMessage(userMessage, 'user');
    els.aiInput.value = '';

    // Show typing indicator
    els.aiTyping.classList.remove('hidden');
    els.aiChatMessages.scrollTop = els.aiChatMessages.scrollHeight;

    const context = `O usuário está na lição de ${state.currentCategory}. XP atual: ${state.xp}. Nome: ${state.user ? state.user.displayName : 'aluno'}.`;
    const response = await askFilo(userMessage, context);
    
    // Hide typing indicator
    els.aiTyping.classList.add('hidden');
    
    addChatMessage(response, 'bot');
    els.aiChatMessages.scrollTop = els.aiChatMessages.scrollHeight;

    // Auto voice if active
    if (state.isVoiceActive) speak(response);
};

els.btnSendChat.addEventListener('click', sendMessage);
els.aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Voice Toggle
els.btnVoiceToggle.addEventListener('click', () => {
    state.isVoiceActive = !state.isVoiceActive;
    els.btnVoiceToggle.classList.toggle('active', state.isVoiceActive);
    els.btnVoiceToggle.textContent = state.isVoiceActive ? "🔊" : "🔇";
});

// Speech Recognition (STT)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Default to English for practice
    recognition.interimResults = false;

    recognition.onstart = () => {
        state.isRecording = true;
        els.btnMic.classList.add('recording');
        els.recordingStatus.classList.remove('hidden');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        els.aiInput.value = transcript;
        sendMessage();
    };

    recognition.onend = () => {
        state.isRecording = false;
        els.btnMic.classList.remove('recording');
        els.recordingStatus.classList.add('hidden');
    };

    els.btnMic.addEventListener('click', () => {
        if (state.isRecording) {
            recognition.stop();
        } else {
            // Check if user wants to speak in PT or EN based on context? 
            // Standardizing to auto-detect or just EN-US for the app's purpose.
            recognition.start();
        }
    });
} else {
    els.btnMic.style.display = 'none';
}

// ── INIT & AUTH STATE ───────────────────────────────
onAuthStateChanged(auth, async (user) => {
    state.user = user;
    if (user) {
        try {
            await loadState();
            await loadChatHistory();
        } catch (err) {
            console.error("Initialization error:", err);
        }
        showScreen('home');
        renderHome();
        els.btnOpenChat.style.display = 'flex';
    } else {
        showScreen('auth');
        els.btnOpenChat.style.display = 'none';
        els.aiChatWindow.classList.add('hidden'); // Close chat if logout
    }
});
