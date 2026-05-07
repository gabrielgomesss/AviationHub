import { initializeApp, getApps, getApp} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxzJrz9TWYhqx2vtiljoXElidA1fv1_K0",
    authDomain: "hangarhub-b467b.firebaseapp.com",
    projectId: "hangarhub-b467b",
    storageBucket: "hangarhub-b467b.firebasestorage.app",
    messagingSenderId: "840586201797",
    appId: "1:840586201797:web:2217461d01e4d26b317eac"
};

// Inicialização segura
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Instâncias
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Conexão com Emulador (Porta 5001 para Functions)
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("🚀 Conectado ao Emulador de Cloud Functions (5001)");
}

export { db, auth, functions, createUserWithEmailAndPassword,
    doc, 
    getDoc, 
    setDoc,
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
 };