import Navbar from '../../components/navbar.js';
import { HangarService } from '../services/hangarservice.js';

const HangarView = {

    render: async () => `
        <div id="app-navbar"></div>

        <div style="padding:20px;" id="hangar-container">
            Carregando...
        </div>
    `,

    after_render: async () => {
        document.getElementById('app-navbar').innerHTML = Navbar.render();
        Navbar.after_render();

        const params = new URLSearchParams(window.location.search);
        const hangarId = params.get('id');

        const container = document.getElementById('hangar-container');

        try {
            const hangar = await HangarService.getHangarById(hangarId);

            container.innerHTML = `
                <button onclick="window.history.back()">← Voltar</button>

                <h2>${hangar.nome}</h2>
                <p>ICAO: ${hangar.icao}</p>

                <h3>Serviços</h3>
                <ul>
                    ${hangar.servicos.map(s => `
                        <li>${s.nome} - R$ ${s.preco_produto}</li>
                    `).join('')}
                </ul>

                <button onclick="window.navigate('/reserva?hangarId=${hangar.id}')">
                    Reservar
                </button>
            `;
        } catch {
            container.innerHTML = "Erro ao carregar hangar";
        }
    }
};

export default HangarView;