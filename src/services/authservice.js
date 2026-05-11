import { 
    auth, 
    db, 
    doc, 
    getDoc, 
    setDoc,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged 
} from "../../firebase-config.js";

export const AuthService = {
    _currentUser: null,

    init() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        this._currentUser = { uid: user.uid, ...userDoc.data() };
                    } else {
                        this._currentUser = { uid: user.uid, email: user.email, role: 'piloto' };
                    }
                } else {
                    this._currentUser = null;
                }
                resolve(this._currentUser);
            });
        });
    },

    // authservice.js - Método register
async register(email, password, userData) {
    try {
        const cleanEmail = email.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // --- AJUSTE AQUI ---
        // Adicionamos 'parceiro' à lista de permissões
        let selectedRole = 'piloto'; 
        if (userData.role === 'admin_hangar') {
            selectedRole = 'admin_hangar';
        } else if (userData.role === 'parceiro') {
            selectedRole = 'parceiro';
        }

        const newUserProfile = {
            email: cleanEmail,
            displayName: userData.nome || "Usuário", // Usei 'nome' para bater com o RegisterView
            role: selectedRole,
            createdAt: new Date().toISOString()
        };

        // Gravação no Firestore
        await setDoc(doc(db, "users", user.uid), newUserProfile);

        this._currentUser = { uid: user.uid, ...newUserProfile };
        return this._currentUser;

    } catch (error) {
        console.error("Erro detalhado no registro:", error.code);
        throw error;
    }
},

    async login(email, password) {
        try {
            const cleanEmail = email.trim().toLowerCase();
            const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
            const user = userCredential.user;
            
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) throw new Error("Usuário não encontrado no Firestore.");

            this._currentUser = { uid: user.uid, ...userDoc.data() };
            return this._currentUser;
        } catch (error) {
            console.error("Erro no login:", error.message);
            throw error;
        }
    },

    async logout() {
        try {
            await signOut(auth);
            this._currentUser = null;
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    },

    getUser() {
        return this._currentUser;
    },

    isAdmin() {
        return this._currentUser?.role === 'admin_hangar';
    }
};