// =====================================================
// AI-SERVICE.JS — Gemini AI Integration
// =====================================================

const GEMINI_API_KEY = "AIzaSyC2jOZPKZ4hxVUi43gA9jL_crkT2bwcpGg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

async function fetchWithRetry(url, options, maxRetries = 3) {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            if (response.status === 429) { // Rate limit
                console.warn(`Rate limit hit, retrying in ${delay}ms...`);
            } else {
                const errData = await response.json().catch(() => ({}));
                if (errData.error?.message?.includes("API key was reported as leaked")) {
                    throw new Error("API_KEY_LEAKED");
                }
            }
        } catch (err) {
            if (err.message === "API_KEY_LEAKED") throw err;
            if (i === maxRetries - 1) throw err;
            console.warn(`Fetch attempt ${i + 1} failed, retrying...`, err);
        }
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
    }
    throw new Error("FALHA_APOS_REPETICOES");
}

export async function askFilo(prompt, context = "") {
    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        return "Olá! Eu sou a Filó. Para eu falar com você, meu dono precisa configurar minha 'API Key' no arquivo ai-service.js! 🦫";
    }

    const systemInstruction = `
        Você é a Filó, uma capivara brasileira especialista em ensino de inglês (TESOL). 
        Seu objetivo é ser um tutor didático, encorajador e divertido.
        Diretrizes:
        1. Use emojis (🦫, 🌿, ✨).
        2. Se o usuário errar, explique a regra gramatical ou cultural de forma simples (máximo 3 frases).
        3. Sempre forneça um exemplo prático relacionado ao erro.
        4. Incentive o usuário a tentar falar a frase em voz alta.
        5. Se o usuário acertar, ocasionalmente dê um fato curioso sobre a língua inglesa.
        Contexto do Aluno: ${context}
    `;

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemInstruction + "\n\nUsuário: " + prompt }]
                }]
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error("Gemini API Error details:", data.error);
            throw new Error(data.error.message);
        }
        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error("AI Error:", err);
        return "Ops! Minha cabeça de capivara deu um nó. Tente novamente em instantes! 🦫💦";
    }
}

export async function generateLesson(theme, moduleLevel = 1, userXp = 0) {
    let difficulty = "iniciante absoluto (CEFR A1)";
    if (moduleLevel >= 3 || userXp > 100) difficulty = "básico em progressão (CEFR A1+)";
    if (moduleLevel >= 5 || userXp > 300) difficulty = "pré-intermediário (CEFR A2)";
    if (moduleLevel >= 6 || userXp > 500) difficulty = "intermediário com pegadinhas (CEFR B1)";

    const prompt = `Gere uma lição de inglês sobre o tema "${theme}".
    Nível de dificuldade alvo: ${difficulty} (Módulo ${moduleLevel}, XP do aluno: ${userXp}).
    
    CRITÉRIOS DE QUALIDADE E EVOLUÇÃO (PERFEIÇÃO):
    1. O vocabulário e gramática devem estar PERFEITAMENTE adequados ao nível exigido. Conforme o nível sobe (A2, B1), use frases maiores, phrasal verbs e contrações.
    2. O inglês deve ser muito natural, usado por nativos no dia a dia, sem traduções engessadas.
    3. As opções erradas (distratores) devem fazer sentido cognitivo (ex: erros comuns gramaticais de brasileiros ou falsos cognatos), mas serem inequivocamente erradas no contexto.
    4. REGRA CRÍTICA PARA MULTIPLE_CHOICE: Se as opções de A a D forem em INGLÊS (e a pergunta em português), os campos "word" e "pronunciation" DEVEM VIR EXATAMENTE VAZIOS ("") no JSON. Use "word" somente se a pergunta for em inglês para o aluno traduzir para português.

    Retorne um JSON estritamente no seguinte formato:
    {
      "exercises": [
        {
          "type": "multiple_choice",
          "prompt": "Pergunta em português",
          "word": "Palavra principal em inglês",
          "pronunciation": "Fonética simplificada (ex: Rélou)",
          "options": [
            {"text": "Opção Certa", "pronunciation": "Fonética", "correct": true},
            {"text": "Opção Errada 1", "pronunciation": "Fonética", "correct": false},
            {"text": "Opção Errada 2", "pronunciation": "Fonética", "correct": false},
            {"text": "Opção Errada 3", "pronunciation": "Fonética", "correct": false}
          ]
        },
        {
          "type": "fill_blank",
          "prompt": "Instrução ex: Complete a frase",
          "sentence": "Frase com ___ no lugar da lacuna",
          "sentence_pronunciation": "Fonética da frase",
          "translation": "Tradução da frase",
          "options": [
            {"text": "Certa", "pronunciation": "Fonética", "correct": true},
            {"text": "Errada 1", "pronunciation": "Fonética", "correct": false},
            {"text": "Errada 2", "pronunciation": "Fonética", "correct": false}
          ]
        },
        {
          "type": "word_order",
          "prompt": "Monte a frase:",
          "translation": "Tradução da frase alvo",
          "words": [{"text": "Word", "pronunciation": "Fonética"}, ...],
          "correct_order": [0, 1, 2, ...]
        }
      ]
    }
    IMPORTANTE: Para "multiple_choice" gere EXATAMENTE 4 opções. Para "fill_blank" gere EXATAMENTE 3 opções. Não coloque a resposta correta sempre na primeira posição do array; misture bem!
    Gere 5 exercícios variados e didáticos. Retorne APENAS o JSON.`;

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    response_mime_type: "application/json",
                    temperature: 0.7 
                }
            })
        });

        const data = await response.json();
        let content = data.candidates[0].content.parts[0].text;
        // Strip markdown backticks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(content);
    } catch (err) {
        console.error("Erro ao gerar lição:", err);
        if (err.message === "API_KEY_LEAKED") {
            alert("ERRO DE SEGURANÇA: A chave de API expirou ou vazou. Por favor, contate o suporte ou atualize a chave!");
        }
        return null; // Fallback handled in app.js
    }
}
