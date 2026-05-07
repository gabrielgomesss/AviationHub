import { HangarService } from '../services/hangarservice.js';
import { AuthService } from '../services/authservice.js';
import { DashboardService } from '../services/dashboardservice.js';

let unsubscribe = null;

const HangarDashboardView = {
    async render() {
        const user = AuthService.getUser();
        if (user?.role !== 'admin_hangar') {
            return `<div class="access-denied"><h2>Acesso Restrito</h2></div>`;
        }

        return `
            <div class="hangar-page-layout">
                <div class="hangar-container-fluid">
                    <div class="page-header-block">
                        <h2>Dashboard</h2>
                        <div class="filter-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                            <select id="hangarSelect" class="input-field-light"></select>
                            <select id="periodFilter" class="input-field-light">
                                <option value="month">Mês Atual</option>
                                <option value="week">Semana</option>
                            </select>
                        </div>
                    </div>

                    <div id="statsBox" class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 25px 0;"></div>

                    <div class="section-divider"></div>
                    <h3 class="field-label">FLUXO DE RESERVAS</h3>
                    <div id="dashboardContent"></div>
                </div>
            </div>
        `;
    },

    async after_render() {
        const user = AuthService.getUser();
        if (user?.role !== 'admin_hangar') return;

        const select = document.getElementById("hangarSelect");
        const periodFilter = document.getElementById("periodFilter");

        const hangares = await HangarService.getMyHangares();
        if (!hangares?.length) return;

        select.innerHTML = hangares.map(h => `<option value="${h.id}">${h.nome} (${h.icao})</option>`).join("");

        const handleUpdate = async (id, status) => {
            try {
                // Feedback visual imediato opcional aqui
                await DashboardService.updateReservaStatus(id, status);
            } catch (err) {
                alert("Erro ao atualizar status: " + err.message);
            }
        };

        const carregarDados = () => {
            if (unsubscribe) unsubscribe();
            unsubscribe = DashboardService.listenDashboardData(select.value, periodFilter.value, (data) => {
                this.renderStats(data.metrics);
                this.renderReservas(data.reservas, handleUpdate);
            });
        };

        select.onchange = carregarDados;
        periodFilter.onchange = carregarDados;
        carregarDados();
    },

    renderStats(m) {
        document.getElementById("statsBox").innerHTML = `
            <div class="stat-pill amber"><span>R$ ${m.valorPendente.toFixed(2)}</span></div>
            <div class="stat-pill emerald"><span>R$ ${m.totalValor.toFixed(2)}</span></div>
        `;
    },

    renderReservas(reservas, onAction) {
        const container = document.getElementById("dashboardContent");
        container.innerHTML = reservas.map(r => `
            <div class="reservation-card-admin">
                <div class="res-info">
                    <strong>${r.prefixoAviao}</strong>
                    <small>${r.status}</small>
                </div>
                <div class="res-actions">
                    <button class="btn-approve" data-id="${r.id}">✓</button>
                    <button class="btn-reject" data-id="${r.id}">✕</button>
                </div>
            </div>
        `).join("");

        container.querySelectorAll('.btn-approve').forEach(b => b.onclick = () => onAction(b.dataset.id, 'aprovado'));
        container.querySelectorAll('.btn-reject').forEach(b => b.onclick = () => onAction(b.dataset.id, 'recusado'));
    }
};

export default HangarDashboardView; //[cite: 3]