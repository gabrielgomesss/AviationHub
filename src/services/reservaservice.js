import { db } from "../../firebase-config.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { functions } from "../../firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export const ReservaService = {
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

    async getMinhasReservas() {
        try {
            const fn = httpsCallable(functions, "getMinhasReservas");
            const response = await fn();
            return response.data;
        } catch (error) {
            console.error("Erro no ReservaService ao buscar:", error);
            throw new Error(error.message || "Erro de conexão ao buscar reservas.");
        }
    },

    listenReservasPendentes(hangarId, callback) {
        if (!hangarId) {
            console.error("ERRO: listenReservasPendentes chamado sem hangarId!");
            return () => {};
        }

        const q = query(
            collection(db, "reservas"),
            where("hangarId", "==", hangarId),
            where("status", "==", "pendente")
        );

        return onSnapshot(q, (snapshot) => {
            callback(snapshot.size);
        }, (error) => {
            console.error("Erro no Firestore Listener:", error);
        });
    },

    listenReservasPendentesGeral(hangarIds, callback) {
        if (!hangarIds || hangarIds.length === 0) return () => {};
        
        const q = query(
            collection(db, "reservas"),
            where("hangarId", "in", hangarIds),
            where("status", "==", "pendente")
        );

        return onSnapshot(q, (snapshot) => {
            callback(snapshot.size);
        }, (error) => {
            console.error("Erro no listener geral de reservas:", error);
        });
    },

    listenNotificacoesPiloto(userId, callback) {
    if (!userId) return () => {};
    
    // Ajustado para capturar modificações tanto no feminino quanto no masculino
    const q = query(
        collection(db, "reservas"),
        where("clienteId", "==", userId),
        where("status", "in", ["aprovada", "recusada", "aprovado", "recusado"]),
        where("lida", "==", false)
    );

    return onSnapshot(q, (snapshot) => {
        console.log(`[Listener Piloto] Encontradas ${snapshot.size} notificações não lidas.`);
        callback(snapshot.size);
    }, (error) => {
        console.error("Erro no listener de notificações do piloto:", error);
    });
},

async marcarComoLidas(userId) {
    try {
        // Padrão exato do Cloud Function callable que você usa no restante do arquivo
        const fn = httpsCallable(functions, "marcarReservasComoLidas");
        const response = await fn(); 
        
        console.log("[Cloud Function] Resposta de leitura:", response.data);
        return response.data;
    } catch (error) {
        console.error("Erro no ReservaService ao chamar marcarReservasComoLidas:", error);
        throw new Error(error.message || "Erro ao atualizar notificações.");
    }
}
};