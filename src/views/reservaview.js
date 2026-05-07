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
                            <button 
                                class="btn-close-light"
                                onclick="window.history.back()"
                            >
                                ✕
                            </button>
                        </div>

                        <div class="header-main-info">
                            <h2>Nova Reserva</h2>
                            <div id="hangar-name-badge"></div>
                        </div>

                    </div>

                    <div 
                        id="reservaContainer"
                        class="content-section-light"
                    >
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

            // ======================================================
            // HASH PARAMS
            // ======================================================

            const hashParts = window.location.hash.split("?");

            const params = new URLSearchParams(
                hashParts[1] || ""
            );

            // 🔥 CORREÇÃO PRINCIPAL
            // agora busca hangarId
            const hangarId = params.get("hangarId");

            const container =
                document.getElementById("reservaContainer");

            const user = AuthService.getUser();

            if (!user) {

                window.location.hash = "#/login";

                return;
            }

            if (!hangarId) {

                container.innerHTML = `
                    <div class="error-state-light">
                        Hangar não informado.
                    </div>
                `;

                return;
            }

            // ======================================================
            // LOADING
            // ======================================================

            container.innerHTML = `
                <div class="loading-wrapper">

                    <div class="spinner-loader"></div>

                    <p class="loading-text">
                        Buscando serviços disponíveis...
                    </p>

                </div>
            `;

            // ======================================================
            // HANGAR
            // ======================================================

            const hangar =
                await HangarService.getHangarById(
                    hangarId
                );

            if (!hangar) {

                container.innerHTML = `
                    <div class="error-state-light">
                        Hangar não encontrado.
                    </div>
                `;

                return;
            }

            // ======================================================
            // HEADER
            // ======================================================

            document.getElementById(
                "hangar-name-badge"
            ).innerHTML = `
                <span class="icao-badge-light">
                    ${hangar.nome}
                </span>
            `;

            // ======================================================
            // EMPTY SERVICES
            // ======================================================

            if (
                !hangar.servicos ||
                hangar.servicos.length === 0
            ) {

                container.innerHTML = `
                    <div class="empty-state">

                        <h3>
                            Nenhum serviço disponível
                        </h3>

                        <p>
                            Este hangar ainda não cadastrou serviços.
                        </p>

                    </div>
                `;

                return;
            }

            // ======================================================
            // FORM
            // ======================================================

            container.innerHTML = `

                <div class="form-grid-premium">

                    <div class="input-block">
                        <label class="field-label">
                            PREFIXO DA AERONAVE
                        </label>

                        <input
                            type="text"
                            id="prefixo"
                            class="input-field-light"
                            placeholder="Ex: PT-ABC"
                        />
                    </div>

                    <div class="input-block">
                        <label class="field-label">
                            DATA ENTRADA
                        </label>

                        <input
                            type="date"
                            id="dataEntrada"
                            class="input-field-light"
                        />
                    </div>

                    <div class="input-block">
                        <label class="field-label">
                            DATA SAÍDA
                        </label>

                        <input
                            type="date"
                            id="dataSaida"
                            class="input-field-light"
                        />
                    </div>

                    <div class="input-block">
                        <label class="field-label">
                            HORÁRIO CHEGADA
                        </label>

                        <input
                            type="time"
                            id="horaChegada"
                            class="input-field-light"
                        />
                    </div>

                    <div class="input-block">
                        <label class="field-label">
                            HORÁRIO SAÍDA
                        </label>

                        <input
                            type="time"
                            id="horaSaida"
                            class="input-field-light"
                        />
                    </div>

                    <div class="checkbox-block">

                        <label class="checkbox-container">

                            <input
                                type="checkbox"
                                id="possuiSeguro"
                            />

                            <span>
                                A aeronave possui seguro
                            </span>

                        </label>

                    </div>

                    <div class="input-block full-width">

                        <label class="field-label">
                            OBSERVAÇÕES
                        </label>

                        <textarea
                            id="observacoes"
                            class="textarea-field-light"
                            placeholder="Adicione detalhes importantes..."
                        ></textarea>

                    </div>

                </div>

                <div class="services-section">

                    <h3 class="section-label-light">
                        SERVIÇOS
                    </h3>

                    <div id="servicosContainer"></div>

                    <button
                        id="addServicoBtn"
                        class="btn-add-service-dashed"
                    >
                        <span>+</span>
                        Adicionar serviço
                    </button>

                </div>

                <div class="total-summary-card-premium">

                    <div class="total-info">

                        <span class="total-label-light">
                            VALOR TOTAL ESTIMADO
                        </span>

                        <h3
                            id="precoTotal"
                            class="total-value-highlight"
                        >
                            R$ 0,00
                        </h3>

                    </div>

                </div>

                <div class="action-footer-light">

                    <button
                        id="reservarBtn"
                        class="btn-primary-emerald-bold"
                    >
                        CONFIRMAR RESERVA
                    </button>

                </div>
            `;

            // ======================================================
            // SERVICES
            // ======================================================

            const servicosContainer =
                document.getElementById(
                    "servicosContainer"
                );

            const calcularTotal = () => {

                let total = 0;

                document
                    .querySelectorAll(
                        ".service-selection-card"
                    )
                    .forEach((card) => {

                        const select =
                            card.querySelector(
                                ".servicoSelect"
                            );

                        const option =
                            select.selectedOptions[0];

                        if (!option) return;

                        const preco = parseFloat(
                            option.dataset.preco || 0
                        );

                        const tipoPreco =
                            option.dataset.tipoPreco;

                        if (
                            tipoPreco === "sob_consulta"
                        ) {
                            return;
                        }

                        total += preco;
                    });

                document.getElementById(
                    "precoTotal"
                ).innerText = `
                    R$ ${total.toLocaleString(
                        "pt-BR",
                        {
                            minimumFractionDigits: 2
                        }
                    )}
                `;
            };

            const criarServico = () => {

                const div =
                    document.createElement("div");

                div.className =
                    "service-selection-card";

                div.innerHTML = `

                    <div class="card-header-row">

                        <select
                            class="servicoSelect input-field-light"
                        >

                            ${hangar.servicos.map((s) => `

                                <option
                                    value="${s.nome}"
                                    data-preco="${s.preco_produto || 0}"
                                    data-tipo="${s.tipo || "fixo"}"
                                    data-tipo-preco="${s.tipo_preco || "fixo"}"
                                >

                                    ${s.nome}
                                    ${
                                        s.tipo_preco === "sob_consulta"
                                        ? "(Sob consulta)"
                                        : `(R$ ${Number(
                                            s.preco_produto || 0
                                        ).toFixed(2)})`
                                    }

                                </option>

                            `).join("")}

                        </select>

                        <button
                            class="remover btn-remove-icon"
                        >
                            ✕
                        </button>

                    </div>
                `;

                div.querySelector(
                    ".remover"
                ).onclick = () => {

                    div.remove();

                    calcularTotal();
                };

                div.querySelector(
                    ".servicoSelect"
                ).onchange = calcularTotal;

                servicosContainer.appendChild(div);

                calcularTotal();
            };

            criarServico();

            document.getElementById(
                "addServicoBtn"
            ).onclick = criarServico;

            // ======================================================
            // RESERVA
            // ======================================================

            document.getElementById(
                "reservarBtn"
            ).onclick = async () => {

                const btn =
                    document.getElementById(
                        "reservarBtn"
                    );

                try {

                    btn.disabled = true;

                    btn.innerText =
                        "PROCESSANDO...";

                    const servicos =
                        Array.from(
                            document.querySelectorAll(
                                ".service-selection-card"
                            )
                        ).map((card) => {

                            const select =
                                card.querySelector(
                                    ".servicoSelect"
                                );

                            const option =
                                select.selectedOptions[0];

                            return {
                                nome: select.value,

                                preco_produto:
                                    parseFloat(
                                        option.dataset.preco || 0
                                    ),

                                tipo:
                                    option.dataset.tipo,

                                tipo_preco:
                                    option.dataset.tipoPreco
                            };
                        });

                    const payload = {

                        hangarId,

                        servicos,

                        prefixo:
                            document.getElementById(
                                "prefixo"
                            ).value,

                        dataEntrada:
                            document.getElementById(
                                "dataEntrada"
                            ).value,

                        dataSaida:
                            document.getElementById(
                                "dataSaida"
                            ).value,

                        horaChegada:
                            document.getElementById(
                                "horaChegada"
                            ).value,

                        horaSaida:
                            document.getElementById(
                                "horaSaida"
                            ).value,

                        possuiSeguro:
                            document.getElementById(
                                "possuiSeguro"
                            ).checked,

                        observacoes:
                            document.getElementById(
                                "observacoes"
                            ).value
                    };

                    const result =
                        await ReservaService.createReserva(
                            payload
                        );

                    if (
                        result.precisaAprovacao
                    ) {

                        alert(`
                            Reserva enviada para aprovação do hangar.
                        `);

                    } else {

                        alert(`
                            Reserva confirmada com sucesso!
                        `);
                    }

                    window.location.hash = "#/";

                } catch (error) {

                    console.error(error);

                    alert(
                        error.message ||
                        "Erro ao criar reserva."
                    );

                    btn.disabled = false;

                    btn.innerText =
                        "CONFIRMAR RESERVA";
                }
            };

        } catch (error) {

            console.error(error);

            const container =
                document.getElementById(
                    "reservaContainer"
                );

            if (container) {

                container.innerHTML = `
                    <div class="error-state-light">
                        Erro ao carregar reserva.
                    </div>
                `;
            }
        }
    }
};