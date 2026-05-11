import { HangarService } from '../services/hangarservice.js';
import { AuthService } from '../services/authservice.js';
import { DashboardService } from '../services/dashboardservice.js';

let unsubscribe = null;
let currentReservas = []; 

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
                    <div id="dashboardContent" class="dashboard-list">
                        <div class="loading-state">Sincronizando com a rede...</div>
                    </div>
                </div>

                <div id="modalDetalhes" class="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.85); backdrop-filter: blur(10px); z-index: 1; align-items: flex-end; justify-content:center;">
                    <div class="modal-content" style=" padding: 0; background:white; border-top-left-radius:32px; border-top-right-radius:32px; width:100%; max-width:550px; height: 95vh; display: flex; flex-direction: column; overflow: scroll; box-shadow: 0 -20px 40px rgba(0,0,0,0.2); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                        
                        <div style="padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; min-height: 70px;">
                            <button onclick="document.getElementById('modalDetalhes').style.display='none'" style="background: #f1f5f9; border: none; width: 45px; height: 45px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e293b;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <h3 style="margin: 0 0 0 15px; font-size: 1.25rem; color: #1e293b; font-weight: 900; letter-spacing: -0.5px;">Reserva Detalhada</h3>
                        </div>

                        <div id="modalBody" style="padding: 25px; auto; flex: 1; -webkit-overflow-scrolling: touch;"></div>

                        <div class="modal-actions" style="background: #ffffff; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; flex-shrink: 0;">
                             <button id="btnRecusar" style="padding:18px; border-radius:22px; border:2px solid #ef4444; background:white; color:#ef4444; font-weight:800; cursor:pointer; font-size: 0.95rem; transition: all 0.2s;">RECUSAR</button>
                             <button id="btnAprovar" style="padding:18px; border-radius:22px; border:none; background:#10b981; color:white; font-weight:800; cursor:pointer; font-size: 0.95rem; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); transition: all 0.2s;">APROVAR</button>
                        </div>
                    </div>
<<<<<<< HEAD
                    <button onclick="document.getElementById('modalDetalhes').style.display='none'" style="width:100%; margin-top:15px; background:none; border:none; color:#94a3b8; cursor:pointer; font-weight:500; font-size:0.9rem;">Voltar</button>
                    
