import { HangarService } from '../services/hangarservice.js';
import Navbar from '../../components/navbar.js';

const CreateHangarView = {

    render: async () => `
        ${Navbar.render()}

        <div style="padding:20px;">
            <h2>Criar Hangar</h2>

            <form id="hangar-form">
                <input type="text" id="nome" placeholder="Nome do Hangar" required />
                <input type="text" id="icao" placeholder="ICAO (ex: SBJD)" required />

                <h3>Serviços</h3>
                <div id="services"></div>

                <button type="button" id="add-service">Adicionar Serviço</button>
                <br/><br/>

                <button type="submit">Criar Hangar</button>
                <p id="msg" style="color:red;"></p>
            </form>
        </div>
    `,

    after_render: async () => {
        Navbar.after_render();

        const servicesDiv = document.getElementById('services');
        const addServiceBtn = document.getElementById('add-service');
        const form = document.getElementById('hangar-form');
        const msg = document.getElementById('msg');

        const addServiceField = () => {
            const div = document.createElement('div');

            div.innerHTML = `
                <input type="text" placeholder="Nome do serviço" class="service-name" required />
                <input type="text" placeholder="Preço (ex: 23,50)" class="service-price" required />
                <hr/>
            `;

            servicesDiv.appendChild(div);
        };

        addServiceBtn.addEventListener('click', addServiceField);

        addServiceField();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('nome').value;
            const icao = document.getElementById('icao').value;

            const serviceNames = document.querySelectorAll('.service-name');
            const servicePrices = document.querySelectorAll('.service-price');

            const servicos = [];

            for (let i = 0; i < serviceNames.length; i++) {
                const nomeServico = serviceNames[i].value.trim();

                const rawValue = servicePrices[i].value
                    .replace(/\s/g, '')
                    .replace('.', '')
                    .replace(',', '.');

                const preco = parseFloat(rawValue);

                if (!nomeServico || isNaN(preco) || preco <= 0) {
                    msg.innerText = `Erro no serviço ${i + 1}`;
                    return;
                }

                servicos.push({
                    nome: nomeServico,
                    preco_produto: preco
                });
            }

            try {
                await HangarService.createHangar(nome, icao, servicos);
                msg.style.color = "green";
                msg.innerText = "Hangar criado com sucesso!";
            } catch (err) {
                msg.style.color = "red";
                msg.innerText = err.message;
            }
        });
    }
};

export default CreateHangarView;