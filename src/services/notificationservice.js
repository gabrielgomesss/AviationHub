import { db, collection, query, where, onSnapshot } from "./firebase-config.js";

export const NotificationService = {
    unsubscribe: null,
    listenPendingReservations(hangarId, callback) {
        const q = query(collection(db, "reservas"), where("hangarId", "==", hangarId), where("status", "==", "aguardando_pagamento"));
        this.unsubscribe = onSnapshot(q, (snap) => callback(snap.size));
    },
    stop() { this.unsubscribe?.(); }
};