import { functions } from "../../firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export const ReservaService = {
    async createReserva(dados) {
        try {
            const fn = httpsCallable(functions, "createReserva");
            const response = await fn(dados); 
            return response.data;
        } catch (error) {
            console.error("Erro no ReservaService:", error);
            throw new Error(error.message || "Erro ao processar reserva.");
        }
    },

    listenReservasPorStatus(status, callback) {
        callback([]);
        return () => {};
    }
};