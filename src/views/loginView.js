import { AuthService } from '../services/authservice.js';

const LoginView = {

    render: async () => `
        <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#121212;">
            <form id="login-form" style="display:flex;flex-direction:column;gap:10px;">
                <input type="email" id="email" placeholder="Email" required />
                <input type="password" id="password" placeholder="Senha" required />
                <button type="submit">Entrar</button>
                <span id="error" style="color:red;"></span>

                <p style="color:white; text-align:center; margin-top:10px;">
                    Não tem conta? 
                    <a href="#" id="go-register" style="color:#4ecca3;">Criar conta</a>
                </p>
            </form>
        </div>
    `,

    after_render: async () => {
        const form = document.getElementById('login-form');
        const error = document.getElementById('error');
        const goRegister = document.getElementById('go-register');

        goRegister.addEventListener('click', (e) => {
            e.preventDefault();
            window.navigate('/register');
        });

        form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    try {
        // 🔥 1. Faz login
        await AuthService.login(email, password);

        // 🔥 2. Aguarda carregar usuário completo
        await AuthService.init();

        // 🔥 3. Agora sim navega
        window.navigate('/mapa');

    } catch (err) {
        msg.innerText = err.message;
    }})}
};

export default LoginView;