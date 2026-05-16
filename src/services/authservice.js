import { 
    auth, 
    db, 
    doc, 
    getDoc, 
    setDoc,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged,
    functions 
} from "../../firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

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

    async createCheckoutSession(email, role) {
        try {
            // Garante que o nome da função bata exatamente com o exports no index.js
            const createSession = httpsCallable(functions, 'createStripeCheckout');
            const result = await createSession({ 
                email: email.trim().toLowerCase(), 
                role: role 
            });
            return result.data.url; 
        } catch (error) {
            console.error("Erro ao criar sessão de pagamento:", error);
            throw error;
        }
    },

    async register(email, password, userData) {
        try {
            const cleanEmail = email.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            const user = userCredential.user;

            const newUserProfile = {
                email: cleanEmail,
                displayName: userData.nome || "Usuário",
                role: userData.role,
                createdAt: new Date().toISOString(),
                status: 'pago'
            };

            await setDoc(doc(db, "users", user.uid), newUserProfile);
            this._currentUser = { uid: user.uid, ...newUserProfile };
            return this._currentUser;
        } catch (error) {
            console.error("Erro no registro:", error);
            throw error;
        }
    },

    async login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        this._currentUser = { uid: userCredential.user.uid, ...userDoc.data() };
        return this._currentUser;
    },

    async logout() {
        await signOut(auth);
        this._currentUser = null;
    },

    getUser() { return this._currentUser; }
};