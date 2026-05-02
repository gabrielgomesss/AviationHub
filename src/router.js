// src/router.js
import { LoginView } from './views/LoginView.js';
import { MapView } from './views/MapView.js';
import { DashboardView } from './views/DashboardView.js';

const routes = {
    '/': MapView,
    '/login': LoginView,
    '/dashboard': DashboardView // Tela sensível[cite: 1]
};

export async function router() {
    const path = window.location.pathname;
    const view = routes[path] || MapView;

    // Lógica de Segurança (Route Guard)[cite: 1]
    // Exemplo: Se a rota for /dashboard e o usuário não for admin, redireciona
    const userRole = localStorage.getItem('userRole'); // Simulação temporária
    
    if (path === '/dashboard' && userRole !== 'admin_hangar') {
        console.warn("Acesso negado: Redirecionando para o mapa.");
        window.history.pushState({}, "", "/");
        return router();
    }

    // Injeta a View no container principal
    document.getElementById('app-viewport').innerHTML = await view.render();
    if (view.after_render) await view.after_render();
}

window.navigate = (path) => {
    window.history.pushState({}, "", path);
    router();
};