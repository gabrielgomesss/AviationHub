import { AuthService } from '../services/authservice.js';
import { PartnerService } from '../services/partnerservice.js';

const PartnerHub = {
    state: {
        activeTab: 'lista-pilotos',
        pilotos: [],
        selectedPilot: null,
        tempPhotoBase64: null,
        isProfileActive: true 
    },

    render: async () => {
        const user = AuthService.getUser();
        if (!user) return `<div class="error-state-light">Usuário não autenticado.</div>`;

        const isPartner = user.role === 'parceiro';

        if (!isPartner && PartnerHub.state.activeTab === 'meu-perfil') {
            PartnerHub.state.activeTab = 'lista-pilotos';
        }

        let content = '';

        if (PartnerHub.state.activeTab === 'meu-perfil' && isPartner) {
            const profile = await PartnerService.getPartnerProfile(user.uid) || {};
            PartnerHub.state.isProfileActive = profile.active !== undefined ? profile.active : true;
            content = PartnerHub.renderPerfil(profile, user);
        } else if (PartnerHub.state.activeTab === 'lista-pilotos') {
            const allPartners = await PartnerService.getAllPartners() || [];
            PartnerHub.state.pilotos = allPartners.filter(p => p.active === true);
            content = PartnerHub.renderLista();
        } else if (PartnerHub.state.activeTab === 'detalhes') {
            content = PartnerHub.renderDetalhes(PartnerHub.state.selectedPilot);
        }

        // Define a ação do botão de voltar do header
        const isOnSubPage = PartnerHub.state.activeTab === 'meu-perfil' || PartnerHub.state.activeTab === 'detalhes';
        const backAction = isOnSubPage ? "id='header-back-to-list'" : "onclick='window.history.back()'";

        return `
            <div id="app-navbar"></div>
            <div class="hangar-detail-page-light">
                <div class="hangar-view-container-light">
                    
                    <div style="padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; min-height: 70px; background: white; border-radius: 20px 20px 0 0;">
                        <button ${backAction} style="background: #f1f5f9; border: none; width: 45px; height: 45px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e293b; margin-right: 15px;">
                            <span class="material-symbols-outlined" style="font-weight: 800;">
                                <svg width="16" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </span>
                        </button>
                        <div>
                            <h2 style="font-size: 1.2rem; margin: 0; color: #1e293b; font-weight: 800;">PartnerHub</h2>
                            <p style="margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 600;">Conectando a Aviação</p>
                        </div>
                    </div>

                    <div style="padding: 20px;">
                        ${PartnerHub.state.activeTab !== 'detalhes' ? `
                            <div class="tabs-navigation" style="display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; justify-content: center;">
                                
                                ${isPartner ? `
                                    <button id="btn-tab-perfil" class="tab-btn" 
                                            style="padding: 12px 20px; border: none; background: transparent; font-weight: 800; cursor: pointer;
                                            color: ${PartnerHub.state.activeTab === 'meu-perfil' ? '#10b981' : '#94a3b8'};
                                            border-bottom: 3px solid ${PartnerHub.state.activeTab === 'meu-perfil' ? '#10b981' : 'transparent'};">
                                        Meu perfil
                                    </button>
                                ` : ''}

                                <button id="btn-tab-lista" class="tab-btn" 
                                        style="padding: 12px 20px; border: none; background: transparent; font-weight: 800; cursor: pointer;
                                        color: ${PartnerHub.state.activeTab === 'lista-pilotos' ? '#10b981' : '#94a3b8'};
                                        border-bottom: 3px solid ${PartnerHub.state.activeTab === 'lista-pilotos' ? '#10b981' : 'transparent'};">
                                    Lista de parceiros
                                </button>
                            </div>
                        ` : ''}

                        <div id="tab-content">${content}</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPerfil: (p, user) => {
        const photo = p.photoURL || user.photoURL || 'https://via.placeholder.com/150';
        const isActive = PartnerHub.state.isProfileActive;

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
            ${PartnerHub.state.pilotos.length === 0 ? '<p style="text-align:center; color:#94a3b8; padding:40px;">Nenhum parceiro ativo no momento.</p>' : ''}
            ${PartnerHub.state.pilotos.map(p => `
                <div class="service-selection-card pilot-card-click" data-uid="${p.uid}" style="cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${p.photoURL || 'https://via.placeholder.com/50'}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover;">
                        <div style="flex: 1;">
                            <h4 style="margin:0; color:white; font-weight: 800;">${p.displayName || 'Parceiro'}</h4>
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
        // Listener para a seta de voltar no header (apenas quando em sub-páginas)
        document.getElementById('header-back-to-list')?.addEventListener('click', () => {
            PartnerHub.state.activeTab = 'lista-pilotos';
            PartnerHub.refresh();
        });

        document.getElementById('btn-tab-perfil')?.addEventListener('click', () => { PartnerHub.state.activeTab = 'meu-perfil'; PartnerHub.refresh(); });
        document.getElementById('btn-tab-lista')?.addEventListener('click', () => { PartnerHub.state.activeTab = 'lista-pilotos'; PartnerHub.refresh(); });

        document.querySelectorAll('.pilot-card-click').forEach(card => {
            card.onclick = () => {
                const uid = card.getAttribute('data-uid');
                PartnerHub.state.selectedPilot = PartnerHub.state.pilotos.find(p => p.uid === uid);
                PartnerHub.state.activeTab = 'detalhes';
                PartnerHub.refresh();
            };
        });

        const fileInput = document.getElementById('photo-upload');
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('profile-preview').src = ev.target.result;
                    PartnerHub.state.tempPhotoBase64 = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        const activeToggle = document.getElementById('pilot-active-toggle');
        if (activeToggle) {
            activeToggle.onchange = (e) => {
                PartnerHub.state.isProfileActive = e.target.checked;
            };
        }

        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const user = AuthService.getUser();
                
                const profileData = {
                    displayName: document.getElementById('pilot-displayName').value,
                    email: document.getElementById('pilot-email').value,
                    phone: document.getElementById('pilot-phone').value,
                    whatsapp: document.getElementById('pilot-whatsapp').value,
                    aircraftExperience: document.getElementById('pilot-experience').value,
                    photoURL: PartnerHub.state.tempPhotoBase64 || document.getElementById('profile-preview').src,
                    active: PartnerHub.state.isProfileActive
                };

                try {
                    saveBtn.disabled = true;
                    saveBtn.innerText = "SALVANDO...";
                    await PartnerService.savePartnerProfile(user.uid, profileData);
                    alert("Perfil atualizado!");
                    PartnerHub.state.tempPhotoBase64 = null;
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
            viewport.innerHTML = await PartnerHub.render();
            await PartnerHub.after_render();
        }
    }
};

export default PartnerHub;