import { AuthService } from "../services/authservice.js";

export default {
    async render() {
        return `
            <div class="full-page-auth-container">
                <div class="auth-card">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 3.5rem; margin-bottom: 10px;">✈️</div>
                        <h2 style="font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0;">AviationHub</h2>
                    </div>
                    <div style="display: grid; gap: 20px;">
                        <div class="input-block">
                            <label class="field-label" style="font-size: 0.75rem; font-weight: 800; color: #94a3b8;">E-MAIL</label>
                            <input type="email" id="login-email" class="input-field-light" placeholder="seu@email.com" />
                        </div>
                        <div class="input-block">
                            <label class="field-label" style="font-size: 0.75rem; font-weight: 800; color: #94a3b8;">SENHA</label>
                            <input type="password" id="login-password" class="input-field-light" placeholder="••••••••" />
                        </div>
                        <button id="btnLogin" class="btn-primary-emerald-bold" style="height: 50px;">ENTRAR NO HANGAR</button>
                    </div>
                    <div style="margin-top: 25px; text-align: center;">
                        <p style="color: #64748b; font-size: 0.9rem;">Não tem uma conta? <span id="link-register" style="color: #10b981; font-weight: 800; cursor: pointer;">Cadastre-se</span></p>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        const btnLogin = document.getElementById("btnLogin");
        const linkRegister = document.getElementById("link-register");

        // Correção da rota de registro para SPA
        linkRegister.onclick = () => {
            window.location.hash = '#/register';
        };

        btnLogin.onclick = async () => {
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            if (!email || !password) return alert("Preencha todos os campos.");

            try {
                btnLogin.disabled = true;
                btnLogin.innerText = "AUTENTICANDO...";
                const user = await AuthService.login(email, password);
                if (user) {
                    // Redireciona para o mapa usando hash
                    window.location.hash = '#/';
                    if (window.location.hash === '#/') {
                // Se já estiver no hash certo mas não mudou, recarregamos
                window.location.reload();
            }
                }
            } catch (error) {
                btnLogin.disabled = false;
                btnLogin.innerText = "ENTRAR NO HANGAR";
                alert("Erro: " + error.message);
            }
        };
    }
};