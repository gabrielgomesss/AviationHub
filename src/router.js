import { AuthService } from '../src/services/authservice.js';
import Navbar from '../components/navbar.js';

const routes = {
    '#/': { view: () => import('./views/mapview.js'), private: true },
    '#/login': { view: () => import('./views/loginview.js'), private: false },
    '#/register': { view: () => import('./views/registerview.js'), private: false },
    '#/hangar-dashboard': { view: () => import('./views/hangardashboardview.js'), private: true },
    '#/create-hangar': { view: () => import('./views/createhangarview.js'), private: true },
    '#/hangares': { view: () => import('./views/hangarmanagementview.js'), private: true },
    '#/edit-hangar': { view: () => import('./views/edithangarview.js'), private: true },
    '#/reserva': { view: () => import('./views/reservaview.js'), private: true },
    '#/hangar': { view: () => import('./views/hangarview.js'), private: true },
    '#/pilothub': { view: () => import('./views/pilothub.js'), private: true },
};

const app = document.getElementById("app-viewport");

// AJUSTE: Extrai apenas a rota base, ignorando Query Strings (?id=...)
function getPath() {
    const hash = window.location.hash || "#/";
    return hash.split('?')[0]; // Retorna apenas '#/edit-hangar' em vez de '#/edit-hangar?id=123'
}

async function loadRoute() {
    const path = getPath();
    const fullHash = window.location.hash || "#/"; // Mantemos o hash completo para checagem de login/register
    const route = routes[path];
    const user = AuthService.getUser();

    // 1. Fallback para rotas inexistentes
    if (!route) {
        console.warn("Rota não encontrada:", path);
        window.location.hash = user ? "#/" : "#/login";
        return;
    }

    // 2. Proteção de rota privada
    if (route.private && !user) {
        window.location.hash = "#/login";
        return;
    }

    // 3. Redirecionar usuário logado tentando ir para login/register[cite: 9]
    // Usamos 'path' aqui para garantir que bloqueie mesmo com parâmetros acidentais
    if (user && (path === "#/login" || path === "#/register")) {
        window.location.hash = "#/";
        return;
    }

    try {
        const module = await route.view();
        const view = module.default;

        // Renderiza a View
        app.innerHTML = await view.render();

        // Renderiza a Navbar
        renderNavbar(user);

        if (view.after_render) {
            await view.after_render();
        }

    } catch (err) {
        console.error("Router error:", err);
        app.innerHTML = `<div style="padding:20px;color:red;">Erro ao carregar página</div>`;
    }
}

function renderNavbar(user) {
    let navContainer = document.getElementById('main-nav');
    
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.id = 'main-nav';
        document.body.appendChild(navContainer);
    }

    if (user) {
        navContainer.innerHTML = Navbar.render();
        Navbar.after_render();
    } else {
        navContainer.innerHTML = '';
    }
}

window.addEventListener("hashchange", loadRoute);

export function router() {
    loadRoute();
}