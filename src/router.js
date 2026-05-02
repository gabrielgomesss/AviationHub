import { AuthService } from './services/auth-service.js';
import { auth } from './services/firebase-config.js';

const routes = {
    '/': () => import('./views/mapview.js'),
    '/login': () => import('./views/loginview.js'),
    '/dashboard': () => import('./views/dashboardview.js')
};

// Função auxiliar para garantir que o Firebase inicializou
const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};

export async function router() {
    const path = window.location.pathname;
    const appViewport = document.getElementById('app-viewport');
    
    if (!appViewport) return;
    appViewport.innerHTML = '<div style="color:white;text-align:center;margin-top:50px;">Verificando conexão...</div>';

    // CRUCIAL: Aguarda o Firebase responder quem é o usuário
    let user = auth.currentUser;
    if (!user) {
        user = await getCurrentUser();
    }

    // Redirecionamento lógico
    if (!user && path !== '/login') {
        window.history.pushState({}, "", "/login");
        return router();
    }

    // Se o usuário já estiver logado e tentar ir para o login, mandamos para a home/dashboard
    if (user && path === '/login') {
        const role = await AuthService.getUserRole(user.uid);
        const destination = (role === 'admin_hangar' || role === 'admin_master') ? '/dashboard' : '/';
        window.history.pushState({}, "", destination);
        return router();
    }

    const loader = routes[path] || routes['/'];
    
    try {
        const module = await loader();
        const View = module.default;

        if (!View || typeof View.render !== 'function') {
            throw new Error("A View não exportou um objeto válido com render().");
        }

        // Verificação de permissão para o Dashboard
        if (path === '/dashboard' && user) {
            const role = await AuthService.getUserRole(user.uid);
            if (role !== 'admin_hangar' && role !== 'admin_master') {
                console.warn("Acesso negado: Usuário não é admin.");
                window.history.pushState({}, "", "/");
                return router();
            }
        }

        appViewport.innerHTML = await View.render();
        if (View.after_render) await View.after_render();

    } catch (error) {
        console.error("Erro de Roteamento:", error);
        appViewport.innerHTML = `
            <div style="color:white; text-align:center; padding:50px;">
                <h2 style="color:#ff4d4d;">Erro de Carregamento</h2>
                <code style="background:#222; padding:10px; display:block; margin-top:10px;">${error.message}</code>
            </div>
        `;
    }
}

window.navigate = (path) => {
    window.history.pushState({}, "", path);
    router();
};

window.onpopstate = router;