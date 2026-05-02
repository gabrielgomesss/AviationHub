import { AuthService } from './services/authservice.js';

const routes = {
    '/': { view: () => import('./views/mapview.js'), private: true },
    '/login': { view: () => import('./views/loginview.js'), private: false },
    '/register': { view: () => import('./views/registerview.js'), private: false },
    '/dashboard': { view: () => import('./views/dashboardview.js'), private: true },
    '/create-hangar': { view: () => import('./views/createhangarview.js'), private: true },
    '/hangares': { view: () => import('./views/hangarmanagementview.js'), private: true },
};

export async function router() {
    const path = window.location.pathname;
    const app = document.getElementById('app-viewport');

    if (!app) return;

    const route = routes[path] || routes['/'];

    // 🔐 Proteção de rota
    if (route.private && !AuthService.isAuthenticated()) {
        return window.navigate('/login');
    }

    // 🔐 Evita acessar login logado
    if (path === '/login' && AuthService.isAuthenticated()) {
        return window.navigate('/');
    }

    try {
        const module = await route.view();
        const View = module.default;

        const user = AuthService.getUser();

        // 🔒 Controle de role
        if (path === '/dashboard' && !user?.permissions?.canEditReservations) {
            return window.navigate('/');
        }

        app.innerHTML = await View.render();

        if (View.after_render) {
            await View.after_render();
        }

    } catch (err) {
        console.error("Router error:", err);
        app.innerHTML = "<h1>Erro ao carregar página</h1>";
    }
}

window.navigate = (path) => {
    window.history.pushState({}, "", path);
    router();
};

window.onpopstate = router;