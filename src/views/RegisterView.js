import { AuthService } from '../services/auth-service.js';

const RegisterView = {
    render: async () => {
        return `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #121212; padding: 20px;">
                <div style="background: #1e1e1e; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); width: 100%; max-width: 450px; border: 1px solid #333;">
                    <h2 style="color: #4ecca3; text-align: center; margin-bottom: 25px; font-family: sans-serif;">Criar Nova Conta</h2>
                    
                    <form id="register-form">
                        <div style="margin-bottom: 15px;">
                            <label style="color: #bbb; display: block; margin-bottom: 5px;">E-mail</label>
                            <input type="email" id="reg-email" placeholder="exemplo@hangar.com" required 
                                style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: white; box-sizing: border-box;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="color: #bbb; display: block; margin-bottom: 5px;">Senha</label>
                            <input type="password" id="reg-password" placeholder="Mínimo 6 caracteres" required 
                                style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: white; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="color: #bbb; display: block; margin-bottom: 8px;">Tipo de Perfil</label>
                            <select id="reg-role" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: white; cursor: pointer;">
                                <option value="piloto">Piloto</option>
                                <option value="admin_hangar">Administrador de Hangar</option>
                            </select>
                        </div>

                        <button type="submit" style="width: 100%; padding: 14px; border-radius: 6px; border: none; background: #4ecca3; color: #121212; font-weight: bold; cursor: pointer; font-size: 1rem;">
                            Finalizar Cadastro
                        </button>
                    </form>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="/login" onclick="event.preventDefault(); window.navigate('/login')" style="color: #4ecca3; text-decoration: none; font-size: 0.9rem;">Já tem uma conta? Faça login</a>
                    </div>
                    <p id="reg-error" style="color: #ff4d4d; text-align: center; margin-top: 15px; font-size: 0.9rem; display: none;"></p>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        const form = document.getElementById('register-form');
        const errorMsg = document.getElementById('reg-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';

            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role').value;

            try {
                await AuthService.register(email, password, role);
                alert("Conta criada com sucesso!");
                window.navigate(role === 'admin_hangar' ? '/dashboard' : '/');
            } catch (error) {
                console.error(error);
                errorMsg.innerText = "Erro ao cadastrar: " + error.message;
                errorMsg.style.display = 'block';
            }
        });
    }
};

export default RegisterView;