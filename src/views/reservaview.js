import { HangarService } from "../services/hangarservice.js";
import { ReservaService } from "../services/reservaservice.js";
import { AuthService } from "../services/authservice.js";

export default {

    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-detail-page-light">
                <div id="reserva-card" class="hangar-view-container-light">
                    <div class="hangar-header-light">
                        <div class="header-nav">
                            <button class="btn-close-light" onclick="window.history.back()">✕</button>
                        </div>
                        <div class="header-main-info">
                            <h2>Nova Reserva</h2>
                            <div id="hangar-name-badge"></div>
                        </div>
                    </div>
                    <div id="reservaContainer" class="content-section-light">
                        <div class="loading-state">
                            Sincronizando com a torre de controle...
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        try {
            // RECUPERAÇÃO DO ID USANDO O SEU PADRÃO ORIGINAL (?)
            const hashParts = window.location.hash.split("?");
            const params = new URLSearchParams(hashParts[1] || "");
            const hangarId = params.get("hangarId");

            const container = document.getElementById("reservaContainer");
            const user = AuthService.getUser();

            if (!user) {
                window.location.hash = "#/login";
                return;
            }

            if (!hangarId) {
                container.innerHTML = `<div class="error-state-light">Hangar não informado.</div>`;
                return;
            }

            // BUSCA DADOS DO HANGAR
            const hangar = await HangarService.getHangarById(hangarId);

            if (!hangar) {
                container.innerHTML = `<div class="error-state-light">Hangar não encontrado.</div>`;
                return;
            }

            document.getElementById("hangar-name-badge").innerHTML = `
                <span class="icao-badge-light">${hangar.nome}</span>
            `;

            // RENDERIZAÇÃO DO FORMULÁRIO ORIGINAL
            container.innerHTML = `
                <div class="form-grid-premium">
                    <div class="input-block">
                        <label class="field-label">PREFIXO DA AERONAVE</label>
                        <input type="text" id="prefixo" class="input-field-light" placeholder="Ex: PT-ABC" />
                    </div>
                    <div class="input-block">
                        <label class="field-label">Modelo DA AERONAVE</label>
                        <input type="text" id="Modelo" class="input-field-light" placeholder="Ex: SR22" />
                    </div>
                    <div class="input-block">
                        <label class="field-label">DATA ENTRADA</label>
                        <input type="date" id="dataEntrada" class="input-field-light" />
                    </div>
                    <div class="input-block">
                        <label class="field-label">DATA SAÍDA</label>
                        <input type="date" id="dataSaida" class="input-field-light" />
                    </div>
                    <div class="input-block">
                        <label class="field-label">HORÁRIO CHEGADA</label>
                        <input type="time" id="horaChegada" class="input-field-light" />
                    </div>
                    <div class="input-block">
                        <label class="field-label">HORÁRIO SAÍDA</label>
                        <input type="time" id="horaSaida" class="input-field-light" />
                    </div>
                    <div class="checkbox-block">
                        <label class="checkbox-container">
                            <input type="checkbox" id="possuiSeguro" />
                            <span>A aeronave possui seguro</span>
                        </label>
                    </div>
                    <div class="input-block full-width">
                        <label class="field-label">OBSERVAÇÕES</label>
                        <textarea id="observacoes" class="textarea-field-light" placeholder="Adicione detalhes importantes..."></textarea>
                    </div>
                </div>

                <div class="services-section">
                    <h3 class="section-label-light">SERVIÇOS</h3>
                    <div id="servicosContainer"></div>
                    <button id="addServicoBtn" class="btn-add-service-dashed">
                        <span>+</span> Adicionar serviço
                    </button>
                </div>

                <div class="total-summary-card-premium">
                    <div class="total-info">
                        <span class="total-label-light">VALOR TOTAL ESTIMADO</span>
                        <h3 id="precoTotal" class="total-value-highlight">R$ 0,00</h3>
                    </div>
                </div>

                <div class="action-footer-light">
                    <button id="reservarBtn" class="btn-primary-emerald-bold">CONFIRMAR RESERVA</button>
                </div>
            `;

            const servicosContainer = document.getElementById("servicosContainer");

            // LÓGICA DE CÁLCULO ORIGINAL
            const calcularTotal = () => {
                let total = 0;
                document.querySelectorAll(".service-selection-card").forEach((card) => {
                    const select = card.querySelector(".servicoSelect");
                    const option = select.selectedOptions[0];
                    if (!option) return;
                    const preco = parseFloat(option.dataset.preco || 0);
                    if (option.dataset.tipoPreco === "sob_consulta") return;
                    total += preco;
                });

                document.getElementById("precoTotal").innerText = `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
            };

            const criarServico = () => {
                const div = document.createElement("div");
                div.className = "service-selection-card";
                div.innerHTML = `
                    <div class="card-header-row">
                        <select class="servicoSelect input-field-light">
                            ${hangar.servicos.map((s) => `
                                <option value="${s.nome}" data-preco="${s.preco_produto || 0}" data-tipo="${s.tipo || "fixo"}" data-tipo-preco="${s.tipo_preco || "fixo"}">
                                    ${s.nome} ${s.tipo_preco === "sob_consulta" ? "(Sob consulta)" : `(R$ ${Number(s.preco_produto || 0).toFixed(2)})`}
                                </option>
                            `).join("")}
                        </select>
                        <button class="remover btn-remove-icon">✕</button>
                    </div>
                `;
                div.querySelector(".remover").onclick = () => { div.remove(); calcularTotal(); };
                div.querySelector(".servicoSelect").onchange = calcularTotal;
                servicosContainer.appendChild(div);
                calcularTotal();
            };

            criarServico();
            document.getElementById("addServicoBtn").onclick = criarServico;

            // ENVIO DA RESERVA COM O CAMPO valorTotal
            document.getElementById("reservarBtn").onclick = async () => {
                const btn = document.getElementById("reservarBtn");
                try {
                    btn.disabled = true;
                    btn.innerText = "PROCESSANDO...";

                    const servicos = Array.from(document.querySelectorAll(".service-selection-card")).map((card) => {
                        const select = card.querySelector(".servicoSelect");
                        const option = select.selectedOptions[0];
                        return {
                            nome: select.value,
                            preco_produto: parseFloat(option.dataset.preco || 0),
                            tipo: option.dataset.tipo,
                            tipo_preco: option.dataset.tipoPreco
                        };
                    });

                    // ADIÇÃO: Capturamos o valor que está no elemento de total
                    const valorTotalSalvar = document.getElementById("precoTotal").innerText;

                    const payload = {
                        hangarId,
                        servicos,
                        prefixo: document.getElementById("prefixo").value,
                        dataEntrada: document.getElementById("dataEntrada").value,
                        dataSaida: document.getElementById("dataSaida").value,
                        horaChegada: document.getElementById("horaChegada").value,
                        horaSaida: document.getElementById("horaSaida").value,
                        possuiSeguro: document.getElementById("possuiSeguro").checked,
                        observacoes: document.getElementById("observacoes").value,
                        observacoes: document.getElementById("Modelo").value,
                        // CAMPO ADICIONADO PARA O BANCO DE DADOS
                        valorTotal: valorTotalSalvar 
                    };

                    const result = await ReservaService.createReserva(payload);
                    
                    alert(result.precisaAprovacao ? "Reserva enviada para aprovação do hangar." : "Reserva confirmada com sucesso!");
                    window.location.hash = "#/";

                } catch (error) {
                    console.error(error);
                    alert(error.message || "Erro ao criar reserva.");
                    btn.disabled = false;
                    btn.innerText = "CONFIRMAR RESERVA";
                }
            };

        } catch (error) {
            console.error(error);
            const container = document.getElementById("reservaContainer");
            if (container) container.innerHTML = `<div class="error-state-light">Erro ao carregar reserva.</div>`;
        }
    }
};