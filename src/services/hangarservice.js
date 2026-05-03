import { db, auth } from './firebase-config.js';

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    arrayUnion,
    serverTimestamp,
    getDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const HangarService = {

    async getHangarById(id) {
    const ref = doc(db, "Hangares", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return { id: snap.id, ...snap.data() };
},

    async createHangar(nome, icao, servicos) {
        const user = auth.currentUser;

        if (!user) throw new Error("Usuário não autenticado");

        const hangarRef = await addDoc(collection(db, "Hangares"), {
            nome,
            icao,
            servicos,
            ownerId: user.uid,
            admins: [user.uid],
            createdAt: serverTimestamp()
        });

        const userRef = doc(db, "users", user.uid);

        await updateDoc(userRef, {
            managed_hangars: arrayUnion(hangarRef.id)
        });

        return hangarRef.id;
    },

    // 🔥 FUNÇÃO QUE ESTAVA FALTANDO
    async getMyHangares() {
        const user = auth.currentUser;

        if (!user) throw new Error("Usuário não autenticado");

        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();

        const ids = userData.managed_hangars || [];

        if (!ids.length) return [];

        const hangares = [];

        for (let id of ids) {
            const hangarSnap = await getDoc(doc(db, "Hangares", id));

            if (hangarSnap.exists()) {
                hangares.push({
                    id: hangarSnap.id,
                    ...hangarSnap.data()
                });
            }
        }

        return hangares;
    },

    async getHangarById(id) {
        const snap = await getDoc(doc(db, "Hangares", id));

        if (!snap.exists()) throw new Error("Hangar não encontrado");

        return {
            id: snap.id,
            ...snap.data()
        };
    },

    async updateHangar(id, data) {
        const user = auth.currentUser;

        if (!user) throw new Error("Usuário não autenticado");

        const hangarRef = doc(db, "Hangares", id);

        await updateDoc(hangarRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },
    async getHangaresByIcao(icao) {
    const snapshot = await getDocs(collection(db, "Hangares"));

    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(h => h.icao.toLowerCase() === icao.toLowerCase());
}
};