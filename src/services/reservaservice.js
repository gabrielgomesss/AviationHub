import { db } from "../services/firebase-config.js";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    onSnapshot // Importado para o real-time do badge
} from "../services/firebase-config.js";

export const ReservaService = {

    async criarReserva(reserva) {
        try {
            // =========================
            // VALIDAÇÃO
            // =========================
            if (!reserva.hangarId) throw new Error("Hangar não informado");
            if (!reserva.userId) throw new Error("Usuário não identificado");
            if (!reserva.servicos || reserva.servicos.length === 0) {
                throw new Error("Nenhum serviço selecionado");
            }

            // =========================
            // CALCULAR DATAS (SEM FUNÇÕES EXTERNAS)
            // =========================
            let dataInicio = reserva.dataInicio;
            let dataFim = reserva.dataFim;

            if (!dataInicio || !dataFim) {
                const datas = reserva.servicos
                    .filter(s => s.inicio && s.fim)
                    .map(s => ({
                        inicio: new Date(s.inicio),
                        fim: new Date(s.fim)
                    }));

                if (datas.length > 0) {
                    dataInicio = new Date(Math.min(...datas.map(d => d.inicio.getTime())));
                    dataFim = new Date(Math.max(...datas.map(d => d.fim.getTime())));
                } else {
                    const now = new Date();
                    dataInicio = now;
                    dataFim = new Date(now.getTime() + 3600000); // +1h
                }
            }

            // =========================
            // CONFLITO[cite: 7]
            // =========================
            const conflitos = await this.verificarConflito(
                reserva.hangarId,
                dataInicio,
                dataFim
            );

            if (conflitos) {
                throw new Error("Já existe uma reserva nesse horário");
            }

            // =========================
            // NORMALIZAÇÃO[cite: 7]
            // =========================
            const reservaFinal = {
                hangarId: reserva.hangarId,
                userId: reserva.userId,
                userName: reserva.userName || "",
                userEmail: reserva.userEmail || "",
                prefixoAviao: (reserva.prefixoAviao || "").toUpperCase(),
                servicos: reserva.servicos,
                valorTotal: reserva.valorTotal || 0,
                dataInicio: dataInicio.toISOString(),
                dataFim: dataFim.toISOString(),
                status: reserva.status || "aguardando_pagamento",
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "reservas"), reservaFinal);

        } catch (err) {
            console.error("Erro ao criar reserva:", err);
            throw new Error(err.message || "Erro ao criar reserva");
        }
    },

    async verificarConflito(hangarId, inicio, fim) {
        const q = query(
            collection(db, "reservas"),
            where("hangarId", "==", hangarId)
        );

        const snapshot = await getDocs(q);

        for (const d of snapshot.docs) {
            const r = d.data();
            const inicioExistente = new Date(r.dataInicio);
            const fimExistente = new Date(r.dataFim);

            if (
                (new Date(inicio) < fimExistente) &&
                (new Date(fim) > inicioExistente)
            ) {
                return true;
            }
        }
        return false;
    },

    // --- NOVA FUNÇÃO PARA O BADGE (REAL-TIME) ---[cite: 7]
    listenReservasPorStatus(status, callback) {
        const q = query(
            collection(db, "reservas"),
            where("status", "==", status)
        );
        
        return onSnapshot(q, (snapshot) => {
            const reservas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(reservas);
        });
    }
};