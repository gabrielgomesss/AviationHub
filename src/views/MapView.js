import { AuthService } from '../services/auth-service.js';

const MapView = {
    render: async () => {
        return `
            <div id="map-container" style="height: 100vh; width: 100%; background: #1a1a1a; position: relative; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                
                <!-- Toolbar Superior -->
                <div style="position: absolute; top: 20px; right: 20px; z-index: 1000;">
                    <button id="btn-logout" style="background: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: all 0.2s;">
                        Sair do Sistema
                    </button>
                </div>

                <!-- Painel Lateral -->
                <div style="position: absolute; top: 20px; left: 20px; z-index: 100; color: white; background: rgba(20,20,20,0.9); padding: 25px; border-radius: 15px; border: 1px solid #333; max-width: 320px; backdrop-filter: blur(10px);">
                    <h1 style="color: #4ecca3; margin: 0 0 10px 0; font-size: 1.8rem; letter-spacing: -1px;">HangarHub</h1>
                    <p style="margin: 0; color: #999; line-height: 1.5;">Obrigado por este evento. Ele contém a Luz necessária para o próximo nível. Explore as bases abaixo.</p>
                </div>

                <!-- Loader do Mapa -->
                <div id="map-loader" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">
                    <div class="spinner"></div>
                    <p style="color: #4ecca3; margin-top: 20px; font-weight: 300;">Sincronizando malha aérea...</p>
                </div>
            </div>

            <style>
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(78, 204, 163, 0.1);
                    border-top: 3px solid #4ecca3;
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                #btn-logout:hover {
                    background: #c0392b;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
                }
            </style>
        `;
    },

    after_render: async () => {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm("Deseja encerrar sua sessão atual?")) {
                    await AuthService.logout();
                }
            });
        }
    }
};

export default MapView;