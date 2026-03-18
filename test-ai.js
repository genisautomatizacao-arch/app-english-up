
const API_KEY = "AIzaSyA3bKIfHpl0lHnPYeIsxgcEyAJEkwt-QE4";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

async function test() {
    try {
        console.log(`\nTesting URL: ${API_URL}`);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello" }]
                }]
            })
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Test Error:", err);
    }
}

test();
