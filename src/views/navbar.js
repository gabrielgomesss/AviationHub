import { AuthService } from '../services/authservice.js';
import { ReservaService } from '../services/reservaservice.js';

const Navbar = {
    render: () => {
        const user = AuthService.getUser();
        const role = user?.role;

        const isAdmin = role === 'admin_hangar';
        const isPilot = role === 'piloto';

        return `
            <div class="bottom-nav-container">
                <nav class="pill-nav">
                    <button class="nav-pill" id="nav-map" data-path="#/">Mapa</button>
                    
                    ${isPilot ? `
                        <button class="nav-pill" id="nav-myreserves" data-path="#/myreserve" style="position: relative; overflow: visible;">
                            Minhas Reservas
                            <span id="badge-piloto" style="
                                display: none; 
                                position: absolute; 
                                top: -8px; 
                                right: -8px; 
                                background-color: #ef4444; 
                                color: white; 
                                font-size: 11px; 
                                font-weight: bold; 
                                width: 22px; 
                                height: 22px; 
                                border-radius: 50%; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                border: 2px solid white;
                                z-index: 999;
                            ">0</span>
                        </button>
                    ` : ''}

                    <button class="nav-pill" id="nav-partners" data-path="#/partners">Parceiros</button>

                    ${isAdmin ? `
                        <button class="nav-pill" id="nav-manage" data-path="#/hangares">Hangares</button>
                        <button class="nav-pill" id="nav-dashboard" data-path="#/hangar-dashboard" style="position: relative; overflow: visible;">
                            Dashboard
                            <span id="badge-reservas-admin" style="
                                display: none; 
                                position: absolute; 
                                top: -8px; 
                                right: -8px; 
                                background-color: #ef4444; 
                                color: white; 
                                font-size: 11px; 
                                font-weight: bold; 
                                width: 22px; 
                                height: 22px; 
                                border-radius: 50%; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                border: 2px solid white;
                                z-index: 999;
                            ">0</span>
                        </button>
                    ` : ''}
                    
                    <button class="nav-pill btn-exit" id="nav-logout">Sair</button>
                </nav>
            </div>
        `;
    },

    after_render: () => {
        const user = AuthService.getUser();
        const currentPath = window.location.hash || '#/';
        const navPills = document.querySelectorAll('.nav-pill');

        // Configuração de cliques e estado ativo
        navPills.forEach(pill => {
            const targetPath = pill.getAttribute('data-path');
            pill.classList.remove('active');
            if (targetPath && currentPath === targetPath) pill.classList.add('active');

            if (targetPath) {
                pill.onclick = (e) => {
                    e.preventDefault();
                    window.location.hash = targetPath;
                };
            }
        });

        // --- ATIVAÇÃO DOS BADGES EM TEMPO REAL ---

        // 1. Lógica para Admin (Lê todos os IDs em managed_hangars)
        if (user?.role === 'admin_hangar') {
            const badgeAdmin = document.getElementById('badge-reservas-admin');
            const idsParaMonitorar = user.managed_hangars || (user.hangarId ? [user.hangarId] : []);

            if (idsParaMonitorar.length > 0) {
                ReservaService.listenReservasPendentesGeral(idsParaMonitorar, (count) => {
                    if (badgeAdmin) {
                        if (count > 0) {
                            badgeAdmin.innerText = count > 9 ? '9+' : count;
                            badgeAdmin.style.display = 'flex';
                        } else {
                            badgeAdmin.style.display = 'none';
                        }
                    }
                });
            }
        }

        // 2. Lógica para Piloto (Alinhado com o ID correto e estilo idêntico)
        if (user?.role === 'piloto') {
            const badgePiloto = document.getElementById('badge-piloto');
            ReservaService.listenNotificacoesPiloto(user.uid, (count) => {
                if (badgePiloto) {
                    if (count > 0) {
                        badgePiloto.innerText = count > 9 ? '9+' : count;
                        badgePiloto.style.display = 'flex';
                    } else {
                        badgePiloto.style.display = 'none';
                    }
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