import { AuthService } from './services/authservice.js';
import Navbar from '../components/navbar.js';

const routes = {
    '/': { view: () => import('./views/mapview.js'), private: true },
    '/login': { view: () => import('./views/loginview.js'), private: false },
    '/register': { view: () => import('./views/registerview.js'), private: false },
    '/hangar-dashboard': { view: () => import('./views/hangardashboardview.js'), private: true },
    '/create-hangar': { view: () => import('./views/createhangarview.js'), private: true },
    '/hangares': { view: () => import('./views/hangarmanagementview.js'), private: true },
    '/edit-hangar': { view: () => import('./views/edithangarview.js'), private: true },
    '/reserva': { view: () => import('./views/reservaview.js'), private: true },
    '/hangar': { view: () => import('./views/hangarview.js'), private: true },
};

// =========================
// LOCK ANTI LOOP
// =========================
let isRendering = false;

// =========================
// ROUTER PRINCIPAL
// =========================
export async function router() {

    if (isRendering) return; // 🔥 evita loop

    isRendering = true;

    try {

        const path = window.location.pathname;
        const app = document.getElementById('app-viewport');

        if (!app) return;

        const route = routes[path] || routes['/'];

        // 🔐 auth guard
        if (route.private && !AuthService.isAuthenticated()) {
            return window.navigate('/login');
        }

        if (['/login', '/register'].includes(path) && AuthService.isAuthenticated()) {
    return window.navigate('/');
}

        const module = await route.view();
        const View = module.default;

        const user = AuthService.getUser() || AuthService.getCurrentUser?.();

        if (path === '/hangar-dashboard' && !user?.permissions?.canEditReservations) {
    return window.navigate('/');
}

        const layout = (path !== '/login' && path !== '/register')
            ? Navbar.render()
            : '';

        app.innerHTML = `
            ${layout}
            <div id="page-content"></div>
        `;

        if (layout) Navbar.after_render?.();

        const page = document.getElementById("page-content");

        page.innerHTML = await View.render();

        await View.after_render?.();

    } catch (err) {
        console.error("Router error:", err);
    } finally {
        isRendering = false;
    }
}

// =========================
// NAVIGAÇÃO SEGURA
// =========================
window.navigate = (path) => {

    if (window.location.pathname === path) return;

    window.history.pushState({}, "", path);

    queueMicrotask(router); // 🔥 evita execução síncrona em cascata
};

// =========================
// EVENTOS GLOBAIS (UMA VEZ SÓ)
// =========================
window.addEventListener("popstate", router);
window.addEventListener("DOMContentLoaded", router);