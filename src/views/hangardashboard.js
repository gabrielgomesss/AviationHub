import { HangarService } from '../services/hangarservice.js';
import { AuthService } from '../services/authservice.js';
import { DashboardService } from '../services/dashboardservice.js';

let unsubscribe = null;
let currentReservas = []; // Cache local para garantir que os dados apareçam no modal

const HangarDashboardView = {
    async render() {
        return `
            <div class="hangar-page-layout">
                <div class="hangar-container-fluid">
                    <div class="page-header-block">
                        <h2>Painel Administrativo</h2>
                        <div class="filter-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                            <select id="hangarSelect" class="input-field-light"></select>
                            <select id="periodFilter" class="input-field-light">
                                <option value="month">Este Mês</option>
                                <option value="week">Esta Semana</option>
                            </select>
                        </div>
                    </div>

                    <div id="statsBox" class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;"></div>

                    <div class="section-divider"></div>
                    <h3 class="field-label" style="color: #64748b; font-size: 0.8rem; letter-spacing: 1px;">FLUXO DE RESERVAS</h3>
                    <div id="dashboardContent"></div>
                </div>
            </div>

            <div id="modalDetalhes" class="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;">
                <div class="modal-content" style="background:white; padding:25px; border-radius:20px; width:94%; max-width:450px; max-height: 90vh; overflow-y: auto; position: relative;">
                    <div id="modalBody"></div>
                    
                    <div style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px;">
                        <label style="font-weight:bold; font-size:0.75rem; color:#94a3b8; text-transform: uppercase;">Mensagem para o Piloto</label>
                        <textarea id="msgAdmin" placeholder="Instruções de check-in, vaga ou motivo da recusa..." style="width:100%; height:80px; margin-top:8px; border-radius:12px; padding:12px; border:1px solid #e2e8f0; font-family: inherit; font-size: 0.9rem;"></textarea>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:25px;">
                        <button id="btnAprovar" style="flex:1; background:#10b981; color:white; border:none; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.9rem;">APROVAR</button>
                        <button id="btnRecusar" style="flex:1; background:#ef4444; color:white; border:none; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.9rem;">REPROVAR</button>
                    </div>
                    
                    <button onclick="document.getElementById('modalDetalhes').style.display='none'" style="width:100%; margin-top:15px; background:none; border:none; color:#94a3b8; cursor:pointer; font-weight:500; font-size:0.9rem;">Voltar</button>
                </div>
            </div>
        `;
    },

    async after_render() {
        const select = document.getElementById("hangarSelect");
        const period = document.getElementById("periodFilter");

        // Busca hangares onde o usuário é admin
        const hangares = await HangarService.getMyHangares();
        if (!hangares?.length) {
            document.getElementById("dashboardContent").innerHTML = "<p>Nenhum hangar encontrado sob sua gestão.</p>";
            return;
        }

        select.innerHTML = hangares.map(h => `<option value="${h.id}">${h.nome}</option>`).join("");

        const carregarDados = () => {
            if (unsubscribe) unsubscribe();
            unsubscribe = DashboardService.listenDashboardData(select.value, period.value, (data) => {
                currentReservas = data.reservas; // Alimenta o cache
                this.updateUI(data);
            });
        };

        select.onchange = carregarDados;
        period.onchange = carregarDados;
        carregarDados();
    },

    updateUI(data) {
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Atualiza os cards de métricas
        document.getElementById("statsBox").innerHTML = `
            <div class="stat-pill amber">
                <small style="display:block; opacity:0.8; font-size:0.6rem; text-transform:uppercase;">Pendentes</small>
                <strong>${fmt(data.metrics.valorPendente)}</strong>
            </div>
            <div class="stat-pill emerald">
                <small style="display:block; opacity:0.8; font-size:0.6rem; text-transform:uppercase;">Aprovados</small>
                <strong>${fmt(data.metrics.totalValor)}</strong>
            </div>
        `;

        const container = document.getElementById("dashboardContent");
        if (!data.reservas.length) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;">Nenhuma reserva para este filtro.</div>`;
            return;
        }

        // Renderiza a lista de cards
        container.innerHTML = data.reservas.map((r, index) => `
            <div class="reservation-card-admin" onclick="HangarDashboardView.openModalByIndex(${index})" style="background:white; padding:16px; border-radius:16px; margin-bottom:12px; cursor:pointer; border-left:6px solid #3b82f6; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div>
                    <strong style="font-size:1.1rem; color:#1e293b; display:block;">${r.prefixo || r.prefixoAviao || 'S/P'}</strong>
                    <span style="font-size:0.7rem; color:#3b82f6; font-weight:800; text-transform:uppercase;">${r.status}</span>
                </div>
                <div style="text-align:right">
                    <small style="display:block; color:#64748b; font-size:0.75rem;">${r.dataInicio || ''}</small>
                    <strong style="color:#0f172a; font-size:1rem;">R$ ${Number(r.valorFinal || 0).toFixed(2)}</strong>
                </div>
            </div>
        `).join("");
    },

    openModalByIndex(index) {
        const r = currentReservas[index];
        if (!r) return;

        const modal = document.getElementById("modalDetalhes");
        
        // Mapeamento Flexível: Tenta encontrar o dado independente do nome do campo no Firebase
        const piloto = r.nomePiloto || r.piloto || r.nome || 'Não informado';
        const aeronave = r.prefixo || r.prefixoAviao || 'S/P';
        const dIn = r.dataInicio || r.entrada || '--/--/--';
        const dOut = r.dataFim || r.saida || '--/--/--';
        const valor = Number(r.valorFinal || r.valorTotal || 0);

        document.getElementById("modalBody").innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <h2 style="margin:0; color:#0f172a; font-size:1.8rem;">${aeronave}</h2>
                <span style="background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:800; text-transform:uppercase;">${r.status}</span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; background:#f8fafc; padding:18px; border-radius:18px; margin-bottom:15px;">
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Piloto</label>
                    <span style="font-size:0.95rem; color:#1e293b; font-weight:600;">${piloto}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Valor Total</label>
                    <span style="font-size:0.95rem; color:#059669; font-weight:bold;">R$ ${valor.toFixed(2)}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Entrada</label>
                    <span style="font-size:0.85rem; color:#334155;">${dIn}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Saída</label>
                    <span style="font-size:0.85rem; color:#334155;">${dOut}</span>
                </div>
            </div>

            <div style="padding:0 5px; font-size:0.85rem; color:#64748b; border-left: 2px solid #e2e8f0; margin-left: 5px; padding-left: 12px;">
                <p style="margin:4px 0;"><strong>Modelo:</strong> ${r.modelo || r.modeloAviao || 'Não inf.'}</p>
                <p style="margin:4px 0;"><strong>ID da Reserva:</strong> <span style="font-size:0.7rem; color:#cbd5e1;">${r.id}</span></p>
            </div>
        `;

        // Atribui as funções aos botões
        document.getElementById("btnAprovar").onclick = () => this.process(r.id, 'aprovado');
        document.getElementById("btnRecusar").onclick = () => this.process(r.id, 'recusado');
        
        modal.style.display = "flex";
    },

    async process(id, status) {
        const msg = document.getElementById("msgAdmin").value;
        try {
            // Chama o service que dispara a Cloud Function
            await DashboardService.updateReservaStatus(id, status, msg);
            document.getElementById("modalDetalhes").style.display = "none";
            document.getElementById("msgAdmin").value = "";
        } catch (e) {
            alert("Erro ao processar reserva: " + e.message);
        }
    }
};

// Torna global para o onclick do HTML funcionar
window.HangarDashboardView = HangarDashboardView;
export default HangarDashboardView;