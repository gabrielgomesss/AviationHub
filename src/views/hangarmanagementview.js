import { HangarService } from '../services/hangarservice.js';

const HangarManagementView = {
    render: async () => `
        <div class="hangar-page-layout">
            <div class="page-overlay" onclick="window.history.back()"></div>
            <div class="hangar-container-fluid">
                <div class="page-header-block" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h2>Meus Hangares</h2>
                        <p class="subtitle-light">Suas unidades cadastradas</p>
                    </div>
                    <button class="btn-primary-emerald-bold" style="width: auto; padding: 10px 20px; font-size: 0.9rem;" 
                            onclick="window.location.hash = '#/create-hangar'">+ NOVO</button>
                </div>

                <div id="hangares-list" class="standard-grid" style="margin-top: 25px;">
                    <div class="loading-state">Sincronizando com o sistema...</div>
                </div>
            </div>
        </div>

        `,

    after_render: async () => {
        const container = document.getElementById('hangares-list');
        
        window.editHangar = (id) => {
            window.location.hash = `#/edit-hangar?id=${id}`;
        };

        // Função auxiliar para gerar a linha de serviço (Use esta função dentro do seu modal de edição/criação)
        window.gerarLinhaServico = (servico = { nome: '', preco_produto: 0, tipo: '', sob_consulta: false }) => {
            const div = document.createElement("div");
            div.className = "service-edit-row";
            div.style = "display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; gap: 10px; align-items: center; margin-bottom: 10px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;";
            
            div.innerHTML = `
                <input type="text" class="serv-nome" placeholder="Nome do Serviço" value="${servico.nome}" style="padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1;">
                
                <input type="number" class="serv-preco" placeholder="Preço" value="${servico.preco_produto}" 
                    ${servico.sob_consulta ? 'disabled' : ''} 
                    style="padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; ${servico.sob_consulta ? 'background:#e2e8f0;' : 'background:white;'}">
                
                <input type="text" class="serv-tipo" placeholder="Unid (Ex: Pernoite)" value="${servico.tipo || ''}" style="padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1;">
                
                <label style="font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; color: #475569; cursor: pointer; text-transform: uppercase;">
                    <input type="checkbox" class="serv-consulta" ${servico.sob_consulta ? 'checked' : ''}>
                    À combinar
                </label>
                
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()" style="background:none; border:none; color:#ef4444; font-size: 1.2rem; cursor:pointer;">✕</button>
            `;

            const check = div.querySelector(".serv-consulta");
            const inputPreco = div.querySelector(".serv-preco");

            check.onchange = () => {
                inputPreco.disabled = check.checked;
                inputPreco.style.background = check.checked ? "#e2e8f0" : "white";
                if (check.checked) inputPreco.value = 0;
            };

            return div;
        };

        // Função auxiliar para capturar todos os serviços da tela antes de salvar
        window.obterDadosServicos = () => {
            return Array.from(document.querySelectorAll(".service-edit-row")).map(row => ({
                nome: row.querySelector(".serv-nome").value,
                preco_produto: parseFloat(row.querySelector(".serv-preco").value) || 0,
                tipo: row.querySelector(".serv-tipo").value,
                sob_consulta: row.querySelector(".serv-consulta").checked
            }));
        };

        try {
            const hangares = await HangarService.getMyHangares();
            if (!hangares || hangares.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;">Nenhum hangar encontrado.</div>`;
                return;
            }

            container.innerHTML = hangares.map(h => `
                <div style="background:#1e293b; border:1px solid #e2e8f0; padding:20px; border-radius:24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3 style="margin:0; font-size:1.1rem; color:white;">${h.nome}</h3>
                            <span style="font-size:0.75rem; font-weight:600; color:white;">ICAO: ${h.icao}</span>
                        </div>
                        <button class="btn-edit-pill" onclick="window.editHangar('${h.id}')" 
                                style="border:1.5px solid #10b981; color:white; background:none; padding:8px 16px; border-radius:12px; font-weight:800; cursor:pointer; transition: all 0.2s;">
                            EDITAR
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error("Erro na HangarManagementView:", err);
            container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erro ao carregar seus hangares.</div>`;
        }
    }
};

export default HangarManagementView;