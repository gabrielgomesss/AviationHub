import { AuthService } from '../services/authservice.js';
import Navbar from '../../components/navbar.js';

const MapView = {

    render: async () => {
        const user = AuthService.getUser();

        console.log("MAP VIEW RENDER");
        console.log("USER:", user);

        return `
            <div id="app-navbar"></div>

            <div style="padding:20px;">
                <h1>Mapa</h1>
                <p>Bem-vindo, ${user?.display_name || 'Usuário'}</p>
            </div>
        `;
    },

    after_render: async () => {
        // 🔥 injeta navbar manualmente
        const navbarContainer = document.getElementById('app-navbar');

        navbarContainer.innerHTML = Navbar.render();
        Navbar.after_render();

        console.log("NAVBAR RENDERIZADO");
    }
};

export default MapView;