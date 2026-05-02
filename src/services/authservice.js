import { auth, db } from './firebase-config.js';

import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

export const AuthService = {

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw new Error("Email ou senha inválidos");
        }
    },

    init() {
        return new Promise((resolve) => {

            onAuthStateChanged(auth, async (user) => {

                if (user) {
                    try {
                        const userRef = doc(db, "users", user.uid);
                        const userSnap = await getDoc(userRef);
                        const userData = userSnap.data();

                        const roleRef = doc(db, "roles", userData.role);
                        const roleSnap = await getDoc(roleRef);
                        const roleData = roleSnap.data();

                        currentUser = {
                            uid: user.uid,
                            ...userData,
                            permissions: roleData
                        };

                    } catch (err) {
                        console.error("Erro ao carregar usuário:", err);
                        currentUser = null;
                    }

                } else {
                    currentUser = null;
                }

                resolve(currentUser);
            });
        });
    },

    getUser() {
        return currentUser;
    },

    isAuthenticated() {
        return currentUser !== null;
    },

    async logout() {
    await signOut(auth);

    // 🔥 garante estado limpo imediatamente
    currentUser = null;

    // 🔥 redireciona depois que limpou
    window.navigate('/');
}
};