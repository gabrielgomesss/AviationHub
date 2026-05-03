import Navbar from '../../components/navbar.js';
import { HangarService } from '../services/hangarservice.js';

const HangarView = {

    render: async () => `
        <div id="app-navbar"></div>
        <div class="hangar-detail-page-light">
            <div id="hangar-container" class="hangar-view-container-light">
                <div class="loading-state">Sincronizando dados...</div>
            </div>
        </div>
    `,

    after_render: async () => {
        const navbarContainer = document.getElementById('app-navbar');
        if (navbarContainer) {
            navbarContainer.innerHTML = await Navbar.render();
            await Navbar.after_render();
        }

        const params = new URLSearchParams(window.location.search);
        const hangarId = params.get('id');
        const container = document.getElementById('hangar-container');

        try {
            const hangar = await HangarService.getHangarById(hangarId);

            container.innerHTML = `
                <div class="hangar-header-light">
                    <div class="header-nav">
                        <button class="btn-close-light" onclick="window.history.back()">✕</button>
                    </div>
                    <div class="header-main-info">
                        <h2>${hangar.nome}</h2>
                        <span class="icao-badge-light">${hangar.icao}</span>
                        </div>
                </div>

                <div class="content-section-light">
                    <h3 class="section-label-light">SERVIÇOS DISPONÍVEIS</h3>
                    <div class="services-stack">
                        ${hangar.servicos.map(s => `
                            <div class="service-card-light">
                                <div class="service-info-group">
                                    <span class="status-indicator">DISPONÍVEL</span>
                                    <strong class="service-title-text">${s.nome}</strong>
                                </div>
                                <div class="service-price-tag">
                                    R$ ${s.preco_produto}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="action-footer-light">
                    <button class="btn-primary-emerald-bold" onclick="window.navigate('/reserva?hangarId=${hangar.id}')">
                        RESERVAR AGORA
                    </button>
                </div>
            `;
        } catch {
            container.innerHTML = "<div class='error-state-light'>Erro ao carregar dados do hangar</div>";
        }
    }
};

export default HangarView;