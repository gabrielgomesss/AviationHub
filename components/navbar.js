import { AuthService } from '../src/services/authservice.js';

const Navbar = {

    render: () => {
        const user = AuthService.getUser();

        return `
            <div style="
                width:100%;
                background:#222;
                color:#fff;
                padding:10px;
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">
                <div>
                    <strong>AviationHub</strong>
                </div>

                <div>
                    <button id="nav-map">Mapa</button>

                    ${
                        user?.permissions?.canEditReservations
                        ? `
                            <button id="nav-create">Criar Hangar</button>
                            <button id="nav-manage">Meus Hangares</button>
                          `
                        : ''
                    }

                    <button id="nav-logout">Logout</button>
                </div>
            </div>
        `;
    },

    after_render: () => {
        document.getElementById('nav-map')?.addEventListener('click', () => {
            window.navigate('/');
        });

        document.getElementById('nav-create')?.addEventListener('click', () => {
            window.navigate('/create-hangar');
        });

        document.getElementById('nav-manage')?.addEventListener('click', () => {
            window.navigate('/hangares');
        });

        document.getElementById('nav-logout')?.addEventListener('click', async () => {
            await AuthService.logout();
            window.navigate('/login');
        });
    }
};

export default Navbar;