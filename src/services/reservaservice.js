import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const ReservaService = {

    async criarReserva(reserva) {

        // 🔥 VALIDAR CONFLITO
        const conflitos = await this.verificarConflito(
            reserva.hangarId,
            reserva.dataInicio,
            reserva.dataFim
        );

        if (conflitos) {
            throw new Error("Já existe uma reserva nesse horário");
        }

        await addDoc(collection(db, "reservas"), {
            ...reserva,
            createdAt: new Date().toISOString()
        });
    },

    async verificarConflito(hangarId, inicio, fim) {

        const q = query(
            collection(db, "reservas"),
            where("hangarId", "==", hangarId)
        );

        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
            const r = doc.data();

            const inicioExistente = new Date(r.dataInicio);
            const fimExistente = new Date(r.dataFim);

            // 🔥 REGRA DE CONFLITO
            if (
                (new Date(inicio) < fimExistente) &&
                (new Date(fim) > inicioExistente)
            ) {
                return true;
            }
        }

        return false;
    }
};