import { HangarService } from '../services/hangarservice.js';
import Navbar from '../../components/navbar.js';

const HangarManagementView = {

    render: async () => `
        ${Navbar.render()}

        <div style="padding:20px;">
            <h2>Meus Hangares</h2>
            <div id="hangares-list">Carregando...</div>
        </div>
    `,

    after_render: async () => {
        Navbar.after_render();

        const container = document.getElementById('hangares-list');

        try {
            const hangares = await HangarService.getMyHangares();

            if (!hangares.length) {
                container.innerHTML = "<p>Nenhum hangar encontrado.</p>";
                return;
            }

            container.innerHTML = hangares.map(h => `
                <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                    <h3>${h.nome}</h3>
                    <p><b>ICAO:</b> ${h.icao}</p>

                    <ul>
                        ${h.servicos.map(s => `
                            <li>${s.nome} - R$ ${s.preco_produto}</li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');

        } catch (err) {
            container.innerHTML = `<p style="color:red;">Erro ao carregar hangares</p>`;
        }
    }
};

export default HangarManagementView;