import { AuthService } from '../services/authservice.js';
import { PilotService } from '../services/pilothubservice.js';

const PilotHub = {
    render: async () => {
        const user = AuthService.getUser();
        const profile = await PilotService.getPilotProfile(user.uid) || {};

        return `
            <div class="create-hangar-container">
                <div class="create-hangar-card">
                    <h1 class="create-hangar-title">PilotHub</h1>
                    <p class="create-hangar-subtitle">Gerencie seu perfil e currículo profissional</p>

                    <div class="pilot-profile-header">
                        <img src="${profile.photoURL || 'https://via.placeholder.com/80'}" class="pilot-avatar">
                        <div>
                            <h3 style="margin:0; color:#1e293b;">${user.displayName || 'Piloto'}</h3>
                            <p style="margin:0; color:#94a3b8; font-size:0.85rem;">${user.email}</p>
                        </div>
                    </div>

                    <form id="pilot-form">
                        <div class="input-group">
                            <label class="input-label">Horas Totais de Voo</label>
                            <input type="number" id="totalHours" class="main-input" 
                                   value="${profile.totalHours || ''}" placeholder="Ex: 172.5">
                        </div>

                        <div class="input-group">
                            <label class="input-label">Experiência por Aeronave</label>
                            <textarea id="aircraftExperience" class="main-input" 
                                      style="height: 120px; resize: none;"
                                      placeholder="C152: 100h, PA28: 72h...">${profile.aircraftExperience || ''}</textarea>
                        </div>

                        <div class="input-group">
                            <label class="input-label">URL da Foto de Perfil</label>
                            <input type="text" id="photoURL" class="main-input" 
                                   value="${profile.photoURL || ''}" placeholder="https://link-da-sua-foto.jpg">
                        </div>

                        <button type="submit" class="btn-create-hangar">
                            Atualizar Currículo
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        const user = AuthService.getUser();
        const form = document.getElementById('pilot-form');

        form.onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                totalHours: document.getElementById('totalHours').value,
                aircraftExperience: document.getElementById('aircraftExperience').value,
                photoURL: document.getElementById('photoURL').value,
                displayName: user.displayName,
                email: user.email
            };

            try {
                await PilotService.savePilotProfile(user.uid, data);
                alert("Obrigado por este evento. Ele contém a Luz que eu preciso para o meu próximo nível.");
                window.location.reload();
            } catch (err) {
                console.error("Erro ao atualizar perfil:", err);
                alert("Erro ao atualizar: " + err.message);
            }
        };
    }
};

export default PilotHub;