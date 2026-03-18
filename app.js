// =====================================================
// APP.JS — English Learning App Core Logic
// =====================================================

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { askFilo } from './ai-service.js';

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
    isSignup: false,
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
    linkToggleAuth:     document.getElementById('link-toggle-auth'),
    authForm:           document.getElementById('auth-form'),
    authLoading:        document.getElementById('auth-loading'),
    btnLogout:          document.getElementById('btn-logout'),
    // AI Chat
    btnOpenChat:       document.getElementById('btn-open-chat'),
    btnCloseChat:      document.getElementById('btn-close-chat'),
    chatWindow:        document.getElementById('ai-chat-window'),
    chatMessages:      document.getElementById('ai-chat-messages'),
    chatInput:         document.getElementById('ai-chat-input'),
    btnSendAi:         document.getElementById('btn-send-ai'),
};

// ── PERSISTENCE ─────────────────────────────────────
function saveState() {
    const data = {
        xp:               state.xp,
        streak:           state.streak,
        lives:            state.lives,
        lastPlay:         new Date().toDateString(),
        completedLessons: state.completedLessons
    };

    localStorage.setItem('eng_state', JSON.stringify(data));

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
        const isUnlocked  = idx === 0 || state.completedLessons.includes(LESSONS[idx - 1].id);

        const node = document.createElement('div');
        node.className = `lesson-node ${isCompleted ? 'completed' : ''} ${!isUnlocked && !isCompleted ? 'locked' : ''}`;
        node.innerHTML = `
            <div class="lesson-icon">${lesson.icon}</div>
            <div class="lesson-info">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-meta">Módulo ${lesson.module} · ${lesson.exercises.length} exercícios · +${lesson.xpReward} XP</div>
            </div>
            <div class="lesson-badge">${isCompleted ? '✅' : isUnlocked ? '▶' : '🔒'}</div>
        `;

        if (isUnlocked || isCompleted) {
            node.addEventListener('click', () => startLesson(lesson));
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
function startLesson(lesson) {
    state.currentLesson        = lesson;
    state.currentExerciseIndex = 0;
    state.correctCount         = 0;
    state.wrongCount           = 0;
    state.wordOrderSelected    = [];

    showScreen('lesson');
    updateLessonProgress();
    renderLives(state.lives, els.lessonLives);
    renderExercise();
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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for better clarity

    if (btn) {
        utterance.onstart = () => btn.classList.add('playing');
        utterance.onend = () => btn.classList.remove('playing');
    }

    window.speechSynthesis.speak(utterance);
}

// ── MULTIPLE CHOICE ─────────────────────────────────
function renderMultipleChoice(ex) {
    const letters = ['A', 'B', 'C', 'D'];
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
            handleAnswer(correct, btn, ex);
        });
    });
}

// ── FILL BLANK ───────────────────────────────────────
function renderFillBlank(ex) {
    const letters = ['A', 'B', 'C'];
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
            const correct = opt.correct;
            if (correct) {
                const blank = document.getElementById('blank-display');
                if (blank) {
                    blank.textContent = opt.text;
                    blank.style.color = 'var(--green)';
                    blank.style.borderColor = 'var(--green)';
                }
            }
            handleAnswer(correct, btn, ex);
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
    const prompt = `O usuário errou um exercício de inglês. 
        Tipo: ${ex.type}. 
        Prompt: ${ex.prompt}. 
        Resposta certa: ${ex.options ? ex.options.find(o => o.correct).text : 'N/A'}. 
        Explique brevemente e de forma didática o porquê dessa resposta estar correta.`;
    const explanation = await askFilo(prompt, "Explicando um erro de exercício");
    els.feedbackDetail.textContent = explanation;
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

    if (!correct && ex.options) {
        const rightOpt = ex.options.find(o => o.correct);
        if (rightOpt) {
            els.feedbackDetail.textContent = `Resposta certa: ${rightOpt.text}${rightOpt.pronunciation ? ' (' + rightOpt.pronunciation + ')' : ''}`;
        } else {
            els.feedbackDetail.textContent = '';
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
    els.resultTitle.textContent    = accuracy >= 80 ? 'Incrível! 🎉' : accuracy >= 50 ? 'Bom trabalho! 👍' : 'Continue tentando! 💪';
    els.resultSubtitle.textContent = `${lesson.title} — concluída`;
    els.resultXp.textContent       = `+${xpGained} XP`;
    els.resultAccuracy.textContent = `${accuracy}%`;
    els.resultStreak.textContent   = state.streak;

    showScreen('result');
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
function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `ai-message ${role}`;
    msg.textContent = text;
    els.chatMessages.appendChild(msg);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

els.btnOpenChat.addEventListener('click', () => {
    els.chatWindow.classList.toggle('hidden');
    els.chatInput.focus();
});

els.btnCloseChat.addEventListener('click', () => els.chatWindow.classList.add('hidden'));

const sendMessage = async () => {
    const text = els.chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    els.chatInput.value = '';

    const botMsgPlaceholder = document.createElement('div');
    botMsgPlaceholder.className = 'ai-message bot';
    botMsgPlaceholder.textContent = '...';
    els.chatMessages.appendChild(botMsgPlaceholder);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;

    const response = await askFilo(text, "Conversa livre no chat");
    botMsgPlaceholder.textContent = response;
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
};

els.btnSendAi.addEventListener('click', sendMessage);
els.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ── INIT & AUTH STATE ───────────────────────────────
onAuthStateChanged(auth, async (user) => {
    state.user = user;
    if (user) {
        await loadState();
        showScreen('home');
        renderHome();
    } else {
        showScreen('auth');
    }
});
