import { functions } from "../../firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export const PilotService = {
    async getPilotProfile(userId) {
        try {
            const getProfile = httpsCallable(functions, 'getPilotProfile');
            const result = await getProfile({ userId });
            return result.data;
        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            throw error;
        }
    },

    async savePilotProfile(userId, profileData) {
        try {
            const saveProfile = httpsCallable(functions, 'savePilotProfile');
            const result = await saveProfile({ userId, profileData });
            return result.data;
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            throw error;
        }
    },

    async getAllPilots() {
        try {
            const listPilots = httpsCallable(functions, 'getAllPilots');
            const result = await listPilots();
            return result.data;
        } catch (error) {
            console.error("Erro ao listar pilotos:", error);
            throw error;
        }
    }
};