import { AuthService } from '../src/services/authservice.js';
import { ReservaService } from '../src/services/reservaservice.js';

const Navbar = {
    render: () => {
        const user = AuthService.getUser();

        return `
            <div class="bottom-nav-container">
                <nav class="pill-nav">
                    <button class="nav-pill" id="nav-map" data-path="#/">Mapa</button>
                    ${user?.permissions?.canEditReservations ? `
                        <button class="nav-pill" id="nav-create" data-path="#/create-hangar">Criar</button>
                        <button class="nav-pill" id="nav-manage" data-path="#/hangares">Hangares</button>
                        <button class="nav-pill" id="nav-dashboard" data-path="#/hangar-dashboard" style="position: relative; overflow: visible;">
                            Dash
                            <span id="badge-reservas" class="nav-badge" style="display: none;">0</span>
                        </button>
                    ` : ''}
                    <button class="nav-pill btn-exit" id="nav-logout">Sair</button>
                </nav>
            </div>
        `;
    },

    after_render: () => {
        const currentPath = window.location.hash || '#/';
        const navPills = document.querySelectorAll('.nav-pill');
        const user = AuthService.getUser();

        navPills.forEach(pill => {
            const targetPath = pill.getAttribute('data-path');
            pill.classList.remove('active');

            if (targetPath && currentPath === targetPath) {
                pill.classList.add('active');
                // Centraliza o item ativo caso haja scroll lateral
                pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }

            if (targetPath) {
                pill.onclick = (e) => {
                    e.preventDefault();
                    window.location.hash = targetPath;
                };
            }
        });

        // Monitoramento de Reservas Pendentes em Tempo Real
        if (user?.permissions?.canEditReservations) {
            const badge = document.getElementById('badge-reservas');
            
            ReservaService.listenReservasPorStatus("aguardando_pagamento", (reservas) => {
                if (reservas && reservas.length > 0) {
                    badge.innerText = reservas.length > 9 ? '9+' : reservas.length;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            });
        }

        document.getElementById("nav-logout")?.addEventListener("click", async () => {
            await AuthService.logout();
            window.location.hash = "#/login";
        });
    }
};

export default Navbar;