import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Substitua pelos seus dados do console do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBxzJrz9TWYhqx2vtiljoXElidA1fv1_K0",
    authDomain: "hangarhub-b467b.firebaseapp.com",
    projectId: "hangarhub-b467b",
    storageBucket: "hangarhub-b467b.firebasestorage.app",
    messagingSenderId: "840586201797",
    appId: "1:840586201797:web:2217461d01e4d26b317eac"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = getFirestore(app);