// src/views/LoginView.js
import { AuthService } from '../services/AuthService.js';

export const LoginView = {
    render: async () => {
        return `
            <div class="login-container">
                <div class="login-card glass">
                    <h2 id="auth-title">Acessar Hub</h2>
                    <p id="auth-subtitle">Entre com suas credenciais aeronáuticas</p>
                    
                    <form id="auth-form">
                        <div class="input-group">
                            <label for="email">E-mail</label>
                            <input type="email" id="email" placeholder="exemplo@aviacao.com" required>
                        </div>
                        
                        <div class="input-group">
                            <label for="password">Senha</label>
                            <input type="password" id="password" placeholder="••••••••" required>
                        </div>

                        <!-- Seleção de Perfil - Visível apenas no Cadastro -->
                        <div id="role-selection" class="input-group" style="display: none;">
                            <label for="role">Tipo de Perfil</label>
                            <select id="role">
                                <option value="piloto">Piloto / Usuário</option>
                                <option value="admin_hangar">Administrador de Hangar</option>
                                <option value="admin_master">Admin Master</option>
                            </select>
                        </div>

                        <button type="submit" id="btn-auth" class="btn-primary">Entrar</button>
                    </form>

                    <div class="auth-toggle">
                        <p id="toggle-text">Não tem uma conta? <a href="#" id="link-toggle">Cadastre-se</a></p>
                    </div>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        const form = document.getElementById('auth-form');
        const linkToggle = document.getElementById('link-toggle');
        const authTitle = document.getElementById('auth-title');
        const authSubtitle = document.getElementById('auth-subtitle');
        const roleSelection = document.getElementById('role-selection');
        const btnAuth = document.getElementById('btn-auth');
        
        let isLogin = true;

        // Alternar entre Login e Cadastro
        linkToggle.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            
            if (isLogin) {
                authTitle.innerText = "Acessar Hub";
                authSubtitle.innerText = "Entre com suas credenciais aeronáuticas";
                btnAuth.innerText = "Entrar";
                roleSelection.style.display = "none";
                linkToggle.innerText = "Cadastre-se";
                document.getElementById('toggle-text').firstChild.textContent = "Não tem uma conta? ";
            } else {
                authTitle.innerText = "Criar Conta";
                authSubtitle.innerText = "Selecione seu perfil no ecossistema";
                btnAuth.innerText = "Cadastrar";
                roleSelection.style.display = "block";
                linkToggle.innerText = "Fazer Login";
                document.getElementById('toggle-text').firstChild.textContent = "Já possui conta? ";
            }
        });

        // Lógica de Submissão
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                if (isLogin) {
                    await AuthService.login(email, password);
                    alert("Login realizado com sucesso!");
                } else {
                    await AuthService.registerUser(email, password, role);
                    alert("Conta criada com sucesso como " + role + "!");
                }
                
                // Redireciona para o mapa após sucesso
                window.navigate('/');
            } catch (error) {
                console.error("Erro na autenticação:", error);
                alert("Falha na autenticação: " + error.message);
            }
        });
    }
};

export default LoginView;