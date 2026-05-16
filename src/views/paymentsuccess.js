import { AuthService } from '../services/authservice.js';

const PaymentSuccessView = {
    render: async () => `
        <div class="full-page-auth-container" style="display: flex; align-items: center; justify-content: center; height: 80vh;">
            <div class="auth-card" style="text-align: center; padding: 40px;">
                <div id="loading-icon" style="font-size: 4rem; margin-bottom: 20px;">⏳</div>
                <h2 id="status-title" style="color: #1e293b; font-weight: 800;">Processando seu acesso...</h2>
                <p id="status-desc" style="color: #64748b; margin-top: 10px;">
                    Estamos confirmando seu pagamento e configurando sua conta. Não feche esta página.
                </p>
                <div id="error-container" style="display: none; margin-top: 20px;">
                    <button id="btn-retry" class="btn-primary-emerald-bold" style="width: 100%;">Tentar Novamente</button>
                </div>
            </div>
        </div>
    `,

    after_render: async () => {
        const title = document.getElementById('status-title');
        const desc = document.getElementById('status-desc');
        const icon = document.getElementById('loading-icon');
        const errorContainer = document.getElementById('error-container');

        // 1. Pega os dados salvos antes do redirecionamento do Stripe
        const pendingDataRaw = localStorage.getItem('pending_user');
        
        if (!pendingDataRaw) {
            icon.innerText = "❌";
            title.innerText = "Dados não encontrados";
            desc.innerText = "Não encontramos dados de registro pendentes. Se você já pagou, entre em contato com o suporte.";
            return;
        }

        const userData = JSON.parse(pendingDataRaw);

        try {
            // 2. Realiza o registro oficial no Firebase Auth e Firestore
            // O AuthService.register já cuida de criar o UID e o documento no Firestore
            await AuthService.register(userData.email, userData.password, {
                nome: userData.nome,
                role: userData.role
            });

            // 3. Sucesso total
            icon.innerText = "✅";
            title.innerText = "Pagamento Confirmado!";
            desc.innerText = "Sua conta foi criada com sucesso. Redirecionando para o painel...";

            // 4. Limpa o storage e redireciona após 3 segundos
            localStorage.removeItem('pending_registration');
            
            setTimeout(() => {
                window.location.hash = '#/';
                window.location.reload(); // Recarrega para atualizar o estado do usuário no app
            }, 3000);

        } catch (err) {
            console.error("Erro ao finalizar registro:", err);
            icon.innerText = "⚠️";
            title.innerText = "Erro ao criar conta";
            desc.innerText = "Seu pagamento foi aprovado, mas houve um erro técnico ao criar seu acesso: " + err.message;
            
            errorContainer.style.display = "block";
            document.getElementById('btn-retry').onclick = () => window.location.reload();
        }
    }
};

export default PaymentSuccessView;