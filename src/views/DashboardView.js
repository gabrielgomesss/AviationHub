// src/views/dashboardview.js
import { AuthService } from '../services/auth-service.js';
import { auth } from '../services/firebase-config.js';

const DashboardView = {
    render: async () => {
        return `
            <div class="dashboard-layout" style="padding: 20px; color: white;">
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2>Painel Administrativo</h2>
                    <button id="btn-logout" style="background: #ff4d4d; border: none; padding: 10px 20px; color: white; border-radius: 5px; cursor: pointer;">Sair</button>
                </header>

                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div class="card glass" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                        <h3>Reservas Hoje</h3>
                        <p id="stat-reservas" style="font-size: 2rem; color: #4ecca3;">...</p>
                    </div>
                </div>

                <div id="hangar-info" style="margin-top: 30px;">
                    <h3>Seus Hangares Gerenciados</h3>
                    <div id="hangar-list" style="margin-top: 15px;">Carregando dados...</div>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            AuthService.logout();
        });

        // Carregar dados reais do usuário (que vimos no seu banco)
        try {
            // Buscando dados do usuário usando a estrutura que você possui
            const userData = await AuthService.getUserRole(user.uid); 
            // Nota: No authservice anterior, retornamos apenas a role. 
            // Para o Dashboard completo, sugerimos usar um getUserData() que retorne o objeto todo.
            
            const hangarList = document.getElementById('hangar-list');
            hangarList.innerHTML = `<p>Role: <span style="color: #4ecca3;">${userData || 'N/A'}</span></p>`;
            
        } catch (error) {
            console.error("Erro ao popular dashboard:", error);
        }
    }
};

export default DashboardView; // ESSA LINHA É OBRIGATÓRIA