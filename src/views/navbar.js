import { AuthService } from '../services/authservice.js';
import { ReservaService } from '../services/reservaservice.js';

const Navbar = {
    render: () => {
        const user = AuthService.getUser();
        // Forçamos o lowercase para evitar erro de comparação (Parceiro vs parceiro)
        const role = (user?.role || 'piloto').toLowerCase();
        
        const isAdmin = role === 'admin_hangar';
        const isPartner = role === 'parceiro';

        // LOG DE DEPURAÇÃO: Remova após testar
        console.log("Navbar Role Check:", role, "IsPartner:", isPartner);

        // BLOQUEIO TOTAL: Se for Parceiro, retorna APENAS o menu de parceiro imediatamente
        if (isPartner) {
            return `
                <div class="bottom-nav-container">
                    <nav class="pill-nav">
                        <button class="nav-pill active" id="nav-partner" data-path="#/partners">Meu Perfil</button>
                        <button class="nav-pill btn-exit" id="nav-logout">Sair</button>
                    </nav>
                </div>
            `;
        }

        // MENU PARA DEMAIS USUÁRIOS (PILOTOS E ADMINS)
        return `
            <div class="bottom-nav-container">
                <nav class="pill-nav">
                    <button class="nav-pill" id="nav-map" data-path="#/">Mapa</button>
                    
                    ${isAdmin ? `
                        <button class="nav-pill" id="nav-dashboard" data-path="#/hangar-dashboard" style="position: relative; overflow: visible;">
                            Dash
                            <span id="badge-reservas" class="nav-badge" style="display: none;">0</span>
                        </button>
                        <button class="nav-pill" id="nav-manage" data-path="#/hangares">Hangares</button>
                    ` : `
                        <button class="nav-pill" id="nav-myreserves" data-path="#/myreserve">Reservas</button>
                    `}

                    <button class="nav-pill" id="nav-pilots" data-path="#/pilothub">PilotHub</button>
                    <button class="nav-pill" id="nav-partners" data-path="#/partners">Parceiros</button>
                    
                    <button class="nav-pill btn-exit" id="nav-logout">Sair</button>
                </nav>
            </div>
        `;
    },

    after_render: () => {
        const user = AuthService.getUser();
        const role = (user?.role || 'piloto').toLowerCase();
        const isAdmin = role === 'admin_hangar';
        const currentPath = window.location.hash || '#/';

        const pills = document.querySelectorAll('.nav-pill');

        pills.forEach(pill => {
            const targetPath = pill.getAttribute('data-path');
            
            // Remove active de todos primeiro
            pill.classList.remove('active');

            if (targetPath && currentPath === targetPath) {
                pill.classList.add('active');
                // Scroll suave para o item ativo no mobile
                pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }

            if (targetPath) {
                pill.onclick = (e) => {
                    e.preventDefault();
                    window.location.hash = targetPath;
                };
            }
        });

        // Lógica do Badge apenas para Admins
        if (isAdmin) {
            const badge = document.getElementById('badge-reservas');
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

        // Evento de Logout
        document.getElementById("nav-logout")?.addEventListener("click", async () => {
            await AuthService.logout();
            window.location.hash = "#/login";
            window.location.reload(); 
        });
    }
};

export default Navbar;