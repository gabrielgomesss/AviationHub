import { HangarService } from "../services/hangarservice.js";

export default {

    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-detail-page-light">
                <div class="bg-overlay-blur"></div>
                
                <div class="hangar-view-container-light">
                    <div class="hangar-header-light">
                        <div class="header-nav">
                            <button class="btn-close-light" onclick="window.history.back()">✕</button>
                        </div>
                        <div class="header-main-info">
                            <h2>Editar Hangar</h2>
                            <p class="subtitle-light">Atualize as informações e tabela de preços</p>
                        </div>
                    </div>
                    
                    <div id="editContainer" class="content-section-light">
                        <div class="loading-state">Carregando dados da unidade...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        const editContainer = document.getElementById("editContainer");

        try {
            const hangar = await HangarService.getHangarById(id);

            if (!hangar) {
                editContainer.innerHTML = "<div class='error-state-light'>Hangar não encontrado.</div>";
                return;
            }

            editContainer.innerHTML = `
                <div class="form-section">
                    <h3 class="section-label-light">IDENTIFICAÇÃO</h3>
                    <div class="input-block">
                        <label class="field-label">NOME DO HANGAR</label>
                        <input type="text" id="nome" class="input-field-light" value="${hangar.nome}" placeholder="Nome do hangar"/>
                    </div>
                </div>

                <div class="form-section" style="margin-top: 30px;">
                    <h3 class="section-label-light">SERVIÇOS ATIVOS</h3>
                    <div id="servicosContainer"></div>
                    
                    <button id="addServico" class="btn-add-service-dashed">
                        <span>+</span> Adicionar novo serviço
                    </button>
                </div>

                <div class="action-footer-light">
                    <button id="salvar" class="btn-primary-emerald-bold">
                        SALVAR ALTERAÇÕES
                    </button>
                </div>
            `;

            const container = document.getElementById("servicosContainer");

            const criarServico = (s = {}) => {
                const div = document.createElement("div");
                div.className = "service-selection-card";

                div.innerHTML = `
                    <div class="card-header-row">
                        <input class="nome input-field-light" value="${s.nome || ''}" placeholder="Ex: Estadia Diária"/>
                        <button class="remover btn-remove-icon">✕</button>
                    </div>

                    <div class="date-inputs-vertical-group">
                        <div class="input-block">
                            <label class="field-label">PREÇO (R$)</label>
                            <input class="preco input-field-light" type="number" value="${s.preco_produto || 0}" placeholder="0.00"/>
                        </div>
                        <div class="input-block">
                            <label class="field-label">COBRANÇA</label>
                            <select class="tipo input-field-light">
                                <option value="fixo" ${s.tipo === "fixo" ? "selected" : ""}>Fixo</option>
                                <option value="diaria" ${s.tipo === "diaria" ? "selected" : ""}>Diária</option>
                            </select>
                        </div>
                    </div>
                `;

                container.appendChild(div);
                div.querySelector(".remover").onclick = () => div.remove();
            };

            // Carrega serviços existentes
            (hangar.servicos || []).forEach(s => {
                criarServico({...s, tipo: s.tipo || "fixo"});
            });

            document.getElementById("addServico").onclick = () => criarServico();

            document.getElementById("salvar").onclick = async () => {
                const nome = document.getElementById("nome").value;
                const cards = container.querySelectorAll(".service-selection-card");
                
                const servicos = Array.from(cards).map(card => ({
                    nome: card.querySelector(".nome").value,
                    preco_produto: parseFloat(card.querySelector(".preco").value || 0),
                    tipo: card.querySelector(".tipo").value
                }));

                try {
                    await HangarService.updateHangar(id, { nome, servicos });
                    alert("Configurações atualizadas com sucesso!");
                    window.navigate('/hangares');
                } catch (err) {
                    alert("Erro ao salvar: " + err.message);
                }
            };

        } catch (err) {
            console.error(err);
            editContainer.innerHTML = "<div class='error-state-light'>Erro ao carregar dados.</div>";
        }
    }
};