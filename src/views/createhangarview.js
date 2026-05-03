import { HangarService } from "../services/hangarservice.js";
import { AuthService } from "../services/authservice.js";

export default {

    async render() {
        return `
  <div id="app-navbar"></div>
            <div class="hangar-page-layout">
                <div class="page-overlay" onclick="window.history.back()"></div>
                <div class="hangar-container-fluid">
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
                            <input type="text" id="icao" class="input-field-light" placeholder="SBSP"/>
                        </div>

                        <div style="margin-top: 30px;">
                            <h3 class="field-label">Tabela de Serviços</h3>
                            <div id="servicosContainer"></div>
                            <button id="addServicoBtn" style="width:100%; background:none; border:2px dashed #cbd5e1; padding:15px; border-radius:14px; color:#64748b; font-weight:800; cursor:pointer; margin-top:10px;">
                                + Adicionar Serviço
                            </button>
                        </div>

                        <div style="margin-top: 40px;">
                            <button id="criarHangarBtn" class="btn-primary-emerald-bold">FINALIZAR CADASTRO</button>
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