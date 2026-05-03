import { HangarService } from '../services/hangarservice.js';

const HangarManagementView = {

    render: async () => `
        <div style="padding:20px;">
            <h2>Meus Hangares</h2>
            <div id="hangares-list">Carregando...</div>
        </div>
    `,

    after_render: async () => {

        const container = document.getElementById('hangares-list');

        try {
            const hangares = await HangarService.getMyHangares();

            if (!hangares || hangares.length === 0) {
                container.innerHTML = "<p>Nenhum hangar encontrado.</p>";
                return;
            }

            container.innerHTML = hangares.map(h => `
                <div style="
                    border:1px solid #ccc;
                    padding:15px;
                    margin-bottom:15px;
                    border-radius:8px;
                ">
                    <h3>${h.nome}</h3>
                    <p><b>ICAO:</b> ${h.icao}</p>

                    <div style="margin-top:10px;">
                        <b>Serviços:</b>
                        <ul>
                            ${h.servicos.map(s => `
                                <li>
                                    ${s.nome} - R$ ${s.preco_produto}
                                    (${s.tipo === 'diaria' ? 'Diária' : 'Fixo'})
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div style="margin-top:10px;">
                        <button onclick="window.navigate('/edit-hangar?id=${h.id}')">
                            Editar
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error(err);
            container.innerHTML = `
                <p style="color:red;">
                    Erro ao carregar hangares
                </p>
            `;
        }
    }
};

export default HangarManagementView;