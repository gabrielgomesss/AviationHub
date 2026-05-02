import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

export const AuthService = {
    // Login simplificado
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Erro no Auth Login:", error);
            throw error;
        }
    },

    // Busca de permissões com tratamento de erro absoluto
    async getUserRole(uid) {
        if (!uid) return null;

        try {
            // Verificação direta sem loops de espera para evitar travamento da thread
            if (!db) {
                console.error("Database não instanciado no config.");
                return null;
            }

            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                
                return data.role || null;
            }
            
            console.warn(`Documento do usuário ${uid} não existe na coleção 'users'.`);
            return null;
        } catch (error) {
            console.error("Falha ao ler Firestore:", error);
            return null;
        }
    },

    async logout() {
        try {
            await signOut(auth);
            window.location.reload(); // Recarga limpa para resetar o estado da SPA
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    }
};