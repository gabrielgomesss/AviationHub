import { AuthService } from '../src/services/authservice.js';

const Navbar = {
    render: () => {
        const user = AuthService.getUser();

        return `
            <div class="bottom-nav-container">
                <nav class="pill-nav">
                    <button class="nav-pill" id="nav-map" data-path="/">Mapa</button>
                    ${user?.permissions?.canEditReservations ? `
                        <button class="nav-pill" id="nav-create" data-path="/create-hangar">Criar</button>
                        <button class="nav-pill" id="nav-manage" data-path="/hangares">Hangares</button>
                        <button class="nav-pill" id="nav-dashboard" data-path="/hangar-dashboard">Dash</button>
                    ` : ''}
                    <button class="nav-pill btn-exit" id="nav-logout">Sair</button>
                </nav>
            </div>
        `;
    },

    after_render: () => {
        // Pega o caminho atual da URL (ex: "/create-hangar")
        const currentPath = window.location.pathname;
        const navPills = document.querySelectorAll('.nav-pill');

        navPills.forEach(pill => {
            const targetPath = pill.getAttribute('data-path');
            
            pill.classList.remove('active');

            // Verifica se o caminho do botão coincide com o da URL
            if (targetPath && currentPath === targetPath) {
                pill.classList.add('active');
            }

            // Listener de clique usando a sua função global window.navigate
            if (targetPath) {
                pill.onclick = (e) => {
                    e.preventDefault();
                    window.navigate(targetPath);
                };
            }
        });

        document.getElementById("nav-logout")?.addEventListener("click", async () => {
            await AuthService.logout();
            window.navigate("/login");
        });
    }
};

export default Navbar;