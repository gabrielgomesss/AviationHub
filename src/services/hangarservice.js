import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";

/**
 * Busca hangar por ID
 */
async function getHangarById(id) {
  if (!id) return null;

  const ref = doc(db, "Hangares", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
}

/**
 * Busca hangares por ICAO
 */
async function getHangaresByICAO(icao) {
  if (!icao) return [];

  const q = query(
    collection(db, "Hangares"),
    where("icao", "==", icao)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
}

/**
 * Export único do service (PADRÃO CONSISTENTE)
 */
export const HangarService = {
  getHangarById,
  getHangaresByICAO
};