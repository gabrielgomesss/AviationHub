// src/router.js
import { AuthService } from './services/AuthService.js';
import { auth } from './services/firebase-config.js';

// Importação dinâmica das Views para otimização de carregamento
const routes = {
    '/': () => import('./views/MapView.js'),
    '/login': () => import('./views/LoginView.js'),
    '/dashboard': () => import('./views/DashboardView.js'),
    '/perfil': () => import('./views/ProfileView.js')
};

export async function router() {
    const path = window.location.pathname;
    
    // 1. Identifica a View
    const routeAction = routes[path] || routes['/'];
    const { default: View } = await routeAction();

    // 2. Verificação de Segurança (Route Guards)
    const user = auth.currentUser;
    const userRole = user ? await AuthService.getUserRole(user.uid) : 'visitante';

    // Bloqueia acesso ao Dashboard se não for Admin
    if (path === '/dashboard') {
        if (userRole !== 'admin_hangar' && userRole !== 'admin_master') {
            console.warn("Acesso negado: Perfil insuficiente.");
            return window.navigate('/');
        }
    }

    // Bloqueia acesso ao Perfil se não estiver logado
    if (path === '/perfil' && !user) {
        return window.navigate('/login');
    }

    // 3. Renderização da View no App Shell
    const appViewport = document.getElementById('app-viewport');
    if (appViewport) {
        appViewport.innerHTML = await View.render();
        if (View.after_render) await View.after_render();
    }
}

// Listener para navegação por cliques e histórico do navegador
window.onpopstate = router;

window.navigate = (path) => {
    window.history.pushState({}, "", path);
    router();
};