import { functions } from "../../firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export const ReservaService = {
    // Chama a Cloud Function para criar uma nova reserva
    async createReserva(dados) {
        try {
            const fn = httpsCallable(functions, "createReserva");
            const response = await fn(dados); 
            return response.data;
        } catch (error) {
            console.error("Erro no ReservaService ao criar:", error);
            throw new Error(error.message || "Erro ao processar reserva.");
        }
    },

    // NOVA: Chama a Cloud Function para buscar as reservas do usuário logado
    async getMinhasReservas() {
        try {
            const fn = httpsCallable(functions, "getMinhasReservas");
            const response = await fn(); // O UID é identificado automaticamente pelo contexto de auth no backend
            return response.data;
        } catch (error) {
            console.error("Erro no ReservaService ao buscar:", error);
            throw new Error(error.message || "Erro de conexão ao buscar reservas.");
        }
    },

    listenReservasPorStatus(status, callback) {
        callback([]);
        return () => {};
    }
};