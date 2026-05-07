import { db, auth, functions } from "../../firebase-config.js";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    httpsCallable 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export const HangarService = {

    /**
     * Atualiza dados do hangar via Cloud Function
     * Resolve: HangarService.updateHangar is not a function
     */
    async updateHangar(id, dados) {
        try {
            const fn = httpsCallable(functions, "updateHangar");
            const result = await fn({ id, ...dados });
            return result.data;
        } catch (error) {
            console.error("Erro ao atualizar hangar:", error);
            throw error;
        }
    },

    async getMyHangares() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuário não autenticado.");
            const q = query(collection(db, "Hangares"), where("admins", "array-contains", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error("Erro getMyHangares:", error);
            throw error;
        }
    },

    async createHangar(dados) {
        const fn = httpsCallable(functions, "createHangarWithLink");
        const result = await fn(dados);
        return result.data.id;
    },

    async getHangarById(id) {
        const snap = await getDoc(doc(db, "Hangares", id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    async getHangaresByIcao(icao) {
        if (!icao) return [];
        const q = query(collection(db, "Hangares"), where("icao", "==", icao.toUpperCase()));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
};