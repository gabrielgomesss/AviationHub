import { AuthService } from '../services/authservice.js';
import { PilotService } from '../services/pilothubservice.js';

const PilotHub = {
    state: {
        activeTab: 'meu-perfil',
        pilotos: [],
        selectedPilot: null,
        tempPhotoBase64: null,
        isProfileActive: true // Estado local do toggle
    },

    render: async () => {
        const user = AuthService.getUser();
        if (!user) return `<div class="error-state-light">Usuário não autenticado.</div>`;

        let content = '';

        if (PilotHub.state.activeTab === 'meu-perfil') {
            const profile = await PilotService.getPilotProfile(user.uid) || {};
            PilotHub.state.isProfileActive = profile.active !== undefined ? profile.active : true;
            content = PilotHub.renderPerfil(profile, user);
        } else if (PilotHub.state.activeTab === 'lista-pilotos') {
            // Busca e filtra apenas pilotos ativos
            const allPilots = await PilotService.getAllPilots() || [];
            PilotHub.state.pilotos = allPilots.filter(p => p.active === true);
            content = PilotHub.renderLista();
        } else if (PilotHub.state.activeTab === 'detalhes') {
            content = PilotHub.renderDetalhes(PilotHub.state.selectedPilot);
        }

        return `
            <div id="app-navbar"></div>
            <div class="hangar-detail-page-light">
                <div class="hangar-view-container-light">
                    <div class="page-header-block" style="text-align: center; margin-bottom: 25px;">
                        <h2 style="font-size: 2rem;">PilotHub</h2>
                        <p class="subtitle-light">Conectando a Aviação</p>
                    </div>

                    ${PilotHub.state.activeTab !== 'detalhes' ? `
                        <div class="tabs-navigation" style="display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; justify-content: center;">
                            <button id="btn-tab-perfil" class="tab-btn" 
                                    style="padding: 12px 20px; border: none; background: transparent; font-weight: 800; cursor: pointer;
                                    color: ${PilotHub.state.activeTab === 'meu-perfil' ? '#10b981' : '#94a3b8'};
                                    border-bottom: 3px solid ${PilotHub.state.activeTab === 'meu-perfil' ? '#10b981' : 'transparent'};">
                                MEU PERFIL
                            </button>
                            <button id="btn-tab-lista" class="tab-btn" 
                                    style="padding: 12px 20px; border: none; background: transparent; font-weight: 800; cursor: pointer;
                                    color: ${PilotHub.state.activeTab === 'lista-pilotos' ? '#10b981' : '#94a3b8'};
                                    border-bottom: 3px solid ${PilotHub.state.activeTab === 'lista-pilotos' ? '#10b981' : 'transparent'};">
                                EXPLORAR
                            </button>
                        </div>
                    ` : `
                        <button id="btn-back-hub" style="margin-bottom:20px; border:none; background:#f1f5f9; padding:8px 15px; border-radius:12px; font-weight:700; color:#64748b; cursor:pointer; display:flex; align-items:center; gap:8px;">
                           <span>←</span> Voltar
                        </button>
                    `}

                    <div id="tab-content">${content}</div>
                </div>
            </div>
        `;
    },

    renderPerfil: (p, user) => {
        const photo = p.photoURL || user.photoURL || 'https://via.placeholder.com/150';
        const isActive = PilotHub.state.isProfileActive;

        return `
        <div class="form-section">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 15px 20px; border-radius: 18px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                <div>
                    <span style="display: block; font-weight: 800; color: white; font-size: 0.9rem;">Visibilidade do Perfil</span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">${isActive ? 'Visível na listagem pública' : 'Oculto para outros pilotos'}</span>
                </div>
                <label class="switch">
                    <input type="checkbox" id="pilot-active-toggle" ${isActive ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>

            <div style="text-align: center; margin-bottom: 25px;">
                <div style="position: relative; display: inline-block;">
                    <img id="profile-preview" src="${photo}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #10b981;">
                    <label for="photo-upload" style="position: absolute; bottom: 0; right: 0; background: #10b981; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid white;">
                        📷
                    </label>
                    <input type="file" id="photo-upload" accept="image/*" style="display: none;">
                </div>
            </div>

            <div class="input-block">
                <label class="field-label">NOME DE EXIBIÇÃO</label>
                <input type="text" id="pilot-displayName" class="input-field-light" value="${p.displayName || user.displayName || ''}">
            </div>
            
            <div class="input-block" style="margin-top: 15px;">
                <label class="field-label">TOTAL DE HORAS DE VOO</label>
                <input type="text" id="pilot-totalHours" class="input-field-light" value="${p.totalHours?.toLocaleString('pt-BR') || 0}" placeholder="Ex: 1.500">
            </div>

            <div class="input-block" style="margin-top: 15px;">
                <label class="field-label">CONTATOS</label>
                <div style="display: grid; gap: 10px;">
                    <input type="email" id="pilot-email" class="input-field-light" value="${p.email || user.email || ''}" placeholder="E-mail">
                    <input type="tel" id="pilot-phone" class="input-field-light" value="${p.phone || ''}" placeholder="Telefone">
                    <input type="tel" id="pilot-whatsapp" class="input-field-light" value="${p.whatsapp || ''}" placeholder="WhatsApp">
                </div>
            </div>

            <div class="input-block" style="margin-top: 15px;">
                <label class="field-label">EXPERIÊNCIA E QUALIFICAÇÕES</label>
                <textarea id="pilot-experience" class="input-field-light" style="height: 100px;">${p.aircraftExperience || ''}</textarea>
            </div>

            <button id="save-profile-btn" class="btn-primary-emerald-bold" style="width: 100%; margin-top: 30px;">
                SALVAR ALTERAÇÕES
            </button>
        </div>
    `},

    renderLista: () => `
        <div class="services-list-wrapper">
            ${PilotHub.state.pilotos.length === 0 ? '<p style="text-align:center; color:#94a3b8; padding:40px;">Nenhum piloto ativo no momento.</p>' : ''}
            ${PilotHub.state.pilotos.map(p => `
                <div class="service-selection-card pilot-card-click" data-uid="${p.uid}" style="cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${p.photoURL || 'https://via.placeholder.com/50'}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover;">
                        <div style="flex: 1;">
                            <h4 style="margin:0; color:white; font-weight: 800;">${p.displayName || 'Piloto'}</h4>
                            <p style="margin:0; font-size: 0.8rem; color: #10b981; font-weight: 700;">${p.totalHours?.toLocaleString('pt-BR') || 0} Horas</p>
                        </div>
                        <span style="color: #cbd5e1;">➔</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `,

    renderDetalhes: (p) => {
        const cleanPhone = p.phone?.replace(/\D/g, '');
        const cleanWhatsApp = p.whatsapp?.replace(/\D/g, '');

        return `
        <div style="text-align: center;">
            <img src="${p.photoURL || 'https://via.placeholder.com/150'}" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 5px solid #10b981; margin-bottom: 15px;">
            <h2 style="margin:0; color:#1e293b; font-weight: 800;">${p.displayName}</h2>
            <div style="background: #ecfdf5; color: #059669; display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.9rem; margin-top: 8px;">
                ${p.totalHours?.toLocaleString('pt-BR')} Horas de Voo
            </div>
            
            <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 24px; margin-top: 25px; border: 1px solid #e2e8f0;">
                <h4 style="margin-bottom: 8px; color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Experiência</h4>
                <p style="color: #475569; line-height: 1.5; white-space: pre-wrap; font-size: 0.95rem;">${p.aircraftExperience || 'Detalhes não informados.'}</p>
            </div>

            <div style="margin-top: 30px;">
                <h4 style="color: #1e293b; font-weight: 800; margin-bottom: 15px; font-size: 1rem;">Canais de Contato</h4>
                <div style="display: flex; justify-content: center; gap: 15px;">
                    ${p.email ? `<a href="mailto:${p.email}" class="contact-icon-card">✉️</a>` : ''}
                    ${p.phone ? `<a href="tel:${cleanPhone}" class="contact-icon-card">📞</a>` : ''}
                    ${p.whatsapp ? `<a href="https://wa.me/55${cleanWhatsApp}" target="_blank" class="contact-icon-card" style="background:#25D366;"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style="width:28px; filter:brightness(0) invert(1);"></a>` : ''}
                </div>
            </div>
        </div>
    `},

    after_render: async () => {
        document.getElementById('btn-tab-perfil')?.addEventListener('click', () => { PilotHub.state.activeTab = 'meu-perfil'; PilotHub.refresh(); });
        document.getElementById('btn-tab-lista')?.addEventListener('click', () => { PilotHub.state.activeTab = 'lista-pilotos'; PilotHub.refresh(); });
        document.getElementById('btn-back-hub')?.addEventListener('click', () => { PilotHub.state.activeTab = 'lista-pilotos'; PilotHub.refresh(); });

        document.querySelectorAll('.pilot-card-click').forEach(card => {
            card.onclick = () => {
                const uid = card.getAttribute('data-uid');
                PilotHub.state.selectedPilot = PilotHub.state.pilotos.find(p => p.uid === uid);
                PilotHub.state.activeTab = 'detalhes';
                PilotHub.refresh();
            };
        });

        const fileInput = document.getElementById('photo-upload');
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('profile-preview').src = ev.target.result;
                    PilotHub.state.tempPhotoBase64 = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Toggle listener
        const activeToggle = document.getElementById('pilot-active-toggle');
        if (activeToggle) {
            activeToggle.onchange = (e) => {
                PilotHub.state.isProfileActive = e.target.checked;
            };
        }

        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const user = AuthService.getUser();
                let hoursValue = document.getElementById('pilot-totalHours').value.replace(/\./g, '').replace(',', '.');
                
                const profileData = {
                    displayName: document.getElementById('pilot-displayName').value,
                    totalHours: parseFloat(hoursValue || 0),
                    email: document.getElementById('pilot-email').value,
                    phone: document.getElementById('pilot-phone').value,
                    whatsapp: document.getElementById('pilot-whatsapp').value,
                    aircraftExperience: document.getElementById('pilot-experience').value,
                    photoURL: PilotHub.state.tempPhotoBase64 || document.getElementById('profile-preview').src,
                    active: PilotHub.state.isProfileActive // NOVO CAMPO
                };

                try {
                    saveBtn.disabled = true;
                    saveBtn.innerText = "SALVANDO...";
                    await PilotService.savePilotProfile(user.uid, profileData);
                    alert("Perfil atualizado!");
                    PilotHub.state.tempPhotoBase64 = null;
                } catch (e) {
                    alert("Erro: " + e.message);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerText = "SALVAR ALTERAÇÕES";
                }
            };
        }
    },

    refresh: async () => {
        const viewport = document.getElementById('app-viewport');
        if (viewport) {
            viewport.innerHTML = await PilotHub.render();
            await PilotHub.after_render();
        }
    }
};

export default PilotHub;