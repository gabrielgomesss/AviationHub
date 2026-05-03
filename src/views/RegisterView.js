import { AuthService } from '../services/authservice.js';

const RegisterView = {

    render: async () => `
        <div class="full-page-auth-container">
            <div class="auth-card">
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">🚀</div>
                    <h2 style="font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0;">Criar Conta</h2>
                    <p style="color: #64748b; font-size: 0.9rem; margin-top: 5px;">Inicie sua jornada no AviationHub</p>
                </div>

                <form id="register-form" style="display: grid; gap: 15px;">
                    <div class="input-block">
                        <label class="field-label" style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">NOME COMPLETO</label>
                        <input type="text" id="name" class="input-field-light" placeholder="Seu nome" required style="margin-top: 5px;"/>
                    </div>

                    <div class="input-block">
                        <label class="field-label" style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">E-MAIL</label>
                        <input type="email" id="email" class="input-field-light" placeholder="seu@email.com" required style="margin-top: 5px;"/>
                    </div>

                    <div class="input-block">
                        <label class="field-label" style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">SENHA</label>
                        <input type="password" id="password" class="input-field-light" placeholder="Mínimo 6 caracteres" required style="margin-top: 5px;"/>
                    </div>

                    <div class="input-block">
                        <label class="field-label" style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">TIPO DE USUÁRIO</label>
                        <select id="role" class="input-field-light" required style="margin-top: 5px;">
                            <option value="">Selecione o tipo</option>
                            <option value="admin_hangar">Administrador de Hangar</option>
                            <option value="piloto">Piloto</option>
                        </select>
                    </div>

                    <button type="submit" class="btn-primary-emerald-bold" style="margin-top: 15px;">
                        CRIAR MINHA CONTA
                    </button>
                    
                    <span id="error" style="color: #ef4444; font-size: 0.85rem; text-align: center; font-weight: 600;"></span>
                </form>

                <div style="margin-top: 25px; text-align: center;">
                    <p style="color: #64748b; font-size: 0.85rem;">
                        Já tem uma conta? 
                        <span id="go-login" style="color: #10b981; font-weight: 800; cursor: pointer;">Fazer login</span>
                    </p>
                </div>

                <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    <p style="color: #94a3b8; font-size: 0.7rem; font-style: italic; line-height: 1.4; margin: 0;">
                        "Criado e desenvolvido por Gabriel Ribeiro."
                    </p>
                </div>
            </div>
        </div>
    `,

    after_render: async () => {
        const form = document.getElementById('register-form');
        const error = document.getElementById('error');
        const goLogin = document.getElementById('go-login');

        goLogin.addEventListener('click', (e) => {
            e.preventDefault();
            window.navigate('/login');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            if (!role) {
                error.innerText = "Selecione um tipo de usuário";
                return;
            }

            try {
                await AuthService.register(name, email, password, role);
                window.navigate('/');
            } catch (err) {
                error.innerText = err.message;
            }
        });
    }
};

export default RegisterView;