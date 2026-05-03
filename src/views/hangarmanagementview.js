import { HangarService } from '../services/hangarservice.js';

const HangarManagementView = {
    render: async () => `
        <div id="app-navbar"></div>
        <div class="hangar-page-layout">
            <div class="page-overlay" onclick="window.history.back()"></div>
            <div class="hangar-container-fluid">
                
                <div class="page-header-block" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h2>Meus Hangares</h2>
                        <p class="subtitle-light">Suas unidades cadastradas</p>
                    </div>
                    <button class="btn-primary-emerald-bold" style="width: auto; padding: 10px 20px; font-size: 0.9rem;" 
                            onclick="window.navigate('/create-hangar')">+ NOVO</button>
                </div>

                <div id="hangares-list" class="standard-grid" style="margin-top: 25px;">
                    <div class="loading-state">Sincronizando com o sistema...</div>
                </div>
            </div>
        </div>
    `,

    after_render: async () => {
        const container = document.getElementById('hangares-list');
        try {
            const hangares = await HangarService.getMyHangares();
            if (!hangares || hangares.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;">Nenhum hangar encontrado.</div>`;
                return;
            }

            container.innerHTML = hangares.map(h => `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3 style="margin:0; font-size:1.1rem; color:#1e293b;">${h.nome}</h3>
                            <span style="font-size:0.75rem; font-weight:800; color:#10b981;">ICAO: ${h.icao}</span>
                        </div>
                        <button class="btn-edit-pill" onclick="window.navigate('/edit-hangar?id=${h.id}')" 
                                style="border:1px solid #10b981; color:#10b981; background:none; padding:8px 16px; border-radius:12px; font-weight:800; cursor:pointer;">
                            EDITAR
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<div style="color:red;">Erro ao carregar hangares.</div>`;
        }
    }
};
export default HangarManagementView;