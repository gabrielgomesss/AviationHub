import { HangarService } from "../services/hangarservice.js";
import { AuthService } from "../services/authservice.js";

export default {
    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-page-layout">
                <div class="page-overlay" onclick="window.history.back()"></div>
                <div class="hangar-container-fluid">
                    <div class="bottom-sheet-handle"></div>
                    <div class="page-header-block">
                        <h2>Novo Hangar</h2>
                        <p class="subtitle-light">Configure sua infraestrutura</p>
                    </div>
                    <div style="margin-top: 25px;">
                        <div class="input-block">
                            <label class="field-label">Nome do Hangar</label>
                            <input type="text" id="nome" class="input-field-light" placeholder="Ex: Hangar Congonhas"/>
                        </div>
                        <div class="input-block" style="margin-top: 15px;">
                            <label class="field-label">Código ICAO</label>
                            <input type="text" id="icao" class="input-field-light" placeholder="SBSP" style="text-transform: uppercase;"/>
                        </div>
                        
                        <div style="margin-top: 30px;">
                            <h3 class="field-label">Tabela de Serviços</h3>
                            <div id="servicosContainer" class="services-list-wrapper"></div>
                            <button id="addServicoBtn" class="btn-add-service-dashed" style="width: 100%; margin-top: 10px;">
                                + Adicionar novo serviço
                            </button>
                        </div>

                        <div style="margin-top: 40px; margin-bottom: 20px;">
                            <button id="criarHangarBtn" class="btn-primary-emerald-bold" style="width: 100%;">
                                CRIAR HANGAR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        const container = document.getElementById("servicosContainer");

        const criarServico = () => {
            const div = document.createElement("div");
            div.className = "service-selection-card";
            div.innerHTML = `
                <button class="remover">✕</button>
                <div class="service-name-row">
                    <label class="input-sublabel">Descrição do Serviço</label>
                    <input type="text" class="nomeServico input-field-light" placeholder="Ex: Pernoite" style="margin-top: 0;">
                </div>
                <div class="service-details-grid">
                    <div class="input-block">
                        <label class="input-sublabel">Preço (R$)</label>
                        <input type="number" class="precoServico input-field-light" placeholder="0.00" style="margin-top: 0;">
                    </div>
                    <div class="input-block">
                        <label class="input-sublabel">Cobrança</label>
                        <input type="text" class="tipoServico input-field-light" placeholder="Ex: Diária" style="margin-top: 0;">
                    </div>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" class="sobConsulta">
                            <span>À COMBINAR</span>
                        </label>
                    </div>
                </div>
            `;

            const check = div.querySelector(".sobConsulta");
            const precoInput = div.querySelector(".precoServico");
            const tipoInput = div.querySelector(".tipoServico");

            check.onchange = () => {
                precoInput.disabled = check.checked;
                tipoInput.disabled = check.checked;
                if (check.checked) {
                    precoInput.value = 0;
                    tipoInput.value = "valor a combinar";
                    precoInput.classList.add("input-disabled");
                    tipoInput.classList.add("input-disabled");
                } else {
                    precoInput.classList.remove("input-disabled");
                    tipoInput.classList.remove("input-disabled");
                }
            };

            div.querySelector(".remover").onclick = () => div.remove();
            container.appendChild(div);
        };

        criarServico();
        document.getElementById("addServicoBtn").onclick = criarServico;

        document.getElementById("criarHangarBtn").onclick = async () => {
            const btn = document.getElementById("criarHangarBtn");
            try {
                const user = AuthService.getUser();
                if (!user) throw new Error("Usuário não autenticado");

                const nome = document.getElementById("nome").value;
                const icao = document.getElementById("icao").value.toUpperCase();

                if (!nome || !icao) return alert("Preencha nome e ICAO.");

                const servicos = Array.from(document.querySelectorAll(".service-selection-card")).map(div => ({
                    nome: div.querySelector(".nomeServico").value,
                    preco_produto: parseFloat(div.querySelector(".precoServico").value || 0),
                    tipo: div.querySelector(".tipoServico").value,
                    sob_consulta: div.querySelector(".sobConsulta").checked
                }));

                if (servicos.length === 0) return alert("Adicione ao menos um serviço.");

                btn.disabled = true;
                btn.innerText = "CRIANDO...";

                await HangarService.createHangar({ nome, icao, servicos });
                alert("Hangar criado com sucesso!");
                window.location.hash = "#/hangares";
            } catch (err) {
                alert("Erro: " + err.message);
                btn.disabled = false;
                btn.innerText = "CRIAR HANGAR";
            }
        };
    }
};