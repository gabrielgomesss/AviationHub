import { db, functions } from '../../firebase-config.js'; 
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

export const DashboardService = {
    async updateReservaStatus(id, status, msgAdmin = "") {
        try {
            const fn = httpsCallable(functions, "updateReservaStatus");
            return (await fn({ id, status, msgAdmin })).data;
        } catch (error) { throw error; }
    },

    listenDashboardData(hangarId, period, callback) {
        const q = query(collection(db, "reservas"), where("hangarId", "==", hangarId));

        return onSnapshot(q, (snapshot) => {
            let metrics = { valorPendente: 0, totalValor: 0 };
            const reservas = [];

            snapshot.forEach(d => {
                const r = d.data();
                let valorNumerico = 0;
                const campoValor = r.valorTotal || "0";

                // Se o valor for o texto "À combinar", tratamos como 0 para o cálculo financeiro
                if (typeof campoValor === 'string' && campoValor.includes("combinar")) {
                    valorNumerico = 0;
                } else if (typeof campoValor === 'string') {
                    valorNumerico = parseFloat(campoValor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
                } else {
                    valorNumerico = Number(campoValor) || 0;
                }

                reservas.push({ 
                    ...r, 
                    id: d.id, 
                    valorExibicao: r.valorTotal // Mantém o texto original para o ADM ver
                });

                if (r.status === "pendente" || r.status === "aguardando_pagamento") {
                    metrics.valorPendente += valorNumerico;
                } else if (r.status === "aprovado") {
                    metrics.totalValor += valorNumerico;
                }
            });

            callback({ metrics, reservas });
        });
    }
};