import Navbar from '../../components/navbar.js';
import { HangarService } from '../services/hangarservice.js';

const HangarView = {

    async render() {
        return `
            <div id="app-navbar"></div>

            <div class="hangar-detail-page-light">

                <div id="hangar-container" class="hangar-view-container-light">

                    <div class="loading-wrapper">

                        <div class="loading-spinner"></div>

                        <div class="loading-text">
                            Sincronizando dados...
                        </div>

                    </div>

                </div>

            </div>
        `;
    },

    async after_render() {

        // 🔥 navbar
        const navbarContainer = document.getElementById('app-navbar');

        if (navbarContainer) {
            navbarContainer.innerHTML = await Navbar.render();
            await Navbar.after_render();
        }

        // 🔥 pega parâmetros do HASH ROUTER
        const hash = window.location.hash;

        const queryString = hash.includes('?')
            ? hash.split('?')[1]
            : "";

        const params = new URLSearchParams(queryString);

        const hangarId = params.get('id');

        const container = document.getElementById('hangar-container');

        // 🔥 validação
        if (!hangarId) {

            container.innerHTML = `
                <div class="error-state-light">
                    ID do hangar não identificado.
                </div>
            `;

            return;
        }

        try {

            // 🔥 busca do hangar
            const hangar = await HangarService.getHangarById(hangarId);

            if (!hangar) {

                container.innerHTML = `
                    <div class="error-state-light">
                        Hangar não encontrado.
                    </div>
                `;

                return;
            }

            // 🔥 render final
            container.innerHTML = `
                <div class="hangar-header-light">

                    <div class="header-nav">

                        <button
                            class="btn-close-light"
                            onclick="window.history.back()"
                        >
                            ✕
                        </button>

                    </div>

                    <div class="header-main-info">

                        <h2>${hangar.nome}</h2>

                        <span class="icao-badge-light">
                            ${hangar.icao || '---'}
                        </span>

                    </div>

                </div>

                <div class="content-section-light">

                    <h3 class="section-label-light">
                        SERVIÇOS DISPONÍVEIS
                    </h3>

                    <div class="services-stack">

                        ${
                            hangar.servicos?.length
                            ? hangar.servicos.map(servico => `

                                <div class="service-card-light">

                                    <div class="service-info-group">

                                        <span class="status-indicator">
                                            DISPONÍVEL
                                        </span>

                                        <strong class="service-title-text">
                                            ${servico.nome}
                                        </strong>

                                        <span class="service-type-light">
                                            ${servico.tipo || 'fixo'}
                                        </span>

                                    </div>

                                    <div class="service-price-tag">

                                        R$ ${Number(
                                            servico.preco_produto || 0
                                        ).toFixed(2)}

                                    </div>

                                </div>

                            `).join("")
                            : `
                                <div class="empty-state-light">
                                    Nenhum serviço cadastrado.
                                </div>
                            `
                        }

                    </div>

                </div>

                <div class="action-footer-light">

                    <button
                        class="btn-primary-emerald-bold"
                        onclick="window.location.hash = '#/reserva?hangarId=${hangarId}'"
                    >
                        RESERVAR AGORA
                    </button>

                </div>
            `;

        } catch (error) {

            console.error("Erro ao carregar hangar:", error);

            container.innerHTML = `
                <div class="error-state-light">
                    Erro ao carregar dados do hangar.
                </div>
            `;
        }
    }
};

export default HangarView;