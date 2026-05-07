import { db, collection, query, where, onSnapshot } from '../../firebase-config.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';


// Remova a chamada global: const functions = getFunctions();

export const DashboardService = {
    
    // Escuta em tempo real (Sem alterações aqui)
    listenDashboardData(hangarId, period, callback) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (period === "week") now.setDate(now.getDate() - now.getDay());
        else now.setDate(1);

        const q = query(collection(db, "reservas"), where("hangarId", "==", hangarId));

        return onSnapshot(q, (snapshot) => {
            let metrics = { pendente: 0, aprovado: 0, recusado: 0, valorPendente: 0, totalValor: 0 };
            const reservas = [];

            snapshot.forEach(d => {
                const r = d.data();
                if (new Date(r.dataInicio) < now) return;
                
                reservas.push({ id: d.id, ...r });
                if (r.status === "aguardando_pagamento") {
                    metrics.pendente++;
                    metrics.valorPendente += Number(r.valorTotal || 0);
                } else if (r.status === "aprovado") {
                    metrics.aprovado++;
                    metrics.totalValor += Number(r.valorTotal || 0);
                } else if (r.status === "recusado") metrics.recusado++;
            });

            callback({ metrics, reservas });
        });
    },

    // Ação via Cloud Function ajustada para evitar o erro de inicialização
    async updateReservaStatus(reservaId, novoStatus) {
        try {
            const functions = getFunctions(); // Chamada dentro do método garante que o Firebase já iniciou[cite: 4]
            const updateStatus = httpsCallable(functions, 'updateReservaStatus');
            return await updateStatus({ reservaId, status: novoStatus });
        } catch (error) {
            console.error("Erro na Cloud Function:", error);
            throw error;
        }
    }
};