import { AuthService } from '../src/services/authservice.js';
import { ReservaService } from '../src/services/reservaservice.js';

const Navbar = {
    render: () => {
        const user = AuthService.getUser();

        return `
            <div class="bottom-nav-container">
                <nav class="pill-nav" style="position: relative;">
                    <button class="nav-pill" id="nav-map" data-path="#/">Mapa</button>
                    ${user?.permissions?.canEditReservations ? `
                        <button class="nav-pill" id="nav-create" data-path="#/create-hangar">Criar</button>
                        <button class="nav-pill" id="nav-manage" data-path="#/hangares">Hangares</button>
                        <button class="nav-pill" id="nav-dashboard" data-path="#/hangar-dashboard" style="position: relative; overflow: visible;">
                            Dash
                            <span id="badge-reservas" style="
                                display: none;
                                position: absolute;
                                top: -11px;
                                right: -4px;
                                background-color: #ff3b30;
                                color: white;
                                font-size: 11px;
                                font-weight: bold;
                                min-width: 18px;
                                height: 18px;
                                border-radius: 10px;
                                padding: 0 5px;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                z-index: 10;
                            ">0</span>
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
            }

            if (targetPath) {
                pill.onclick = (e) => {
                    e.preventDefault();
                    window.location.hash = targetPath;
                };
            }
        });

        // --- LÓGICA DE ATUALIZAÇÃO DO BADGE EM TEMPO REAL ---
        if (user?.permissions?.canEditReservations) {
            const badge = document.getElementById('badge-reservas');
            
            // Ativa o listener para o status específico do seu banco
            ReservaService.listenReservasPorStatus("aguardando_pagamento", (reservas) => {
                if (reservas && reservas.length > 0) {
                    badge.innerText = reservas.length > 9 ? '9+' : reservas.length;
                    badge.style.display = 'flex'; // Torna visível como flex para centralizar o texto
                } else {
                    badge.style.display = 'none'; // Oculta se não houver pendências
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