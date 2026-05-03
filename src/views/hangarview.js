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

        // --- CORREÇÃO AQUI: Capturando o ID do Hash em vez da URL tradicional ---
        const hash = window.location.hash; // Pega ex: #/hangar?id=123
        const queryString = hash.includes('?') ? hash.split('?')[1] : "";
        const params = new URLSearchParams(queryString);
        const hangarId = params.get('id');
        // -----------------------------------------------------------------------

        const container = document.getElementById('hangar-container');

        if (!hangarId) {
            container.innerHTML = "<div class='error-state-light'>ID do hangar não identificado.</div>";
            return;
        }

        try {
            const hangar = await HangarService.getHangarById(hangarId);

            if (!hangar) {
                container.innerHTML = "<div class='error-state-light'>Hangar não encontrado.</div>";
                return;
            }

            container.innerHTML = `
                <div class="hangar-header-light">
                    <div class="header-nav">
                        <button class="btn-close-light" onclick="window.history.back()">✕</button>
                    </div>
                    <div class="header-main-info">
                        <h2>${hangar.nome}</h2>
                        <span class="icao-badge-light">${hangar.icao || '---'}</span>
                    </div>
                </div>

                <div class="content-section-light">
                    <h3 class="section-label-light">SERVIÇOS DISPONÍVEIS</h3>
                    <div class="services-stack">
                        ${hangar.servicos && hangar.servicos.length > 0 ? hangar.servicos.map(s => `
                            <div class="service-card-light">
                                <div class="service-info-group">
                                    <span class="status-indicator">DISPONÍVEL</span>
                                    <strong class="service-title-text">${s.nome}</strong>
                                </div>
                                <div class="service-price-tag">
                                    R$ ${s.preco_produto}
                                </div>
                            </div>
                        `).join('') : '<p>Nenhum serviço cadastrado.</p>'}
                    </div>
                </div>

                <div class="action-footer-light">
                    <button class="btn-primary-emerald-bold" onclick="window.location.hash = '#/reserva?hangarId=${hangarId}'">
                        RESERVAR AGORA
                    </button>
                </div>
            `;
        } catch (error) {
            console.error("Erro ao carregar hangar:", error);
            container.innerHTML = "<div class='error-state-light'>Erro ao carregar dados do hangar</div>";
        }
    }
};

export default HangarView;