// src/router.js
import { AuthService } from './services/AuthService.js';
import { auth } from './services/firebase-config.js';

const routes = {
    '/': () => import('./views/MapView.js'),
    '/login': () => import('./views/LoginView.js'),
    '/dashboard': () => import('./views/DashboardView.js')
};

export async function router() {
    const path = window.location.pathname;
    
    // Busca a rota ou define a padrão
    const routeAction = routes[path] || routes['/'];
    
    let View;
    try {
        const module = await routeAction();
        View = module.default;
    } catch (e) {
        console.error("Erro ao carregar View:", e);
        // Fallback caso a View não exista (ex: MapView ainda não criada)
        document.getElementById('app-viewport').innerHTML = `<h2>Em desenvolvimento</h2><button onclick="navigate('/login')">Ir para Login</button>`;
        return;
    }

    // Controle de Acesso Baseado em Perfil (RBAC)[cite: 1]
    const user = auth.currentUser;
    const userRole = user ? await AuthService.getUserRole(user.uid) : 'visitante';

    // Se tentar acessar o mapa ou dashboard sem estar logado, manda para o login
    if (path !== '/login' && !user) {
        window.history.pushState({}, "", "/login");
        return router();
    }

    const appViewport = document.getElementById('app-viewport');
    appViewport.innerHTML = await View.render();
    if (View.after_render) await View.after_render();
    
    // Mostra ou esconde a navegação baseado no login
    const nav = document.getElementById('main-nav');
    if (nav) nav.style.display = user ? 'flex' : 'none';
}

window.navigate = (path) => {
    window.history.pushState({}, "", path);
    router();
};