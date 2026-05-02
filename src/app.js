import { router } from './router.js';
import { AuthService } from './services/authservice.js';

window.addEventListener('load', async () => {
    await AuthService.init(); // ✅ NOME CORRETO
    router();
});