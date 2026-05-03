import { db } from '../services/firebase-config.js';

import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc
} from "../services/firebase-config.js";

import { HangarService } from '../services/hangarservice.js';

let unsubscribe = null;

export default {

    async render() {
        return `
            <div>
                <h2>Dashboard do Hangar</h2>

                <!-- FILTRO PERÍODO -->
                <div style="margin:10px 0;">
                    <label><b>Período:</b></label>
                    <select id="periodFilter">
                        <option value="day">Dia</option>
                        <option value="week">Semana</option>
                        <option value="month" selected>Mês</option>
                    </select>
                </div>

                <div style="display:flex; gap:20px; margin-top:20px;">
                    <div>
                        <canvas id="chartReservas" width="300" height="300"></canvas>
                    </div>

                    <div id="statsBox">
                        Carregando dados...
                    </div>
                </div>

                <hr/>

                <div>
                    <label><b>Selecionar Hangar:</b></label><br/>
                    <select id="hangarSelect"></select>
                </div>

                <hr/>

                <div id="dashboardContent"></div>
            </div>
        `;
    },

    async after_render() {

        const statsBox = document.getElementById("statsBox");
        const container = document.getElementById("dashboardContent");
        const select = document.getElementById("hangarSelect");
        const periodFilter = document.getElementById("periodFilter");

        const canvas = document.getElementById("chartReservas");
        const ctx = canvas.getContext("2d");

        let hangares = [];
        let currentHangarId = null;
        let currentPeriod = "month";

        // =========================
        // 📊 FILTRO DE DATA
        // =========================
        const getDateLimit = (period) => {
            const now = new Date();

            if (period === "day") {
                now.setHours(0, 0, 0, 0);
            }

            if (period === "week") {
                const day = now.getDay();
                now.setDate(now.getDate() - day);
                now.setHours(0, 0, 0, 0);
            }

            if (period === "month") {
                now.setDate(1);
                now.setHours(0, 0, 0, 0);
            }

            return now;
        };

        // =========================
        // 📊 GRÁFICO
        // =========================
        const drawChart = (pendenteQtd, aprovado, recusado, valorPendente) => {

            const total = pendenteQtd + aprovado + recusado || 1;

            const data = [
                { value: pendenteQtd, color: "#f1c40f" },
                { value: aprovado, color: "#2ecc71" },
                { value: recusado, color: "#e74c3c" }
            ];

            let start = 0;
            const cx = 150;
            const cy = 150;
            const r = 100;

            ctx.clearRect(0, 0, 300, 300);

            data.forEach(item => {

                const slice = (item.value / total) * 2 * Math.PI;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, start, start + slice);
                ctx.closePath();

                ctx.fillStyle = item.color;
                ctx.fill();

                start += slice;
            });

            // 💰 centro do gráfico
            ctx.fillStyle = "#000";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                `Pendente: R$ ${valorPendente.toFixed(2)}`,
                cx,
                cy
            );
        };

        // =========================
        // 🔥 HANGARES
        // =========================
        hangares = await HangarService.getMyHangares();

        if (!hangares.length) {
            select.innerHTML = `<option>Nenhum hangar</option>`;
            return;
        }

        select.innerHTML = hangares.map(h =>
            `<option value="${h.id}">${h.nome} (${h.icao})</option>`
        ).join("");

        currentHangarId = hangares[0].id;
        select.value = currentHangarId;

        // =========================
        // 🔥 CARREGAR RESERVAS
        // =========================
        const carregar = (hangarId, period) => {

            if (unsubscribe) unsubscribe();

            const minDate = getDateLimit(period);

            const q = query(
                collection(db, "reservas"),
                where("hangarId", "==", hangarId)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {

                let pendenteQtd = 0;
                let aprovado = 0;
                let recusado = 0;

                let valorPendente = 0;
                let totalValor = 0;

                const reservas = [];

                snapshot.forEach(d => {

                    const r = d.data();
                    const data = new Date(r.dataInicio);

                    // filtro período
                    if (data < minDate) return;

                    reservas.push({ id: d.id, ...r });

                    if (r.status === "aguardando_pagamento") {
                        pendenteQtd++;
                        valorPendente += Number(r.valorTotal || 0);
                    }
                    else if (r.status === "aprovado") aprovado++;
                    else if (r.status === "recusado") recusado++;

                    totalValor += Number(r.valorTotal || 0);
                });

                // =========================
                // 📊 STATS
                // =========================
                statsBox.innerHTML = `
                    <h3>Resumo (${period})</h3>

                    <p>⏳ Pendentes: ${pendenteQtd}</p>
                    <p>💰 Valor pendente: R$ ${valorPendente.toFixed(2)}</p>

                    <p>✅ Aprovadas: ${aprovado}</p>
                    <p>❌ Recusadas: ${recusado}</p>

                    <p>📦 Total: ${reservas.length}</p>

                    <hr/>

                    <p><b>💰 Receita total: R$ ${totalValor.toFixed(2)}</b></p>
                `;

                drawChart(pendenteQtd, aprovado, recusado, valorPendente);

                // =========================
                // 📋 CARDS
                // =========================
                container.innerHTML = reservas.length === 0
                    ? "<p>Nenhuma reserva encontrada</p>"
                    : reservas.map(r => `
                        <div style="
                            border:1px solid #ccc;
                            padding:12px;
                            margin-bottom:10px;
                            border-radius:8px;
                        ">
                            <p><b>Usuário:</b> ${r.userEmail || '-'}</p>
                            <p><b>Aeronave:</b> ${r.prefixoAviao || '-'}</p>
                            <p><b>Entrada:</b> ${r.dataInicio || '-'}</p>
                            <p><b>Saída:</b> ${r.dataFim || '-'}</p>
                            <p><b>Status:</b> ${r.status}</p>
                            <p><b>💰 Valor:</b> R$ ${(r.valorTotal || 0).toFixed(2)}</p>

                            <button class="approve" data-id="${r.id}">Aprovar</button>
                            <button class="reject" data-id="${r.id}">Recusar</button>
                        </div>
                    `).join("");

                document.querySelectorAll(".approve").forEach(btn => {
                    btn.onclick = async () => {
                        await updateDoc(doc(db, "reservas", btn.dataset.id), {
                            status: "aprovado"
                        });
                    };
                });

                document.querySelectorAll(".reject").forEach(btn => {
                    btn.onclick = async () => {
                        await updateDoc(doc(db, "reservas", btn.dataset.id), {
                            status: "recusado"
                        });
                    };
                });

            });
        };

        // =========================
        // 🔄 EVENTS
        // =========================
        select.addEventListener("change", (e) => {
            currentHangarId = e.target.value;
            carregar(currentHangarId, currentPeriod);
        });

        periodFilter.addEventListener("change", (e) => {
            currentPeriod = e.target.value;
            carregar(currentHangarId, currentPeriod);
        });

        // =========================
        // 🚀 INIT
        // =========================
        carregar(currentHangarId, currentPeriod);
    }
};