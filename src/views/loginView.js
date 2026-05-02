// src/views/LoginView.js
import { AuthService } from '../services/auth-service.js';

const LoginView = {
    render: async () => {
        return `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #121212;">
                <div style="background: #1e1e1e; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); width: 100%; max-width: 400px; border: 1px solid #333;">
                    <h2 style="color: #4ecca3; text-align: center; margin-bottom: 25px; font-family: sans-serif;">HangarHub Login</h2>
                    
                    <form id="login-form">
                        <div style="margin-bottom: 15px;">
                            <label style="color: #bbb; display: block; margin-bottom: 5px;">E-mail</label>
                            <input type="email" id="login-email" placeholder="seu@email.com" required 
                                style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: white; box-sizing: border-box;">
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <label style="color: #bbb; display: block; margin-bottom: 5px;">Senha</label>
                            <input type="password" id="login-password" placeholder="******" required 
                                style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: white; box-sizing: border-box;">
                        </div>

                        <button type="submit" style="width: 100%; padding: 12px; border-radius: 6px; border: none; background: #4ecca3; color: #121212; font-weight: bold; cursor: pointer; transition: 0.3s;">
                            Entrar no Sistema
                        </button>
                    </form>
                    <p id="login-error" style="color: #ff4d4d; text-align: center; margin-top: 15px; font-size: 0.9rem; display: none;"></p>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('login-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const user = await AuthService.login(email, password);
                
                // Busca o papel (role) do usuário no Firestore antes de decidir para onde ir
                const role = await AuthService.getUserRole(user.uid);
                console.log("Usuário logado com papel:", role);

                if (role === 'admin_hangar' || role === 'admin_master') {
                    window.navigate('/dashboard');
                } else {
                    window.navigate('/'); // Pilotos vão para o mapa
                }

            } catch (error) {
                errorMsg.innerText = "Falha no login: Verifique suas credenciais.";
                errorMsg.style.display = 'block';
            }
        });
    }
};

export default LoginView;