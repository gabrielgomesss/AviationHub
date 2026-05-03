import { db } from "../services/firebase-config.js";

import {
    doc,
    collection,
    query,
    where,
    getDocs,
    updateDoc
} from "../services/firebase-config.js";

import { HangarService } from "../services/hangarservice.js";

let isLoading = false;

export default {

    async render() {
        return `
            <div>
                <h2>Dashboard do Hangar</h2>
                <div id="dashboardContent">Carregando...</div>
            </div>
        `;
    },

    async after_render() {

        const container = document.getElementById("dashboardContent");

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

            const carregar = async (hangarId) => {

                const hangar = hangares.find(h => h.id === hangarId);
                if (!hangar) return;

                let reservas = [];

                try {

                    // ✅ CORREÇÃO AQUI: hangarId (não "hangar")
                    const q = query(
                        collection(db, "reservas"),
                        where("hangarId", "==", hangarId)
                    );

                    const snap = await getDocs(q);

                    reservas = snap.docs.map(d => ({
                        id: d.id,
                        ...d.data()
                    }));

                } catch (err) {
                    console.error("Erro ao buscar reservas:", err);
                    reservas = [];
                }

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
                                <p><b>Total:</b> R$ ${r.valorTotal ?? 0}</p>

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

                        alert("Reserva aprovada");
                        carregar(hangarId);
                    });
                });

                document.querySelectorAll(".reject").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        await updateDoc(doc(db, "reservas", btn.dataset.id), {
                            status: "recusado"
                        });

                        alert("Reserva recusada");
                        carregar(hangarId);
                    });
                });
            };

            select.addEventListener("change", (e) => {
                carregar(e.target.value);
            });

            carregar(hangares[0].id);

        } catch (err) {
            console.error("Erro no dashboard:", err);
            container.innerHTML = "Erro ao carregar dashboard.";
        } finally {
            isLoading = false;
        }
    }
};