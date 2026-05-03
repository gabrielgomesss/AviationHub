import { HangarService } from "../services/hangarservice.js";
import { AuthService } from "../services/authservice.js";

export default {

    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-detail-page-light">
                <!-- Camada de Background dedicada para garantir o desfoque -->
                <div class="bg-overlay-blur"></div>
                
                <div class="hangar-view-container-light">
                    <div class="hangar-header-light">
                        <div class="header-nav">
                            <button class="btn-close-light" onclick="window.history.back()">✕</button>
                        </div>
                        <div class="header-main-info">
                            <h2>Novo Hangar</h2>
                            <p class="subtitle-light">Configure sua unidade e serviços</p>
                        </div>
                    </div>
                    
                    <div class="content-section-light">
                        <div class="form-section">
                            <h3 class="section-label-light">IDENTIFICAÇÃO</h3>
                            <div class="input-block">
                                <label class="field-label">NOME DO HANGAR</label>
                                <input type="text" id="nome" class="input-field-light" placeholder="Ex: Hangar Alpha"/>
                            </div>
                            <div class="input-block" style="margin-top: 15px;">
                                <label class="field-label">ICAO (LOCALIDADE)</label>
                                <input type="text" id="icao" class="input-field-light" placeholder="Ex: SBMT"/>
                            </div>
                        </div>

                        <div class="form-section" style="margin-top: 30px;">
                            <h3 class="section-label-light">TABELA DE SERVIÇOS</h3>
                            <div id="servicosContainer"></div>
                            
                            <button id="addServicoBtn" class="btn-add-service-dashed">
                                <span>+</span> Adicionar serviço
                            </button>
                        </div>

                        <div class="action-footer-light">
                            <button id="criarHangarBtn" class="btn-primary-emerald-bold">
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
                <div class="card-header-row">
                    <input type="text" class="nomeServico input-field-light" placeholder="Nome do serviço"/>
                    <button class="remover btn-remove-icon">✕</button>
                </div>
                <div class="date-inputs-vertical-group">
                    <div class="input-block">
                        <label class="field-label">PREÇO (R$)</label>
                        <input type="number" class="precoServico input-field-light" placeholder="0.00"/>
                    </div>
                    <div class="input-block">
                        <label class="field-label">TIPO DE COBRANÇA</label>
                        <select class="tipoServico input-field-light">
                            <option value="fixo">Preço Fixo</option>
                            <option value="diaria">Diária</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(div);
            div.querySelector(".remover").onclick = () => div.remove();
        };

        criarServico();
        document.getElementById("addServicoBtn").onclick = criarServico;

        document.getElementById("criarHangarBtn").onclick = async () => {
            try {
                const user = AuthService.getUser();
                if (!user) throw new Error("Usuário não autenticado");

                const nome = document.getElementById("nome").value;
                const icao = document.getElementById("icao").value.toUpperCase();

                if (!nome || !icao) {
                    alert("Preencha nome e ICAO.");
                    return;
                }

                const servicos = Array.from(document.querySelectorAll(".service-selection-card")).map(div => ({
                    nome: div.querySelector(".nomeServico").value,
                    preco_produto: parseFloat(div.querySelector(".precoServico").value || 0),
                    tipo: div.querySelector(".tipoServico").value
                }));

                await HangarService.createHangar({ nome, icao, servicos, ownerId: user.uid });
                alert("Hangar criado!");
                window.navigate("/");
            } catch (err) {
                alert(err.message);
            }
        };
    }
};