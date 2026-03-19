const KEY = "AIzaSyD8xYCzqfQLG3RAVlIO02ohfCE9vTsK22w";
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`;

async function listModels() {
    try {
        const res = await fetch(URL);
        const data = await res.json();
        if (data.error) {
            console.error("ERROR:", data.error.message);
        } else {
            console.log("MODELS:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        }
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}

listModels();