=======
>>>>>>> adição de módulos, ajustes de layout e inclusão de RDN em reservas - Stable
                </div>
            </div>

            <style>
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                #modalDetalhes textarea:focus {
                    border-color: #10b981 !important;
                }
                .reserva-item:active {
                    transform: scale(0.98);
                }
            </style>
        `;
    },

    async after_render() {
        const hangarSelect = document.getElementById('hangarSelect');
        const periodFilter = document.getElementById('periodFilter');
        const content = document.getElementById('dashboardContent');

        try {
            const hangares = await HangarService.getMyHangares();
            if (hangares.length === 0) {
                content.innerHTML = '<p style="text-align:center; padding:40px;">Você ainda não possui hangares vinculados.</p>';
                return;
            }

            hangarSelect.innerHTML = hangares.map(h => `<option value="${h.id}">${h.nome}</option>`).join('');

            const carregarDashboard = (hangarId) => {
                if (unsubscribe) unsubscribe();
                unsubscribe = DashboardService.listenDashboardData(hangarId, periodFilter.value, (data) => {
                    const { metrics, reservas } = data;
                    currentReservas = reservas;
                    this.updateStats(metrics);
                    this.renderReservas(reservas);
                });
            };

            hangarSelect.onchange = (e) => carregarDashboard(e.target.value);
            periodFilter.onchange = () => carregarDashboard(hangarSelect.value);
            carregarDashboard(hangares[0].id);

        } catch (error) {
            console.error(error);
        }
    },

    updateStats(metrics) {
        const statsBox = document.getElementById('statsBox');
        const formatar = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        statsBox.innerHTML = `
            <div class="stat-card" style="background:#f0fdf4; padding:18px; border-radius:24px; border:1px solid #dcfce7;">
                <span style="font-size:0.6rem; color:#166534; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Receita</span>
                <h4 style="margin:5px 0 0 0; font-size:1.15rem; color:#166534; font-weight:900;">${formatar(metrics.totalValor)}</h4>
            </div>
            <div class="stat-card" style="background:#fff7ed; padding:18px; border-radius:24px; border:1px solid #ffedd5;">
                <span style="font-size:0.6rem; color:#9a3412; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Pendente</span>
                <h4 style="margin:5px 0 0 0; font-size:1.15rem; color:#9a3412; font-weight:900;">${formatar(metrics.valorPendente)}</h4>
            </div>
        `;
    },

    renderReservas(reservas) {
        const content = document.getElementById('dashboardContent');
        if (reservas.length === 0) {
            content.innerHTML = '<p style="text-align:center; padding:50px; color:#94a3b8; font-weight:600;">Sem movimentação no período.</p>';
            return;
        }

        content.innerHTML = reservas.map(r => {
            const statusColor = r.status === 'aprovado' ? '#10b981' : r.status === 'recusado' ? '#ef4444' : '#f59e0b';
            const valorParaMostrar = (r.valorExibicao && r.valorExibicao.toLowerCase().includes("combinar") || parseFloat(r.valorExibicao) === 0)
                ? '<span style="color:#10b981; font-weight:800;">A combinar</span>'
                : `<span style="font-weight:800; color:#FFF;">R$ ${r.valorExibicao || '0,00'}</span>`;

            return `
                <div class="reserva-item" onclick="window.showReservaDetails('${r.id}')" style="background:#0f172a; padding:20px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; transition: 0.2s;">
                    <div style="flex: 1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${statusColor};"></div>
                            <span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">${r.status}</span>
                        </div>
                        <div style="font-size: 1rem; color:white; margin-top:2px; font-weight:800;">${r.prefixo || 'N/I'} • ${r.dataEntrada}</div>
                        <span style="color:#999; font-size:0.8rem; font-weight:700;">${r.pilotoNome || 'Piloto'}</span>
                    </div>
                    <div style="text-align:right;">${valorParaMostrar}</div>
                </div>
            `;
        }).join('');

        window.showReservaDetails = (id) => this.showModal(id);
    },

    showModal(id) {
        const r = currentReservas.find(item => item.id === id);
        if (!r) return;

        const modal = document.getElementById("modalDetalhes");
<<<<<<< HEAD
        
        // Mapeamento Flexível: Tenta encontrar o dado independente do nome do campo no Firebase
        const piloto = r.nomeUsuario || r.nomeUsuario || r.nome || 'Não informado';
        const aeronave = r.prefixo || r.prefixoAviao || 'S/P';
        const dIn = r.dataEntrada || r.dataEntrada || '--/--/--';
        const dOut = r.dataSaida || r.dataSaida || '--/--/--';
        const valor = Number(r.valorFinal || r.valorTotal || 0);
        const modelo = r.modelo || r.modelo || 'Não informado';
        const seguro = r.possuiSeguro ? "Sim" : "Não";
        document.getElementById("modalBody").innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
            <button onclick="document.getElementById('modalDetalhes').style.display='none'" style="width:100%; margin-top:15px; background:none; border:none; color:#94a3b8; cursor:pointer; font-weight:500; font-size:0.9rem;">Voltar</button>
                <h2 style="margin:0; color:#0f172a; font-size:1.8rem;">${aeronave}</h2>
                <span style="background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:800; text-transform:uppercase;">${r.status}</span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; background:#f8fafc; padding:18px; border-radius:18px; margin-bottom:15px;">
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Solicitante</label>
                    <span style="font-size:0.95rem; color:#1e293b; font-weight:600;">${piloto}</span>
=======
        const body = document.getElementById("modalBody");
        const valorModal = (r.valorExibicao && r.valorExibicao.toLowerCase().includes("combinar") || parseFloat(r.valorExibicao) === 0)
            ? 'Valor a combinar' : `R$ ${r.valorExibicao || '0,00'}`;

        body.innerHTML = `
            <div style="margin-bottom:30px;">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                    <p style="font-size:1.5rem; color:#64748b; margin:6px 0 0 0; font-weight:600;"><strong style="color:#10b981;">${r.prefixo || 'N/A'}</strong></p>
                        <h3 style="margin:0; color:#1e293b; font-size: 1rem; font-weight: 900; letter-spacing: -0.5px;">${r.pilotoNome || 'Piloto'}</h3>
                    </div>
