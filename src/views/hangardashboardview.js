import { db } from "../services/firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    onSnapshot
} from "../services/firebase-config.js";

import { HangarService } from "../services/hangarservice.js";

let isLoading = false;
let unsubscribeNotif = null;

export default {

    async render() {
        return `
            <div>
                <h2>
                    Dashboard do Hangar
                    <span id="notifBadge" style="
                        background:red;
                        color:white;
                        border-radius:50%;
                        padding:4px 10px;
                        font-size:12px;
                        display:none;
                        margin-left:10px;
                    ">0</span>
                </h2>

                <div id="dashboardContent">Carregando...</div>
            </div>
        `;
    },

    async after_render() {

        const container = document.getElementById("dashboardContent");
        const badge = document.getElementById("notifBadge");

        if (isLoading) return;
        isLoading = true;

        try {

            const hangares = await HangarService.getMyHangares();

            if (!hangares || hangares.length === 0) {
                container.innerHTML = "Nenhum hangar encontrado para este usuário.";
                return;
            }

            container.innerHTML = `
                <label>Selecione o hangar:</label>
                <select id="hangarSelect">
                    ${hangares.map(h => `
                        <option value="${h.id}">
                            ${h.nome} (${h.icao})
                        </option>
                    `).join("")}
                </select>

                <div id="dashboardData" style="margin-top:20px;">
                    Carregando reservas...
                </div>
            `;

            const select = document.getElementById("hangarSelect");
            const dataContainer = document.getElementById("dashboardData");

            // =========================
            // 🔥 NOTIFICAÇÃO EM TEMPO REAL
            // =========================
            const iniciarNotificacao = (hangarId) => {

                if (unsubscribeNotif) {
                    unsubscribeNotif();
                }

                const q = query(
                    collection(db, "reservas"),
                    where("hangarId", "==", hangarId),
                    where("status", "==", "aguardando_pagamento")
                );

                unsubscribeNotif = onSnapshot(q, (snapshot) => {

                    const count = snapshot.size;

                    if (count > 0) {
                        badge.style.display = "inline-block";
                        badge.innerText = count;
                    } else {
                        badge.style.display = "none";
                    }
                });
            };

            // =========================
            // 🔥 CARREGAR RESERVAS
            // =========================
            const carregar = async (hangarId) => {

                const hangar = hangares.find(h => h.id === hangarId);
                if (!hangar) return;

                const q = query(
                    collection(db, "reservas"),
                    where("hangarId", "==", hangarId)
                );

                const snap = await getDocs(q);

                const reservas = snap.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));

                dataContainer.innerHTML = `
                    <h3>${hangar.nome}</h3>
                    <p><b>ICAO:</b> ${hangar.icao}</p>

                    <hr/>

                    <h4>Reservas</h4>

                    ${
                        reservas.length === 0
                        ? "<p>Nenhuma reserva encontrada</p>"
                        : reservas.map(r => `
                            <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                                <p><b>Usuário:</b> ${r.userEmail || '-'}</p>
                                <p><b>Aeronave:</b> ${r.prefixoAviao || '-'}</p>
                                <p><b>Início:</b> ${r.dataInicio || '-'}</p>
                                <p><b>Fim:</b> ${r.dataFim || '-'}</p>
                                <p><b>Status:</b> ${r.status}</p>

                                <button class="approve" data-id="${r.id}">Aprovar</button>
                                <button class="reject" data-id="${r.id}">Recusar</button>
                            </div>
                        `).join("")
                    }
                `;

                document.querySelectorAll(".approve").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        await updateDoc(doc(db, "reservas", btn.dataset.id), {
                            status: "aprovado"
                        });

                        carregar(hangarId);
                    });
                });

                document.querySelectorAll(".reject").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        await updateDoc(doc(db, "reservas", btn.dataset.id), {
                            status: "recusado"
                        });

                        carregar(hangarId);
                    });
                });
            };

            // =========================
            // 🔥 EVENTO SELECT
            // =========================
            select.addEventListener("change", (e) => {
                carregar(e.target.value);
                iniciarNotificacao(e.target.value);
            });

            // =========================
            // 🔥 INIT
            // =========================
            carregar(hangares[0].id);
            iniciarNotificacao(hangares[0].id);

        } catch (err) {
            console.error("Erro no dashboard:", err);
            container.innerHTML = "Erro ao carregar dashboard.";
        } finally {
            isLoading = false;
        }
    }
};