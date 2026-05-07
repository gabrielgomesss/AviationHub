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

    async register(email, password, userData) {
        try {
            // HIGIENIZAÇÃO PROFUNDA: Remove espaços, quebras de linha e caracteres invisíveis
            const cleanEmail = email.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');

            // 1. Criação no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            const user = userCredential.user;

            // 2. Definição da Role (admin_hangar ou piloto)
            const selectedRole = userData.role === 'admin_hangar' ? 'admin_hangar' : 'piloto';

            // 3. Estrutura de dados fiel à imagem image_b17d96.png
            const newUserProfile = {
                createdAt: new Date().toLocaleString('pt-BR', { 
                    timeZone: 'America/Sao_Paulo' 
                }) + " UTC-3",
                display_name: userData.nome || "Novo Usuário",
                email: cleanEmail,
                managed_hangars: selectedRole === 'admin_hangar' ? [] : [], // Mantém array vazio para ambos conforme imagem
                role: selectedRole
            };

            // 4. Gravação obrigatória no Firestore utilizando o UID
            await setDoc(doc(db, "users", user.uid), newUserProfile);

            this._currentUser = { uid: user.uid, ...newUserProfile };
            return this._currentUser;

        } catch (error) {
            // Log para identificar se o problema é o e-mail ou outra restrição
            console.error("Erro detalhado no registro:", error.code, "| Email tentado:", `"${email}"`);
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