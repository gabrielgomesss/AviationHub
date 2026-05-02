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

    async getMyHangares() {
        const user = auth.currentUser;

        if (!user) throw new Error("Usuário não autenticado");

        // 🔹 pega usuário
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();

        const ids = userData.managed_hangars || [];

        if (ids.length === 0) return [];

        const hangares = [];

        // 🔹 busca cada hangar
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
    }
};