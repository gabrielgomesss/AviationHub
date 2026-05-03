import { HangarService } from "../services/hangarservice.js";

export default {
    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-page-layout">
                <!-- Overlay para fechar ao clicar fora ou focar na edição -->
                <div class="page-overlay" onclick="window.history.back()"></div>
                
                <div class="hangar-container-fluid">
                    
                    <div class="page-header-block">
                        <div class="page-header-info">
                            <h2>Editar Hangar</h2>
                            <p class="subtitle-light">Aprimore os detalhes da sua unidade</p>
                        </div>
                    </div>
                    
                    <div id="editContainer" class="content-section-light" style="margin-top: 20px;">
                        <div class="loading-state">Sincronizando dados...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        const editContainer = document.getElementById("editContainer");

        if (!id) {
            window.navigate('/hangares');
            return;
        }

        try {
            const hangar = await HangarService.getHangarById(id);

            if (!hangar) {
                editContainer.innerHTML = `
                    <div style="text-align:center; padding:40px;">
                        <p style="color:#ef4444; font-weight:800;">Hangar não encontrado.</p>
                        <button onclick="window.history.back()" class="btn-primary-emerald-bold" style="margin-top:20px;">VOLTAR</button>
                    </div>`;
                return;
            }

            editContainer.innerHTML = `
                <div class="form-section">
                    <label class="field-label">NOME DO HANGAR</label>
                    <input type="text" id="nome" class="input-field-light" value="${hangar.nome}" placeholder="Ex: Hangar Alpha"/>
                </div>

                <div class="form-section" style="margin-top: 30px;">
                    <h3 class="field-label">TABELA DE PREÇOS ATIVA</h3>
                    <div id="servicosContainer" class="standard-grid" style="margin-top:10px;"></div>
                    
                    <button id="addServico" class="btn-add-service-dashed" style="width:100%; background:none; border:2px dashed #cbd5e1; padding:15px; border-radius:14px; color:#64748b; font-weight:800; cursor:pointer; margin-top:15px;">
                        + Adicionar Novo Serviço
                    </button>
                </div>

                <div style="margin-top: 40px; display: grid; gap: 15px;">
                    <button id="salvar" class="btn-primary-emerald-bold">
                        SALVAR ALTERAÇÕES
                    </button>
                    <button id="deletarHangar" style="background:none; border:none; color:#ef4444; font-weight:700; padding:10px; cursor:pointer; font-size:0.9rem;">
                        EXCLUIR ESTA UNIDADE
                    </button>
                </div>
            `;

            const container = document.getElementById("servicosContainer");

            const criarServico = (s = {}) => {
                const div = document.createElement("div");
                div.className = "service-selection-card";
                div.style = "background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:18px; margin-bottom:10px;";

                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <input class="nome input-field-light" value="${s.nome || ''}" placeholder="Serviço" style="margin-top:0; flex:1;"/>
                        <button class="remover" style="background:#fee2e2; color:#ef4444; border:none; width:36px; height:36px; border-radius:10px; margin-left:10px; cursor:pointer; font-weight:bold;">✕</button>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label class="field-label" style="font-size:0.65rem;">PREÇO (R$)</label>
                            <input class="preco input-field-light" type="number" value="${s.preco_produto || 0}" style="margin-top:5px;"/>
                        </div>
                        <div>
                            <label class="field-label" style="font-size:0.65rem;">COBRANÇA</label>
                            <select class="tipo input-field-light" style="margin-top:5px;">
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

            // Lógica de Salvar
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

            // Lógica de Deletar (Opcional, mas recomendado para o Admin)
            document.getElementById("deletarHangar").onclick = async () => {
                if(confirm("Tem certeza que deseja remover este hangar permanentemente?")) {
                    // Implementar HangarService.deleteHangar(id) se necessário
                    alert("Operação bloqueada: Implemente a deleção no Service.");
                }
            };

        } catch (err) {
            console.error(err);
            editContainer.innerHTML = "<div class='error-state-light'>Erro ao sincronizar dados da aeronave.</div>";
        }
    }
};