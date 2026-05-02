import { AuthService } from '../services/authservice.js';

const RegisterView = {

    render: async () => `
        <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#121212;">
            <form id="register-form" style="display:flex;flex-direction:column;gap:10px;">
                <input type="text" id="name" placeholder="Nome" required />
                <input type="email" id="email" placeholder="Email" required />
                <input type="password" id="password" placeholder="Senha" required />

                <select id="role" required>
                    <option value="">Selecione o tipo de usuário</option>
                    <option value="admin_hangar">Administrador de Hangar</option>
                    <option value="piloto">Piloto</option>
                </select>

                <button type="submit">Criar Conta</button>
                <span id="error" style="color:red;"></span>

                <p style="color:white;">
                    Já tem conta?
                    <a href="#" id="go-login" style="color:#4ecca3;">Fazer login</a>
                </p>
            </form>
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