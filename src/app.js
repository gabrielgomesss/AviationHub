// src/app.js
import { router } from './router.js';
import { AuthService } from './services/auth-service.js';

// Escuta mudanças de estado de autenticação para proteger rotas em tempo real
// AuthService.subscribeAuthState((user) => {
//     console.log("Estado de Autenticação Alterado:", user ? "Conectado" : "Desconectado");
//     router(); // Dispara o roteador sempre que o status do usuário muda
// });

// Listener para navegação por botões do navegador (voltar/avançar)
window.addEventListener('popstate', router);

// Inicialização imediata
window.addEventListener('load', router);