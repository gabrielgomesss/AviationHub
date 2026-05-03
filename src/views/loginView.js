import { AuthService } from "../services/authservice.js";

export default {
    async render() {
        return `
            <div class="full-page-auth-container">
                <div class="auth-card">
                    
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 3.5rem; margin-bottom: 10px;">✈️</div>
                        <h2 style="font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0;">
                            AviationHub
                        </h2>
                        <p style="color: #64748b; font-size: 0.95rem; margin-top: 5px;">
                            Conecte-se para expandir seu Vaso
                        </p>
                    </div>

                    <div style="display: grid; gap: 20px;">
                        
                        <div class="input-block">
                            <label class="field-label" style="font-size: 0.75rem; font-weight: 800; color: #94a3b8;">
                                E-MAIL
                            </label>
                            <input type="email" id="login-email" class="input-field-light"
                                placeholder="seu@email.com" style="margin-top: 5px;" />
                        </div>

                        <div class="input-block">
                            <label class="field-label" style="font-size: 0.75rem; font-weight: 800; color: #94a3b8;">
                                SENHA
                            </label>
                            <input type="password" id="login-password" class="input-field-light"
                                placeholder="••••••••" style="margin-top: 5px;" />
                        </div>

                        <button id="btnLogin" class="btn-primary-emerald-bold"
                            style="margin-top: 10px; height: 50px;">
                            ENTRAR NO HANGAR
                        </button>

                    </div>

                    <div style="margin-top: 25px; text-align: center;">
                        <p style="color: #64748b; font-size: 0.9rem;">
                            Não tem uma conta?
                            <span id="link-register"
                                style="color: #10b981; font-weight: 800; cursor: pointer;">
                                Cadastre-se
                            </span>
                        </p>
                    </div>

                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                        <p style="color: #94a3b8; font-size: 0.75rem; font-style: italic; line-height: 1.4; margin: 0;">
                            "Obrigado por este evento. Ele contém a Luz que eu preciso para o meu próximo nível."
                        </p>
                    </div>

                </div>
            </div>
        `;
    },

    async after_render() {
        const btnLogin = document.getElementById("btnLogin");
        const emailInput = document.getElementById("login-email");
        const passInput = document.getElementById("login-password");
        const linkRegister = document.getElementById("link-register");

        // navegação para registro
        linkRegister.onclick = () => {
            if (window.navigate) window.navigate('/register');
            else window.location.hash = '#/register';
        };

        btnLogin.onclick = async () => {
            const email = emailInput.value;
            const password = passInput.value;

            if (!email || !password) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            try {
                btnLogin.disabled = true;
                btnLogin.innerText = "AUTENTICANDO...";

                const user = await AuthService.login(email, password);

                if (user) {
                    console.log("Usuário autenticado:", user);

                    setTimeout(() => {

                        // ✔ rota correta do seu sistema
                        if (window.navigate) {
                            window.navigate('/');
                            return;
                        }

                        // fallback SPA
                        window.location.hash = '#/';
                    }, 100);
                }

            } catch (error) {
                console.error("Erro no login:", error);

                btnLogin.disabled = false;
                btnLogin.innerText = "ENTRAR NO HANGAR";

                alert("Erro: " + error.message);
            }
        };

        // Enter submit
        [emailInput, passInput].forEach(input => {
            input.onkeypress = (e) => {
                if (e.key === "Enter") btnLogin.click();
            };
        });
    }
};