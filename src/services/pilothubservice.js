import { db, doc, getDoc, setDoc } from "./firebase-config.js";

export const PilotService = {
    async getPilotProfile(userId) {
        if (!userId) return null;
        const snap = await getDoc(doc(db, "pilotos", userId));
        return snap.exists() ? snap.data() : null;
    },

    async savePilotProfile(userId, profileData) {
        await setDoc(doc(db, "pilotos", userId), {
            ...profileData,
            lastUpdate: new Date().toISOString(),
            uid: userId 
        }, { merge: true });
    }
};