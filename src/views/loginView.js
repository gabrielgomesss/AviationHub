import { AuthService } from '../services/authservice.js';

const LoginView = {
    render: async () => {
        return `
            <div class="login-container">
                <div class="login-card-glass">
                    <div class="login-brand">
                        <h1>AviationHub</h1>
                        <p>Flight Control System</p>
                    </div>

                    <form id="login-form">
                        <div class="field-group">
                            <label for="email">E-mail do Piloto</label>
                            <input type="email" id="email" required placeholder="exemplo@hangar.com">
                        </div>

                        <div class="field-group">
                            <label for="password">Senha de Acesso</label>
                            <input type="password" id="password" required placeholder="••••••••">
                        </div>

                        <button type="submit" id="btn-login" class="btn-submit-glass">
                            Acessar Sistema
                        </button>
                    </form>

                    <div id="login-message"></div>
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
            loginBtn.innerText = "Sincronizando Dados...";
            messageDiv.style.color = "var(--text-muted)";
            messageDiv.innerText = "Validando credenciais...";

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Chama o login consolidado que já retorna a role (resolvendo erro linha 43)
                const session = await AuthService.login(email, password);
                
                messageDiv.style.color = "var(--primary-emerald)";
                messageDiv.innerText = `Acesso autorizado: ${session.role}`;

                // Redirecionamento baseado na Role
                setTimeout(() => {
                    if (session.role === 'admin_master' || session.role === 'admin_hangar') {
                        window.navigate('/dashboard');
                    } else {
                        window.navigate('/');
                    }
                }, 800);

            } catch (error) {
                messageDiv.style.color = "#ef4444";
                messageDiv.innerText = "Falha na autenticação: " + error.message;
                loginBtn.disabled = false;
                loginBtn.innerText = "EFETUAR DECOLAGEM";
            }
        });
    }
};

export default LoginView;