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
                        <div class="loading-state">Sincronizando com a torre de controle...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        try {
            const params = new URLSearchParams(window.location.search);
            const hangarId = params.get("hangarId");
            const container = document.getElementById("reservaContainer");

            if (!hangarId) {
                container.innerHTML = "<div class='error-state-light'>Hangar não informado na URL.</div>";
                return;
            }

            const hangar = await HangarService.getHangarById(hangarId);

            if (!hangar) {
                container.innerHTML = "<div class='error-state-light'>Hangar não encontrado.</div>";
                return;
            }

            document.getElementById("hangar-name-badge").innerHTML = `
                <span class="icao-badge-light">${hangar.nome}</span>
            `;

            container.innerHTML = `
                <div class="services-section">
                    <h3 class="section-label-light">SERVIÇOS SELECIONADOS</h3>
                    <div id="servicosContainer"></div>
                    
                    <button id="addServicoBtn" class="btn-add-service-dashed">
                        <span>+</span> Adicionar outro serviço
                    </button>
                </div>

                <!-- Card de Total Premium -->
                <div class="total-summary-card-premium">
                    <div class="total-info">
                        <span class="total-label-light">VALOR TOTAL </span>
                        <h3 id="precoTotal" class="total-value-highlight">R$ 0,00</h3>
                    </div>
                    <div class="total-icon">
                        <span class="material-icons"></span>
                    </div>
                </div>

                <div class="action-footer-light">
                    <button id="reservarBtn" class="btn-primary-emerald-bold">
                        CONFIRMAR RESERVA
                    </button>
                </div>
            `;

            const servicosContainer = document.getElementById("servicosContainer");

            const calcularTotal = () => {
                const blocos = document.querySelectorAll(".service-selection-card");
                let total = 0;

                blocos.forEach(bloco => {
                    const select = bloco.querySelector(".servicoSelect");
                    const option = select.selectedOptions[0];
                    if (!option) return;

                    const preco = parseFloat(option.dataset.preco || 0);
                    const tipo = option.dataset.tipo;
                    const inicio = bloco.querySelector(".inicioServico").value;
                    const fim = bloco.querySelector(".fimServico").value;

                    let multiplicador = 1;
                    if (inicio && fim && tipo === "diaria") {
                        const ini = new Date(inicio);
                        const end = new Date(fim);
                        if (end > ini) {
                            multiplicador = Math.ceil((end - ini) / (1000 * 60 * 60 * 24));
                        }
                    }
                    total += preco * multiplicador;
                });

                document.getElementById("precoTotal").innerText = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            };

            const criarServico = () => {
                const div = document.createElement("div");
                div.className = "service-selection-card";

                div.innerHTML = `
                    <div class="card-header-row">
                        <select class="servicoSelect input-field-light">
                            ${hangar.servicos.map(s => `
                                <option value="${s.nome}" data-preco="${s.preco_produto}" data-tipo="${s.tipo || 'fixo'}">
                                    ${s.nome} (R$ ${s.preco_produto})
                                </option>
                            `).join("")}
                        </select>
                        <button class="remover btn-remove-icon">✕</button>
                    </div>

                    <div class="date-inputs-vertical-group">
                        <div class="input-block">
                            <label class="field-label">INÍCIO</label>
                            <input type="datetime-local" class="inicioServico input-field-light"/>
                        </div>
                        <div class="input-block">
                            <label class="field-label">FIM (PARA DIÁRIAS)</label>
                            <input type="datetime-local" class="fimServico input-field-light"/>
                        </div>
                    </div>
                `;

                servicosContainer.appendChild(div);

                div.querySelector(".remover").onclick = () => {
                    div.remove();
                    calcularTotal();
                };

                div.querySelectorAll("select, input").forEach(i =>
                    i.addEventListener("change", calcularTotal)
                );
                
                calcularTotal();
            };

            criarServico();

            document.getElementById("addServicoBtn").onclick = criarServico;

            document.getElementById("reservarBtn").onclick = async () => {
                try {
                    const user = AuthService.getUser();
                    if (!user) throw new Error("Usuário não autenticado");

                    const prefixo = prompt("Prefixo da aeronave:");
                    if (!prefixo) return;

                    const blocos = document.querySelectorAll(".service-selection-card");
                    let valorTotal = 0;

                    const servicos = Array.from(blocos).map(bloco => {
                        const select = bloco.querySelector(".servicoSelect");
                        const option = select.selectedOptions[0];
                        const preco = parseFloat(option.dataset.preco);
                        const tipo = option.dataset.tipo;
                        const inicio = bloco.querySelector(".inicioServico").value;
                        const fim = bloco.querySelector(".fimServico").value;

                        let multiplicador = 1;
                        if (inicio && fim && tipo === "diaria") {
                            const ini = new Date(inicio);
                            const end = new Date(fim);
                            if (end > ini) multiplicador = Math.ceil((end - ini) / (1000 * 60 * 60 * 24));
                        }

                        const subtotal = preco * multiplicador;
                        valorTotal += subtotal;

                        return { nome: select.value, preco, tipo, inicio, fim, subtotal };
                    });

                    await ReservaService.criarReserva({
                        hangarId,
                        userId: user.uid,
                        userEmail: user.email,
                        userName: user.displayName || "",
                        prefixoAviao: prefixo,
                        servicos,
                        valorTotal,
                        status: "aguardando_pagamento"
                    });

                    alert("Reserva criada com sucesso!");
                    window.navigate("/");

                } catch (err) {
                    alert(err.message);
                }
            };

        } catch (err) {
            console.error("Erro view reserva:", err);
            document.getElementById("reservaContainer").innerHTML = "Erro ao carregar reserva.";
        }
    }
};