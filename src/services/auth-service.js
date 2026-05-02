// src/services/AuthService.js
import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

export const AuthService = {
    // Cadastro de novo usuário com definição de papel (role)
    async registerUser(email, password, role) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Cria o perfil do usuário no Firestore com a role definida
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: role, // 'admin_master', 'admin_hangar', 'piloto'
                createdAt: new Date(),
                status: 'active'
            });

            return user;
        } catch (error) {
            console.error("Erro no registro:", error);
            throw error;
        }
    },

    // Login convencional
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
            window.location.pathname = '/login';
        } catch (error) {
            console.error("Erro no logout:", error);
        }
    },

    // Recupera a Role do usuário para controle de acesso (RBAC)
    async getUserRole(uid) {
        if (!uid) return 'visitante';
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data().role;
            }
            return 'visitante';
        } catch (error) {
            console.error("Erro ao buscar papel do usuário:", error);
            return 'visitante';
        }
    },

    // Observador de estado de autenticação
    subscribeAuthState(callback) {
        return onAuthStateChanged(auth, callback);
    }
};