>>>>>>> adição de módulos, ajustes de layout e inclusão de RDN em reservas - Stable
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:30px;">
                <div style="background:#f8fafc; padding:18px; border-radius:24px; border:1px solid #f1f5f9;">
                    <label style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase; display:block; margin-bottom:6px;">Chegada</label>
                    <span style="font-size:1rem; color:#1e293b; font-weight:800;">${r.dataEntrada}</span>
                    <span style="font-size:1rem; color:#1e293b; font-weight:800;">${r.horaChegada}</span>
                </div>
                <div style="background:#f8fafc; padding:18px; border-radius:24px; border:1px solid #f1f5f9;">
                    <label style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase; display:block; margin-bottom:6px;">Partida</label>
                    <span style="font-size:1rem; color:#1e293b; font-weight:800;">${r.dataSaida}</span>
                    <span style="font-size:1rem; color:#1e293b; font-weight:800;">${r.horaSaida}</span>
                </div>
            </div>

            <div style="margin-bottom:30px; background: #0f172a; padding: 25px; border-radius: 28px; border-left: 6px solid #10b981; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);">
                 <label style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase; letter-spacing:1px;">Orçamento Estimado</label>
                 <p style="margin:8px 0 0 0; font-size:2rem; color:#ffffff; font-weight:900;">${valorModal}</p>
            </div>

            <div style="margin-bottom:30px;">
                <label style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase; display:block; margin-bottom:12px;">Pedido do Piloto</label>
                <div style="padding:22px; background:#f1f5f9; border-radius:24px; font-size:0.95rem; color:#334155; line-height:1.6; border-left: 4px solid #e2e8f0;">
                    "${r.observacoes || 'Nenhuma instrução adicional foi enviada.'}"
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Aeronave assegurada?</label>
                    <span style="font-size:0.85rem; color:#334155;">${seguro}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Modelo da aeronave</label>
                    <span style="font-size:0.85rem; color:#334155;">${r.modelo || r.modelo || 'Não inf.'}</span>
                </div>
            </div>

<<<<<<< HEAD
            <div style="padding:0 5px; font-size:0.85rem; color:#64748b; border-left: 2px solid #e2e8f0; margin-left: 5px; padding-left: 12px;">
                
                <p style="margin:4px 0;"><strong>ID da Reserva:</strong> <span style="font-size:0.7rem; color:#cbd5e1;">${r.id}</span></p>
=======
            <div style="margin-bottom:10px;">
                <label style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase; display:block; margin-bottom:12px;">Sua Resposta (Opcional)</label>
                <textarea id="msgAdmin" placeholder="Ex: Vaga confirmada. Procure o fiscal de pátio na chegada..." style="width:100%; height:140px; border-radius:24px; padding:20px; border:2px solid #f1f5f9; font-family: inherit; font-size: 1rem; outline: none; background: #fff;"></textarea>
>>>>>>> adição de módulos, ajustes de layout e inclusão de RDN em reservas - Stable
            </div>
        `;

        document.getElementById("btnAprovar").onclick = () => this.process(r.id, 'aprovado');
        document.getElementById("btnRecusar").onclick = () => this.process(r.id, 'recusado');
        
        modal.style.display = "flex";
    },

    async process(id, status) {
        const msg = document.getElementById("msgAdmin").value;
        const btnA = document.getElementById("btnAprovar");
        const btnR = document.getElementById("btnRecusar");

        try {
            btnA.disabled = true; btnR.disabled = true;
            btnA.innerText = "SINCRO...";
            await DashboardService.updateReservaStatus(id, status, msg);
            document.getElementById("modalDetalhes").style.display = "none";
        } catch (error) {
            console.error(error);
            btnA.disabled = false; btnR.disabled = false;
            btnA.innerText = "APROVAR";
        }
    }
};

export default HangarDashboardView;