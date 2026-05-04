import { db } from "../../src/services/firebase-config.js";
import { doc, getDoc, setDoc } from "../../src/services/firebase-config.js";

/**
 * PilotService - Gerencia os dados profissionais dos pilotos.
 * Esta camada de serviço garante que cada "evento" de atualização 
 * seja registrado corretamente no banco de dados.
 */
export const PilotService = {
    /**
     * Recupera o perfil profissional de um piloto pelo UID.
     * @param {string} userId - O ID do usuário no Firebase Auth.
     * @returns {Promise<Object|null>} - Dados do perfil ou null se não existir.
     */
    async getPilotProfile(userId) {
        if (!userId) return null;
        
        try {
            const docRef = doc(db, "pilotos", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.log("Perfil não encontrado. O vaso está pronto para ser preenchido.");
                return null;
            }
        } catch (error) {
            console.error("Erro ao buscar perfil do piloto:", error);
            throw error;
        }
    },

    /**
     * Salva ou atualiza as informações do piloto.
     * @param {string} userId - O ID do usuário.
     * @param {Object} profileData - Dados contendo horas, foto e experiência.
     */
    async savePilotProfile(userId, profileData) {
        if (!userId) throw new Error("ID do usuário é obrigatório.");

        try {
            const docRef = doc(db, "pilotos", userId);
            
            // Utilizamos o merge: true para não sobrescrever campos 
            // que não foram enviados neste formulário específico.
            await setDoc(docRef, {
                ...profileData,
                lastUpdate: new Date().toISOString(),
                // Garante que o ID do usuário esteja sempre atrelado ao documento
                uid: userId 
            }, { merge: true });

            console.log("Perfil atualizado com sucesso. Luz expandida!");
        } catch (error) {
            console.error("Erro ao salvar perfil do piloto:", error);
            throw error;
        }
    }
};