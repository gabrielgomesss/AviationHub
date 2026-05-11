import { HangarService } from "../services/hangarservice.js";

export default {
    async render() {
        return `
            <div id="app-navbar"></div>
            <div class="hangar-detail-page-light">
                <div class="hangar-view-container-light">
                    
                    <div style="padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; min-height: 70px; background: white; border-radius: 20px 20px 0 0;">
                        <button onclick="window.history.back()" style="background: #f1f5f9; border: none; width: 45px; height: 45px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e293b; margin-right: 15px;">
                            <span class="material-symbols-outlined" style="font-weight: 800;"><svg width="16" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></span>
                        </button>
                        <div>
                            <h2 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b;">Editar Hangar</h2>
                            <p style="margin: 0; color: #64748b; font-size: 0.8rem; font-weight: 500;">Configure os detalhes e serviços</p>
                        </div>
                    </div>

                    <div id="editContainer" class="profile-editor-container" style="padding: 20px; background: white; border-radius: 0 0 20px 20px;">
                        <div class="loading-state" style="text-align: center; padding: 40px; color: #94a3b8;">
                            <p style="font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Sincronizando dados...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },


    async after_render() {
        const hashParts = window.location.hash.split('?');
        const params = new URLSearchParams(hashParts[1] || "");
        const id = params.get("id");
        const editContainer = document.getElementById("editContainer");

        if (!id) {
            window.location.hash = '#/hangares';
            return;
        }

        try {
            const hangar = await HangarService.getHangarById(id);
            if (!hangar) throw new Error("Hangar não encontrado");

            editContainer.innerHTML = `
                <div class="form-section">
                    <div class="input-block">
                        <label class="field-label">NOME DO HANGAR</label>
                        <input type="text" id="nome" class="input-field-light" value="${hangar.nome}">
                        </button>
                    </div>

                    <div style="margin-top: 30px;">
                        <h3 class="field-label">SERVIÇOS DISPONÍVEIS</h3>
                        <div id="servicosContainer" class="services-list-wrapper"></div>
                        <button id="addServicoBtn" class="btn-add-service-dashed" style="width:100%; margin-top:15px;">
                            + Adicionar novo serviço
                        </button>
                    </div>

                    <div style="margin-top: 40px; margin-bottom: 20px;">
                        <button id="salvarHangarBtn" class="btn-primary-emerald-bold" style="width: 100%;">
                            SALVAR ALTERAÇÕES
                        </button>
                    </div>
                </div>
            `;

            const container = document.getElementById("servicosContainer");

            const addServicoCard = (s = { nome: "", preco_produto: 0, tipo: "", sob_consulta: false }) => {
                const div = document.createElement("div");
                div.className = "service-selection-card";
                div.innerHTML = `
                    <button class="remover">✕</button>
                    <div class="service-name-row">
                        <label class="input-sublabel">Descrição do Serviço</label>
                        <input type="text" class="nome input-field-light" value="${s.nome}" placeholder="Ex: Pernoite" style="margin-top: 0;">
                    </div>
                    <div class="service-details-grid">
                        <div class="input-block">
                            <label class="input-sublabel">Preço (R$)</label>
                            <input type="number" class="preco input-field-light ${s.sob_consulta ? 'input-disabled' : ''}" 
                                value="${s.preco_produto}" ${s.sob_consulta ? 'disabled' : ''} style="margin-top: 0;">
                        </div>
                        <div class="input-block">
                            <label class="input-sublabel">Cobrança</label>
                            <input type="text" class="tipo input-field-light ${s.sob_consulta ? 'input-disabled' : ''}" 
                                value="${s.tipo}" ${s.sob_consulta ? 'disabled' : ''} placeholder="Ex: Diária" style="margin-top: 0;">
                        </div>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" class="sobConsulta" ${s.sob_consulta ? "checked" : ""}>
                                <span>À COMBINAR</span>
                            </label>
                        </div>
                    </div>
                `;

                const check = div.querySelector(".sobConsulta");
                const pInput = div.querySelector(".preco");
                const tInput = div.querySelector(".tipo");

                check.onchange = () => {
                    pInput.disabled = check.checked;
                    tInput.disabled = check.checked;
                    if (check.checked) {
                        pInput.value = 0;
                        tInput.value = "valor a combinar";
                        pInput.classList.add("input-disabled");
                        tInput.classList.add("input-disabled");
                    } else {
                        pInput.classList.remove("input-disabled");
                        tInput.classList.remove("input-disabled");
                    }
                };

                div.querySelector(".remover").onclick = () => div.remove();
                container.appendChild(div);
            };

            (hangar.servicos || []).forEach(addServicoCard);
            document.getElementById("addServicoBtn").onclick = () => addServicoCard();

            document.getElementById("salvarHangarBtn").onclick = async () => {
                const btn = document.getElementById("salvarHangarBtn");
                const servicos = Array.from(container.querySelectorAll(".service-selection-card")).map(card => ({
                    nome: card.querySelector(".nome").value,
                    preco_produto: parseFloat(card.querySelector(".preco").value || 0),
                    tipo: card.querySelector(".tipo").value,
                    sob_consulta: card.querySelector(".sobConsulta").checked
                }));

                try {
                    btn.disabled = true;
                    btn.innerText = "SALVANDO...";
                    await HangarService.updateHangar(id, { 
                        nome: document.getElementById("nome").value, 
                        servicos 
                    });
                    alert("Atualizado com sucesso!");
                    window.location.hash = '#/hangares';
                } catch (err) {
                    alert("Erro: " + err.message);
                    btn.disabled = false;
                    btn.innerText = "SALVAR ALTERAÇÕES";
                }
            };

        } catch (err) {
            editContainer.innerHTML = `<div class="error-message">${err.message}</div>`;
        }
    }
};