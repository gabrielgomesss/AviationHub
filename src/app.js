import { router } from './router.js';
import { AuthService } from './services/authservice.js';

window.addEventListener('load', async () => {
    // Inicializa o Firebase Auth primeiro
    await AuthService.init();
    // Inicia o roteador
    router();
});