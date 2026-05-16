import { ReservaService } from "../services/reservaservice.js";
import { AuthService } from "../services/authservice.js";

let currentReservas = [];

const MyReserveView = {
    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-page-layout">
                <div class="hangar-container-fluid">
                    <div class="page-header-block">
                        <h2 style="color: #1e293b;">Minhas Reservas</h2>
                        <p style="color: #64748b;">Consulte o retorno e status do hangar</p>
                    </div>
                    <div id="minhasReservasConteudo">
                        <div class="loading-state" style="text-align:center; padding:40px;">
                            <p>Sincronizando dados...</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modalDetalhesUsuario" class="modal-overlay-reserva">
                <div class="modal-reserva-content">
                    <div id="modalBodyUsuario"></div>
                    <button id="btnFecharModal" class="btn-reserva-voltar">VOLTAR</button>
                </div>
            </div>
        `;
    },

    async after_render() {
        const container = document.getElementById("minhasReservasConteudo");
        
        try {
            const reservas = await ReservaService.getMinhasReservas();
            currentReservas = reservas;

            console.log("DEBUG - Reservas recebidas:", reservas);

            if (!reservas || reservas.length === 0) {
                container.innerHTML = `<p style="text-align:center; padding:40px; color:#94a3b8;">Nenhuma reserva encontrada.</p>`;
                return;
            }

            container.innerHTML = reservas.map((r, index) => {
                const statusStyles = {
                    aprovado: { border: '#10b981', bg: '#dcfce7', text: '#15803d' },
                    aprovada: { border: '#10b981', bg: '#dcfce7', text: '#15803d' },
                    recusado: { border: '#ef4444', bg: '#fee2e2', text: '#b91c1c' },
                    recusada: { border: '#ef4444', bg: '#fee2e2', text: '#b91c1c' },
                    pendente: { border: '#f59e0b', bg: '#fef3c7', text: '#a16207' }
                };
                const style = statusStyles[r.status] || statusStyles.pendente;
                const valorBruto = r.valorTotal ?? r.valor_total ?? r.total ?? '0,00'; 

                // Verifica se a reserva foi modificada pelo hangar e ainda não foi vista pelo piloto
                // Adiciona suporte a 'lida' ou 'lidaPeloPiloto' dependendo da sua estrutura
                const naoLida = r.status !== 'pendente' && (r.lida === false || r.lidaPeloPiloto === false);

                return `
                    <div class="reserva-card-item" 
                         onclick="window.myreservaview.openModalByIndex(${index})" 
                         style="border-left: 6px solid ${style.border}; position: relative; cursor: pointer;">
                        
                        ${naoLida ? `
                            <span class="ping-notificacao" style="position: absolute; top: 12px; right: 12px; display: flex; h: 10px; w: 10px; width: 10px; height: 10px;">
                                <span style="position: absolute; inline-size: 100%; block-size: 100%; height: 100%; width: 100%; background: #ef4444; border-radius: 50%; opacity: 0.75; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                                <span style="position: relative; display: inline-flex; border-radius: 50%; height: 10px; width: 10px; background: #ef4444;"></span>
                            </span>
                        ` : ''}
                        
                        <div class="reserva-card-header">
                            <span class="reserva-card-prefixo">${r.prefixo || r.matricula || 'N/A'}</span>
                            <span class="reserva-card-status" style="background: ${style.bg}; color: ${style.text}; text-transform: uppercase;">
                                ${r.status}
                            </span>
                        </div>
                        
                        <div class="reserva-card-grid">
                            <span><b>Entrada:</b> ${r.dataEntrada || '--/--'}</span>
                            <span><b>Saída:</b> ${r.dataSaida || '--/--'}</span>
                            <span><b>Seguro:</b> ${r.possuiSeguro ? 'Sim' : 'Não'}</span>
                            <span><b>Valor:</b> R$ ${valorBruto}</span>
                        </div>
                    </div>
                `;
            }).join("");

            // Adiciona a animação de pulso diretamente na página se ela não existir no seu CSS global
            if (!document.getElementById("style-ping-card")) {
                const styleSheet = document.createElement("style");
                styleSheet.id = "style-ping-card";
                styleSheet.innerText = `@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`;
                document.head.appendChild(styleSheet);
            }

            document.getElementById("btnFecharModal").onclick = () => {
                document.getElementById("modalDetalhesUsuario").style.display = "none";
            };

        } catch (error) {
            console.error("Erro na visualização:", error);
            container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar dados.</p>`;
        }
    },

    async openModalByIndex(index) {
        const r = currentReservas[index];
        if (!r) return;

        const body = document.getElementById("modalBodyUsuario");
        const modal = document.getElementById("modalDetalhesUsuario");

        const statusStyles = {
            aprovado: { bg: '#dcfce7', text: '#15803d' },
            aprovada: { bg: '#dcfce7', text: '#15803d' },
            recusado: { bg: '#fee2e2', text: '#b91c1c' },
            recusada: { bg: '#fee2e2', text: '#b91c1c' },
            pendente: { bg: '#fef3c7', text: '#a16207' }
        };
        const style = statusStyles[r.status] || statusStyles.pendente;
        const valorBruto = r.valorTotal ?? r.valor_total ?? r.total ?? '0,00';

        body.innerHTML = `
            <div style="text-align:center; margin-bottom:25px;">
                <h2 style="margin:0; color:#0f172a; font-size:2.2rem; font-weight:900;">${r.prefixo || r.matricula || 'S/P'}</h2>
                <span style="background:${style.bg}; color:${style.text}; padding:5px 15px; border-radius:20px; font-size:0.75rem; font-weight:800; text-transform:uppercase;">${r.status}</span>
            </div>

            <div class="reserva-info-grid-modal">
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Piloto</label>
                    <span style="font-size:1rem; color:#1e293b; font-weight:700;">${r.nomeUsuario || 'Não informado'}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#94a3b8; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Valor Total</label>
                    <span style="font-size:1.1rem; color:#059669; font-weight:800;">R$ ${valorBruto}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#333; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Entrada</label>
                    <span style="color:#333">${r.dataEntrada || '--/--'}</span>
                </div>
                <div>
                    <label style="display:block; font-size:0.65rem; color:#333; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Saída</label>
                    <span style="color:#333">${r.dataSaida || '--/--'}</span>
                </div>
            </div>

            <div style="padding:15px; background:white; border-radius:18px; border:1px solid #f1f5f9;">
                <p style="margin:0 0 10px 0; font-size:0.9rem;"><strong>Seguro:</strong> ${r.possuiSeguro ? 'Sim' : 'Não'}</p>
                <p style="margin:0; font-size:0.9rem; color:#475569;"><strong>Obs:</strong> ${r.observacoes || 'Nenhuma.'}</p>
            </div>

            ${r.msgAdmin || r.justificativa ? `
                <div class="reserva-feedback-blue" style="margin-top:15px; padding:15px; background:#eff6ff; border-radius:12px;">
                    <label style="display:block; font-size:0.65rem; color:#1d4ed8; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">Mensagem do Hangar</label>
                    <p style="margin:0; color:#1e3a8a; font-size:0.95rem; font-style:italic;">"${r.msgAdmin || r.justificativa}"</p>
                </div>
            ` : ''}
        `;

        modal.style.display = "flex";

        // AÇÃO DA NOTIFICAÇÃO: Se o card aberto não estava lido, limpa no Firestore
        if (r.status !== 'pendente' && (r.lida === false || r.lidaPeloPiloto === false)) {
            try {
                const user = AuthService.getUser();
                if (user && r.id) {
                    await ReservaService.marcarComoLidas(user.uid);
                    
                    // Atualiza o estado local para sumir a bolinha sem precisar dar refresh completo
                    r.lida = true;
                    r.lidaPeloPiloto = true;
                    
                    // Re-renderiza sutilmente a lista para apagar a bolinha vermelha do card aberto
                    this.after_render();
                }
            } catch (err) {
                console.error("Erro ao limpar notificação ao abrir modal:", err);
            }
        }
    }
};

window.myreservaview = MyReserveView;
export default MyReserveView;