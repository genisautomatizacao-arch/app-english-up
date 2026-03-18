// =====================================================
// AI-SERVICE.JS — Gemini AI Integration
// =====================================================

const GEMINI_API_KEY = "AIzaSyA3bKIfHpl0lHnPYeIsxgcEyAJEkwt-QE4";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export async function askFilo(prompt, context = "") {
    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        return "Olá! Eu sou a Filó. Para eu falar com você, meu dono precisa configurar minha 'API Key' no arquivo ai-service.js! 🦫";
    }

    const systemInstruction = `
        Você é a Filó, uma capivara brasileira muito simpática que ajuda brasileiros a aprender inglês. 
        Seu tom é encorajador, divertido e didático.
        Você adora usar emojis como 🦫, 🌿, ✨.
        Se o usuário falar em português, você responde em português mas sempre incentiva o uso do inglês.
        Se o usuário falar em inglês, você responde em inglês e parabeniza pelo esforço.
        Contexto atual: ${context}
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemInstruction + "\n\nUsuário: " + prompt }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error("AI Error:", err);
        return "Ops! Minha cabeça de capivara deu um nó. Tente novamente em instantes! 🦫💦";
    }
}
