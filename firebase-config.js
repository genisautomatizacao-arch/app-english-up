// =====================================================
// FIREBASE-CONFIG.JS — Firebase Initialization
// =====================================================

// NOTE: The user will need to provide actual configuration values
// via the environment or by manually editing this file.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxq1slMml72MOxttj5UUjjpGnULmsjOhY",
    authDomain: "filo-app-fd121.firebaseapp.com",
    projectId: "filo-app-fd121",
    storageBucket: "filo-app-fd121.firebasestorage.app",
    messagingSenderId: "485162737274",
    appId: "1:485162737274:web:2acaf39cda16586ed565c3",
    measurementId: "G-HC174B3RSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
