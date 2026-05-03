import {
    db,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where
} from './firebase-config.js';

import { AuthService } from './authservice.js';

const COLLECTION = "Hangares";

const HangarService = {

    async getHangaresByICAO(icao) {
        try {

            console.log("DB CHECK:", db);

            const q = query(
                collection(db, COLLECTION),
                where("icao", "==", icao.toUpperCase())
            );

            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (err) {
            console.error("🔥 ERRO REAL:", err);
            return [];
        }
    }

};

export { HangarService };