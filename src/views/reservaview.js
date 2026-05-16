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
            const hashParts = window.location.hash.split("?");
            const params = new URLSearchParams(hashParts[1] || "");
            const hangarId = params.get("hangarId");

            const container = document.getElementById("reservaContainer");
            const user = AuthService.getUser();

            if (!user) {
                window.location.hash = "#/login";
                return;
            }

            const hangar = await HangarService.getHangarById(hangarId);
            if (!hangar) throw new Error("Hangar não encontrado.");

            document.getElementById("hangar-name-badge").innerHTML = `
                <span class="icao-badge-light">${hangar.nome}</span>
            `;

            const hojeIso = new Date().toISOString().split('T')[0];

            container.innerHTML = `
                <div class="content-section-light">
                    <div class="input-block">
                        <label class="field-label">PREFIXO DA AERONAVE *</label>
                        <input type="text" id="prefixo" class="input-field-light" placeholder="Ex: PT-ABC" style="text-transform: uppercase;">
                    </div>
                    
                    <div class="input-block">
                        <label class="field-label">MODELO DA AERONAVE *</label>
                        <input type="text" id="Modelo" class="input-field-light" placeholder="Ex: SR22">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="input-block">
                            <label class="field-label">DATA ENTRADA *</label>
                            <input type="date" id="dataEntrada" class="input-field-light" min="${hojeIso}">
                        </div>
                        <div class="input-block">
                            <label class="field-label">HORÁRIO CHEGADA *</label>
                            <input type="time" id="horaChegada" class="input-field-light">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="input-block">
                            <label class="field-label">DATA SAÍDA *</label>
                            <input type="date" id="dataSaida" class="input-field-light" min="${hojeIso}">
                        </div>
                        <div class="input-block">
                            <label class="field-label">HORÁRIO SAÍDA *</label>
                            <input type="time" id="horaSaida" class="input-field-light">
                        </div>
                    </div>

                    <div class="services-section">
                        <h3 class="section-label-light">SERVIÇOS ADICIONAIS *</h3>
                        <div id="servicosContainer"></div>
                        <button id="addServicoBtn" class="btn-add-service-dashed">
                            <span>+</span> Adicionar serviço
                        </button>
                    </div>

                    <div class="checkbox-block">
                        <label class="checkbox-container">
                            <input type="checkbox" id="possuiSeguro">
                            <span style="color: #0f172a; font-weight: 700;">Aeronave possui seguro RETA/Casco</span>
                        </label>
                    </div>

                    <div class="input-block">
                        <label class="field-label">OBSERVAÇÕES (OPCIONAL)</label>
                        <textarea id="observacoes" class="input-field-light" placeholder="Ex: Necessito de GPU na partida..."></textarea>
                    </div>

                    <div class="total-summary-card-premium">
                        <div class="total-info">
                            <span class="total-label-light">VALOR TOTAL ESTIMADO</span>
                            <h3 id="precoTotal" class="total-value-highlight">R$ 0,00</h3>
                        </div>
                    </div>

                    <div class="action-footer-light">
                        <button id="reservarBtn" class="btn-primary-emerald-bold">
                            CONFIRMAR RESERVA
                        </button>
                    </div>
                </div>
            `;

            const servicosContainer = document.getElementById("servicosContainer");

            const calcularTotal = () => {
                let total = 0;
                let sobConsulta = false;
                document.querySelectorAll(".service-selection-card").forEach((card) => {
                    const select = card.querySelector(".servicoSelect");
                    const qtdInput = card.querySelector(".qtdInput");
                    const option = select.selectedOptions[0];
                    if (!option || !option.value) return;
                    if (option.dataset.sobConsulta === "true") {
                        sobConsulta = true;
                    } else {
                        total += parseFloat(option.dataset.preco || 0) * parseInt(qtdInput.value || 1);
                    }
                });
                const displayTotal = document.getElementById("precoTotal");
                displayTotal.innerText = sobConsulta ? "Valor a combinar" : `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
            };

            const criarServico = () => {
                const div = document.createElement("div");
                div.className = "service-selection-card";
                div.innerHTML = `
                    <div class="card-header-row" style="margin-bottom: 12px;">
                        <select class="servicoSelect input-field-light">
                            <option value="" data-preco="0">Selecione um serviço...</option>
                            ${(hangar.servicos || []).map((s) => `
                                <option value="${s.nome}" data-preco="${s.preco_produto || 0}" data-sob-consulta="${s.sob_consulta}">
                                    ${s.nome} ${s.sob_consulta ? "(Valor a combinar)" : `(R$ ${Number(s.preco_produto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                                </option>
                            `).join("")}
                        </select>
                        <button class="remover btn-remove-icon">✕</button>
                    </div>
                    <div class="qtd-control-wrapper" style="display: none;">
                        <label class="field-label">QUANTIDADE</label>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="display: flex; align-items: center; background: #f1f5f9; border-radius: 12px; padding: 5px;">
                                <button class="btn-qty btn-minus" style="width: 36px; height: 36px; border: none; background: white; border-radius: 8px; font-weight: 900; color:#0f172a">-</button>
                                <input type="number" class="qtdInput" value="1" readonly style="width: 50px; text-align: center; border: none; background: transparent; font-weight: 700;">
                                <button class="btn-qty btn-plus" style="width: 36px; height: 36px; border: none; background: #10b981; border-radius: 8px; color: white; font-weight: 900;">+</button>
                            </div>
                            <span class="qty-warning" style="display: none; color: #ef4444; font-size: 0.7rem; font-weight: 700;">A quantidade mínima deverá ser 1 ou mais</span>
                        </div>
                    </div>
                `;
                
                const select = div.querySelector(".servicoSelect");
                const qtdWrapper = div.querySelector(".qtd-control-wrapper");
                const qtdInput = div.querySelector(".qtdInput");
                const warning = div.querySelector(".qty-warning");

                select.onchange = () => {
                    const opt = select.selectedOptions[0];
                    qtdWrapper.style.display = (opt && opt.value && opt.dataset.sobConsulta !== "true") ? "block" : "none";
                    if(qtdWrapper.style.display === "none") qtdInput.value = 1;
                    calcularTotal();
                };

                div.querySelector(".btn-plus").onclick = () => { qtdInput.value = parseInt(qtdInput.value) + 1; warning.style.display = "none"; calcularTotal(); };
                div.querySelector(".btn-minus").onclick = () => { 
                    if (parseInt(qtdInput.value) > 1) { qtdInput.value = parseInt(qtdInput.value) - 1; warning.style.display = "none"; } 
                    else { warning.style.display = "block"; }
                    calcularTotal();
                };
                div.querySelector(".remover").onclick = () => { div.remove(); calcularTotal(); };
                servicosContainer.appendChild(div);
            };

            // Começa sem serviço para forçar a seleção obrigatória
            document.getElementById("addServicoBtn").onclick = criarServico;

            document.getElementById("reservarBtn").onclick = async () => {
                const btn = document.getElementById("reservarBtn");
                try {
                    const form = {
                        prefixo: document.getElementById("prefixo").value.trim(),
                        modelo: document.getElementById("Modelo").value.trim(),
                        dataEntrada: document.getElementById("dataEntrada").value,
                        horaChegada: document.getElementById("horaChegada").value,
                        dataSaida: document.getElementById("dataSaida").value,
                        horaSaida: document.getElementById("horaSaida").value
                    };

                    // 1. Validação de campos obrigatórios
                    for (let key in form) {
                        if (!form[key]) throw new Error("Por favor, preencha todos os campos obrigatórios (*).");
                    }

                    // 2. Validação de serviços (Obrigatório selecionar ao menos um)
                    const servicosSelecionados = Array.from(document.querySelectorAll(".service-selection-card"))
                        .map(card => {
                            const select = card.querySelector(".servicoSelect");
                            const opt = select.selectedOptions[0];
                            return opt.value ? {
                                nome: opt.value,
                                preco_produto: parseFloat(opt.dataset.preco),
                                sob_consulta: opt.dataset.sobConsulta === "true",
                                quantidade: parseInt(card.querySelector(".qtdInput").value)
                            } : null;
                        }).filter(s => s !== null);

                    if (servicosSelecionados.length === 0) {
                        throw new Error("É necessário selecionar pelo menos um serviço para prosseguir.");
                    }

                    // 3. Validação de Datas e Horários
                    const agora = new Date();
                    const dataHoraEntrada = new Date(`${form.dataEntrada}T${form.horaChegada}`);
                    const dataHoraSaida = new Date(`${form.dataSaida}T${form.horaSaida}`);

                    // Regra: Entrada não inferior ao momento atual
                    if (dataHoraEntrada < agora) {
                        throw new Error("A data e o horário de entrada não podem ser inferiores ao horário atual.");
                    }

                    // Regra: Saída não inferior à entrada
                    if (dataHoraSaida < dataHoraEntrada) {
                        throw new Error("A data e o horário de saída não podem ser inferiores à entrada.");
                    }

                    // Regra: Se datas iguais, saída deve ser pelo menos 1 minuto superior
                    if (dataHoraSaida.getTime() === dataHoraEntrada.getTime()) {
                         throw new Error("O horário de saída deve ser pelo menos um minuto superior ao horário de entrada.");
                    }

                    btn.disabled = true;
                    btn.innerText = "PROCESSANDO...";

                    await ReservaService.createReserva({
                        ...form,
                        hangarId: hangar.id,
                        pilotoId: user.uid,
                        pilotoNome: user.displayName || "Piloto",
                        servicos: servicosSelecionados,
                        possuiSeguro: document.getElementById("possuiSeguro").checked,
                        observacoes: document.getElementById("observacoes").value,
                        valorTotal: document.getElementById("precoTotal").innerText,
                        status: "pendente"
                    });

                    alert("Reserva enviada com sucesso!");
                    window.location.hash = "#/";

                } catch (error) {
                    alert(error.message);
                    btn.disabled = false;
                    btn.innerText = "CONFIRMAR RESERVA";
                }
            };

        } catch (error) {
            console.error(error);
            document.getElementById("reservaContainer").innerHTML = `<div class="error-state-light">${error.message}</div>`;
        }
    }
};