import { db } from "../services/firebase-config.js";
import {
    collection,
    query,
    where,
    onSnapshot
} from "../services/firebase-config.js";

export const NotificationService = {

    unsubscribe: null,

    listenPendingReservations(hangarId, callback) {

        if (!hangarId) return;

        const q = query(
            collection(db, "reservas"),
            where("hangarId", "==", hangarId),
            where("status", "==", "aguardando_pagamento")
        );

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            callback(snapshot.size);
        });
    },

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
};