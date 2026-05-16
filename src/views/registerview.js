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
                        <input type="text" id="name" class="input-field-light" placeholder="Seu nome" required />
                    </div>

                    <div class="input-block">
                        <label class="field-label" style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">E-MAIL</label>
                        <input type="email" id="email" class="input-field-light" placeholder="seu@email.com" required />
                    </div>

                    <div class="input-block">
                        <label class="field-label" style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">SENHA</label>
                        <input type="password" id="password" class="input-field-light" placeholder="Mínimo 6 caracteres" required />
                    </div>
                    <select id="role" class="input-field-light" required>
                        <option value="parceiro">Plano Parceiro (Econômico)</option>
                        <option value="piloto">Plano Piloto (Completo)</option>
                        <option value="admin_hangar">Plano Hangar (Completo)</option>
                    </select>
                    <button type="submit" id="btn-pay" class="btn-primary-emerald-bold" style="width:100%; margin-top:15px;">
                        SEGUIR PARA PAGAMENTO
                    </button>
                    <p id="error-msg" style="color:red; text-align:center;"></p>
                </form>
            </div>
        </div>
    `,

    after_render: async () => {
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-pay');
            btn.innerText = "PROCESSANDO...";
            
            const data = {
                nome: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                role: document.getElementById('role').value
            };

            try {
                // Salva dados para completar o registro após o pagamento
                localStorage.setItem('pending_user', JSON.stringify(data));
                const url = await AuthService.createCheckoutSession(data.email, data.role);
                window.location.href = url;
            } catch (err) {
                document.getElementById('error-msg').innerText = "Erro ao iniciar pagamento.";
                btn.innerText = "SEGUIR PARA PAGAMENTO";
            }
        });
    }
};

export default RegisterView;