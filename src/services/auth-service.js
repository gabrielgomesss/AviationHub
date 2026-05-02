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
    // Login
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            await signOut(auth);
            window.location.href = '/login';
        } catch (error) {
            console.error("Erro no logout:", error);
        }
    },

    // Recupera a Role do usuário baseada na sua estrutura do Firestore
    async getUserRole(uid) {
        if (!uid) return null;
        
        try {
            // Referência ao documento do usuário na coleção 'users'
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                console.log("Dados do usuário carregados:", userData);
                return userData.role; // Retorna 'admin_hangar', 'piloto', etc.
            } else {
                console.warn("Usuário não encontrado no Firestore.");
                return null;
            }
        } catch (error) {
            console.error("Erro crítico ao buscar role:", error);
            throw error;
        }
    },

    subscribeAuthState(callback) {
        return onAuthStateChanged(auth, callback);
    }
};