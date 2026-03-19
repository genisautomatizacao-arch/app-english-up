const KEY = "AIzaSyD8xYCzqfQLG3RAVlIO02ohfCE9vTsK22w";
const MODEL = "gemini-flash-latest";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

async function test() {
    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Diga 'Olá' e conte uma curiosidade sobre o Brasil em 1 frase." }] }]
            })
        });
        const data = await response.json();
        if (data.error) {
            console.log("ERROR:", data.error.message);
        } else {
            console.log("SUCCESS!");
            console.log("Response:", data.candidates[0].content.parts[0].text);
        }
    } catch (e) {
        console.log("FETCH ERROR:", e.message);
    }
}

test();
