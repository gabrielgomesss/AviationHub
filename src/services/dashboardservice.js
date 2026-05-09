import { db } from '../../firebase-config.js'; 
import { 
    collection, 
    query, 
    where, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const DashboardService = {
    listenDashboardData(hangarId, period, callback) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (period === "week") now.setDate(now.getDate() - 7);
        else now.setDate(1);

        const q = query(collection(db, "reservas"), where("hangarId", "==", hangarId));

        return onSnapshot(q, (snapshot) => {
            let metrics = { valorPendente: 0, totalValor: 0 };
            const reservas = [];

            snapshot.forEach(d => {
                const r = d.data();
                
                // Conversão flexível de valor
                let valorNumerico = 0;
                const campoValor = r.valorTotal || r.valor || 0;
                if (typeof campoValor === 'string') {
                    valorNumerico = parseFloat(campoValor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
                } else {
                    valorNumerico = Number(campoValor) || 0;
                }

                // Guardamos TUDO que vem do banco no objeto
                reservas.push({ 
                    ...r, 
                    id: d.id, 
                    valorFinal: valorNumerico 
                });

                if (r.status === "aguardando_pagamento" || r.status === "pendente") {
                    metrics.valorPendente += valorNumerico;
                } else if (r.status === "aprovado") {
                    metrics.totalValor += valorNumerico;
                }
            });

            callback({ metrics, reservas });
        });
    }
};