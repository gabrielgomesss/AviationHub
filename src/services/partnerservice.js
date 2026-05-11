import { functions } from "../../firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export const PartnerService = {
    async getPartnerProfile(userId) {
        try {
            const getProfile = httpsCallable(functions, 'getPartnerProfile');
            const result = await getProfile({ userId });
            return result.data;
        } catch (error) {
            console.error("Erro ao buscar perfil do parceiro:", error);
            throw error;
        }
    },

    async savePartnerProfile(userId, profileData) {
        try {
            const saveProfile = httpsCallable(functions, 'savePartnerProfile');
            const result = await saveProfile({ userId, profileData });
            return result.data;
        } catch (error) {
            console.error("Erro ao salvar perfil do parceiro:", error);
            throw error;
        }
    },

    async getAllPartners() {
        try {
            const listPartners = httpsCallable(functions, 'getAllPartners');
            const result = await listPartners();
            return result.data;
        } catch (error) {
            console.error("Erro ao listar parceiros:", error);
            throw error;
        }
    }
};