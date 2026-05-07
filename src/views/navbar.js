import { AuthService } from '../services/authservice.js';
import { ReservaService } from '../services/reservaservice.js';

const Navbar = {
    render: () => {
        const user = AuthService.getUser();
        // Agora verificamos a ROLE em vez de permissions
        const isAdmin = user?.role === 'admin_hangar';

        return `
            <div class="bottom-nav-container">
                <nav class="pill-nav">
                    <button class="nav-pill" id="nav-map" data-path="#/">Mapa</button>
                    ${isAdmin ? `
                        <button class="nav-pill" id="nav-create" data-path="#/create-hangar">Criar</button>
                        <button class="nav-pill" id="nav-manage" data-path="#/hangares">Hangares</button>
                        <button class="nav-pill" id="nav-dashboard" data-path="#/hangar-dashboard" style="position: relative; overflow: visible;">
                            Dash
                            <span id="badge-reservas" class="nav-badge" style="display: none;">0</span>
                        </button>
                    ` : `
                        <button class="nav-pill" id="nav-voos" data-path="#/meus-voos">Meus Voos</button>
                    `}
                    <button class="nav-pill btn-exit" id="nav-logout">Sair</button>
                </nav>
            </div>
        `;
    },

    after_render: () => {
        const currentPath = window.location.hash || '#/';
        const navPills = document.querySelectorAll('.nav-pill');
        const user = AuthService.getUser();
        const isAdmin = user?.role === 'admin_hangar'; // Validação centralizada

        navPills.forEach(pill => {
            const targetPath = pill.getAttribute('data-path');
            pill.classList.remove('active');

            if (targetPath && currentPath === targetPath) {
                pill.classList.add('active');
                pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }

            if (targetPath) {
                pill.onclick = (e) => {
                    e.preventDefault();
                    window.location.hash = targetPath;
                };
            }
        });

        // Monitoramento de Reservas (Apenas se for Admin e o elemento existir)
        if (isAdmin) {
            const badge = document.getElementById('badge-reservas');
            
            // Verificação de segurança para evitar o erro de 'null' visto na imagem b10936
            if (badge) {
                ReservaService.listenReservasPorStatus("aguardando_pagamento", (reservas) => {
                    if (reservas && reservas.length > 0) {
                        badge.innerText = reservas.length > 9 ? '9+' : reservas.length;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                });
            }
        }

        document.getElementById("nav-logout")?.addEventListener("click", async () => {
            await AuthService.logout();
            window.location.hash = "#/";
            window.location.reload(); // Recarrega para limpar o estado da Navbar
        });
    }
};

export default Navbar;