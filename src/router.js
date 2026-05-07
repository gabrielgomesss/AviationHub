import { AuthService } from './services/authservice.js';
import Navbar from './views/navbar.js';

// Definição das rotas e seus níveis de acesso
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
    '#/pilothub': { view: () => import('./views/pilothub.js'), private: true },
};

const app = document.getElementById("app-viewport");

function getPath() {
    const hash = window.location.hash || "#/";
    return hash.split('?')[0];
}

async function loadRoute() {
    const path = getPath();
    const route = routes[path];
    const user = AuthService.getUser();

    // 1. Fallback para rotas inexistentes: manda para home ou login
    if (!route) {
        window.location.hash = user ? "#/" : "#/login";
        return;
    }

    // 2. Proteção de rota privada: se não houver usuário, vai para login
    if (route.private && !user) {
        window.location.hash = "#/login";
        return;
    }

    // 3. Bloqueio de Login/Register para usuários já autenticados
    if (user && (path === "#/login" || path === "#/register")) {
        window.location.hash = "#/";
        return;
    }

    try {
        const module = await route.view();
        const view = module.default;

        // Renderiza a View no container principal
        app.innerHTML = await view.render();

        // Gerencia a exibição da Navbar baseada no login
        renderNavbar(user);

        // Executa lógica pós-renderização (event listeners, etc)
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
    
    // Cria o container da navbar se ele não existir no HTML
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.id = 'main-nav';
        document.body.appendChild(navContainer);
    }

    // Só exibe a Navbar para usuários logados
    if (user) {
        navContainer.innerHTML = Navbar.render();
        Navbar.after_render();
    } else {
        navContainer.innerHTML = '';
    }
}

// Ouve mudanças na URL para trocar de página
window.addEventListener("hashchange", loadRoute);

export function router() {
    loadRoute();
}