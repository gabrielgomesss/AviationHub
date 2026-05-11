import { AuthService } from './services/authservice.js';
import Navbar from './views/navbar.js';

// 1. Adicionado a rota partnerhub
const routes = {
    '#/': { view: () => import('./views/mapview.js'), private: true },
    '#/login': { view: () => import('./views/loginview.js'), private: false },
    '#/register': { view: () => import('./views/registerview.js'), private: false },
    '#/hangar-dashboard': { view: () => import('./views/hangardashboard.js'), private: true },
    '#/create-hangar': { view: () => import('./views/createhangarview.js'), private: true },
    '#/hangares': { view: () => import('./views/hangarmanagementview.js'), private: true },
    '#/edit-hangar': { view: () => import('./views/edithangarview.js'), private: true },
    '#/reserva': { view: () => import('./views/reservaview.js'), private: true },
    '#/hangar': { view: () => import('./views/hangarview.js'), private: true },
    '#/pilothub': { view: () => import('./views/pilothubview.js'), private: true },
    '#/partners': { view: () => import('./views/partnerhubview.js'), private: true }, // Rota corrigida
    '#/myreserve': { view: () => import('./views/myreserveview.js'), private: true },
};

const app = document.getElementById("app-viewport");

function getPath() {
    const hash = window.location.hash || '#/';
    return hash.split('?')[0]; 
}

async function router() {
    const path = getPath();
    const route = routes[path];
    const user = AuthService.getUser();

    // --- FIREWALL DE SEGURANÇA E ROLES ---

    // 1. Se a rota não existe, volta pro mapa
    if (!route) {
        window.location.hash = "#/";
        return;
    }

    // 2. Se for privada e não estiver logado, vai pro login
    if (route.private && !user) {
        window.location.hash = "#/login";
        return;
    }

    // 3. BLOQUEIO PARA PARCEIROS: Se for parceiro, só pode acessar #/partnerhub
    if (user?.role === 'parceiro' && path !== '#/partners') {
        window.location.hash = "#/partners";
        return;
    }

    // 4. Bloqueio de Login/Register para quem já está logado
    if (user && (path === "#/login" || path === "#/register")) {
        window.location.hash = "#/";
        return;
    }

    try {
        const module = await route.view();
        const view = module.default;

        app.innerHTML = await view.render();
        renderNavbar(user);

        if (view.after_render) {
            await view.after_render();
        }

    } catch (err) {
        console.error("Router error:", err);
        app.innerHTML = `<div style="padding:20px;color:red;">Erro ao carregar página. Certifique-se que o arquivo existe.</div>`;
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

window.addEventListener("hashchange", router);
window.addEventListener("load", router);

export { router };