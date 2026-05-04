import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    doc,
    updateDoc,
    query,
    arrayUnion,
    serverTimestamp,
    onSnapshot,
    where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxzJrz9TWYhqx2vtiljoXElidA1fv1_K0",
    authDomain: "hangarhub-b467b.firebaseapp.com",
    projectId: "hangarhub-b467b",
    storageBucket: "hangarhub-b467b.firebasestorage.app",
    messagingSenderId: "840586201797",
    appId: "1:840586201797:web:2217461d01e4d26b317eac"
};

// 🔥 singleton (evita duplicação)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔥 instâncias
const db = getFirestore(app);
const auth = getAuth(app);

// 🔥 EXPORTA TUDO CENTRALIZADO
export {
    db,
    auth,

    // firestore
    collection,
    serverTimestamp,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    doc,
    updateDoc,
    query,
    arrayUnion,
    onSnapshot,
    where,

    // auth
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
};