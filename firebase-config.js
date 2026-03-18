// =====================================================
// FIREBASE-CONFIG.JS — Firebase Initialization
// =====================================================

// NOTE: The user will need to provide actual configuration values
// via the environment or by manually editing this file.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
