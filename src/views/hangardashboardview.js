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
     <div id="app-navbar"></div>
        <div class="hangar-page-layout" style="justify-content: flex-start;">
            <div class="hangar-container-fluid" style="height: 100%; border-radius: 0; padding-top: 50px; background: #fff;">
                <div class="page-header-block">
                    <h2>Dashboard</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <select id="hangarSelect" class="input-field-light"></select>
                        <select id="periodFilter" class="input-field-light">
                            <option value="month">Mês Atual</option>
                            <option value="week">Semana</option>
                        </select>
                    </div>
                </div>

                <div id="statsBox" style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 25px 0;">
                    <!-- Cards de KPI: Pendente, Receita, etc -->
                </div>

                <div class="form-card-full" style="background:#f8fafc; padding:20px; border-radius:24px; border:1px solid #f1f5f9;">
                    <h3 class="field-label" style="margin-bottom: 15px; display: block;">Fluxo de Reservas</h3>
                    <div id="dashboardContent">
                        <div class="loading-state" style="font-size:0.9rem; color:#94a3b8;">Carregando movimentação...</div>
                    </div>
                </div>
            </div>
        </div>
                    <!-- Gráfico e Resumo -->
                    <div class="dashboard-stats-grid">
                        <div class="chart-box">
                            <canvas id="chartReservas" width="200" height="200"></canvas>
                        </div>
                        <div id="statsBox" class="stats-cards-container">
                            <!-- Cards populados pelo after_render -->
                        </div>
                    </div>

                    <div class="section-divider"></div>
                    
                    <h3 class="section-label-light">GERENCIAR RESERVAS</h3>
                    <div id="dashboardContent" class="reservations-list">
                        <div class="loading-state">Carregando movimentação...</div>
                    </div>
                </div>
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

        let hangares = await HangarService.getMyHangares();
        if (!hangares.length) {
            select.innerHTML = `<option>Nenhum hangar</option>`;
            return;
        }

        select.innerHTML = hangares.map(h => `<option value="${h.id}">${h.nome} (${h.icao})</option>`).join("");
        let currentHangarId = hangares[0].id;
        let currentPeriod = "month";

        const getDateLimit = (period) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (period === "week") now.setDate(now.getDate() - now.getDay());
            if (period === "month") now.setDate(1);
            return now;
        };

        const drawChart = (pendenteQtd, aprovado, recusado) => {
            const total = pendenteQtd + aprovado + recusado || 1;
            const data = [
                { value: pendenteQtd, color: "#f59e0b" }, // Amber
                { value: aprovado, color: "#10b981" },    // Emerald
                { value: recusado, color: "#ef4444" }     // Rose
            ];
            let start = 0;
            const cx = 100, cy = 100, r = 80;
            ctx.clearRect(0, 0, 200, 200);
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
            // Buraco central (Donut style)
            ctx.beginPath();
            ctx.arc(cx, cy, 55, 0, 2 * Math.PI);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        };

        const carregar = (hangarId, period) => {
            if (unsubscribe) unsubscribe();
            const minDate = getDateLimit(period);
            const q = query(collection(db, "reservas"), where("hangarId", "==", hangarId));

            unsubscribe = onSnapshot(q, (snapshot) => {
                let metrics = { pendente: 0, aprovado: 0, recusado: 0, valorPendente: 0, totalValor: 0 };
                const reservas = [];

                snapshot.forEach(d => {
                    const r = d.data();
                    if (new Date(r.dataInicio) < minDate) return;
                    reservas.push({ id: d.id, ...r });
                    if (r.status === "aguardando_pagamento") {
                        metrics.pendente++;
                        metrics.valorPendente += Number(r.valorTotal || 0);
                    } else if (r.status === "aprovado") {
                        metrics.aprovado++;
                        metrics.totalValor += Number(r.valorTotal || 0);
                    } else if (r.status === "recusado") metrics.recusado++;
                });
                const formatarDataHora = (isoString) => {
    if (!isoString) return "---";
    const data = new Date(isoString);
    
    // Formata para: 04/05/2026 10:33
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

                statsBox.innerHTML = `
                    <div class="stat-pill amber">
                        <small>PENDENTE</small>
                        <span>R$ ${metrics.valorPendente.toFixed(2)}</span>
                    </div>
                    <div class="stat-pill emerald">
                        <small>RECEITA (APROVADO)</small>
                        <span>R$ ${metrics.totalValor.toFixed(2)}</span>
                    </div>
                    <div class="stat-pill slate">
                        <small>TOTAL RESERVAS</small>
                        <span>${reservas.length}</span>
                    </div>
                `;

                drawChart(metrics.pendente, metrics.aprovado, metrics.recusado);

                container.innerHTML = reservas.length === 0 
                    ? "<p class='empty-msg'>Nenhuma atividade no período.</p>"
                    : reservas.map(r => `
                        <div class="reservation-card-admin">
                            <div class="res-info">
                                <strong>${r.prefixoAviao || 'S/P'}</strong>
                                <small>${r.userEmail}</small>
                                <!-- Datas formatadas para o padrão BR -->
    <div class="res-dates" style="font-size: 0.85rem; color: #64748b; margin-top: 5px;">
        <i class="far fa-calendar-alt"></i> ${formatarDataHora(r.dataInicio)} 
        <span style="margin: 0 5px;">➜</span> 
        ${formatarDataHora(r.dataFim)}
    </div>
                                <!-- Mapeia a lista de serviços -->
    <div class="res-services" style="font-size: 0.8rem; color: #10b981; font-weight: bold; margin-top: 4px;">
        ${r.servicos && r.servicos.length > 0 
            ? r.servicos.map(s => `<span>${s.nome}</span>`).join(', ') 
            : 'Nenhum serviço'}
    </div>
                            </div>
                            <div class="res-actions" style="text-align:left;">
                                <span class="badge-${r.status}">${r.status.replace('_', ' ')}</span>
                                <div class="btn-group-row">
                                    <button class="btn-approve-icon approve" data-id="${r.id}">✓</button>
                                    <button class="btn-reject-icon reject" data-id="${r.id}">✕</button>
                                </div>
                            </div>
                        </div>
                    `).join("");

                document.querySelectorAll(".approve").forEach(btn => {
                    btn.onclick = () => updateDoc(doc(db, "reservas", btn.dataset.id), { status: "aprovado" });
                });
                document.querySelectorAll(".reject").forEach(btn => {
                    btn.onclick = () => updateDoc(doc(db, "reservas", btn.dataset.id), { status: "recusado" });
                });
            });
        };

        select.addEventListener("change", (e) => carregar(e.target.value, currentPeriod));
        periodFilter.addEventListener("change", (e) => carregar(currentHangarId, e.target.value));
        carregar(currentHangarId, currentPeriod);
    }
};