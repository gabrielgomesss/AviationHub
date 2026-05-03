import { HangarService } from '../services/hangarservice.js';

const HangarManagementView = {

    render: async () => `
        <div id="app-navbar"></div>
        <div class="hangar-detail-page-light">
            <div class="bg-overlay-blur"></div>
            
            <div class="hangar-view-container-light">
                <div class="hangar-header-light">
                    <div class="header-main-info">
                        <h2>Meus Hangares</h2>
                        <p class="subtitle-light">Gerencie suas unidades e serviços disponíveis</p>
                    </div>
                </div>

                <div id="hangares-list" class="content-section-light">
                    <div class="loading-state">Consultando sistema...</div>
                </div>
            </div>
        </div>
    `,

    after_render: async () => {
        const container = document.getElementById('hangares-list');

        try {
            const hangares = await HangarService.getMyHangares();

            if (!hangares || hangares.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-light">
                        <p>Nenhum hangar encontrado em sua conta.</p>
                        <button onclick="window.navigate('/create-hangar')" class="btn-add-service-dashed">
                            + Criar meu primeiro hangar
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = hangares.map(h => `
                <div class="service-selection-card hangar-item-card">
                    <div class="hangar-item-header">
                        <div>
                            <h3 class="hangar-title">${h.nome}</h3>
                            <span class="icao-badge-mini">${h.icao}</span>
                        </div>
                        <button class="btn-edit-pill" onclick="window.navigate('/edit-hangar?id=${h.id}')">
                            EDITAR
                        </button>
                    </div>

                    <div class="services-list-preview">
                        <label class="field-label">TABELA DE PREÇOS</label>
                        <ul>
                            ${h.servicos.map(s => `
                                <li>
                                    <span class="service-name-text">${s.nome}</span>
                                    <span class="service-price-text">
                                        R$ ${parseFloat(s.preco_produto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                                        <small>${s.tipo === 'diaria' ? '/dia' : '(fixo)'}</small>
                                    </span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error(err);
            container.innerHTML = `
                <div class="error-state-light">
                    <p>Erro ao sincronizar dados dos hangares.</p>
                </div>
            `;
        }
    }
};

export default HangarManagementView;