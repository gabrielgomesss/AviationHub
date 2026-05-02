import { AuthService } from '../services/authservice.js';

const DashboardView = {

    render: async () => {
        const user = AuthService.getUser();

        return `
            <h1>Dashboard</h1>
            <p>Bem-vindo, ${user.display_name}</p>
            <button id="logout">Logout</button>
        `;
    },

    after_render: async () => {
        document.getElementById('logout')
            .addEventListener('click', AuthService.logout);
    }
};

export default DashboardView;