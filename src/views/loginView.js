import { AuthService } from '../services/authservice.js';

const LoginView = {
    render: async () => {
        return `
            <div class="login-page">
                <div class="login-card-glass">
                    <div class="login-brand">
                        <h1>Aviation<span>Hub</span></h1>
                        <p>FLIGHT MANAGEMENT SYSTEM</p>
                    </div>

                    <form id="login-form" class="login-form">
                        <div class="field-group">
                            <label>IDENTIFICAÇÃO (E-MAIL)</label>
                            <input type="email" id="email" required placeholder="piloto@hub.com" autocomplete="email">
                        </div>

                        <div class="field-group">
                            <label>CHAVE DE ACESSO</label>
                            <input type="password" id="password" required placeholder="••••••••" autocomplete="current-password">
                        </div>

                        <button type="submit" id="btn-login" class="btn-submit-glass">
                            ENTRAR
                        </button>
                    </form>

                    <div id="login-message" class="status-message"></div>
                    
                    <div class="login-options">
                        <a href="/register">SOLICITAR ACESSO</a>
                        <span class="sep">/</span>
                        <a href="#/recovery">REDEFINIR SENHA</a>
                    </div>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        const loginForm = document.getElementById('login-form');
        const loginBtn = document.getElementById('btn-login');
        const messageDiv = document.getElementById('login-message');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // UI Feedback
            loginBtn.disabled = true;
            loginBtn.innerText = "Validando credenciais...";

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Chama o serviço de autenticação
                const session = await AuthService.login(email, password);
                
                // Proteção contra valores undefined para evitar erro de toUpperCase
                const roleDisplay = (session && session.role) ? session.role.toUpperCase() : "USUÁRIO";

                messageDiv.className = "status-message success";
                messageDiv.innerText = `SISTEMA LIBERADO: ${roleDisplay}`;

                // Redirecionamento baseado na Role conforme lógica do AuthService
                setTimeout(() => {
                    if (session.role === 'admin_master' || session.role === 'admin_hangar') {
                        window.navigate('/dashboard');
                    } else {
                        window.navigate('/');
                    }
                }, 1000);

            } catch (error) {
                // Captura a mensagem de erro com fallback para evitar falha no toUpperCase
                const errorText = (error && error.message) ? error.message.toUpperCase() : "FALHA NA AUTENTICAÇÃO";
                
                messageDiv.className = "status-message error";
                messageDiv.innerText = `ERRO: ${errorText}`;
                
                loginBtn.disabled = false;
                loginBtn.innerText = "ENTRAR";
            }
        });
    }
};

export default LoginView;