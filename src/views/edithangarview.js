import { HangarService } from '../services/hangarservice.js';
import Navbar from '../../components/navbar.js';

const EditHangarView = {

    render: async () => `
        ${Navbar.render()}

        <div style="padding:20px;">
            <h2>Editar Hangar</h2>

            <form id="edit-form">
                <input type="text" id="nome" placeholder="Nome do Hangar" required />
                <input type="text" id="icao" placeholder="ICAO" required />

                <h3>Serviços</h3>
                <div id="services"></div>

                <button type="button" id="add-service">Adicionar Serviço</button>
                <br/><br/>

                <button type="submit">Salvar</button>
                <p id="msg"></p>
            </form>
        </div>
    `,

    after_render: async () => {
        Navbar.after_render();

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        const nomeInput = document.getElementById('nome');
        const icaoInput = document.getElementById('icao');
        const servicesDiv = document.getElementById('services');
        const msg = document.getElementById('msg');

        const hangar = await HangarService.getHangarById(id);

        nomeInput.value = hangar.nome;
        icaoInput.value = hangar.icao;

        const renderService = (s = { nome: '', preco_produto: '' }) => {
            const div = document.createElement('div');

            div.innerHTML = `
                <input type="text" class="service-name" value="${s.nome}" />
                <input type="text" class="service-price" value="${s.preco_produto}" />
                <button type="button" class="remove">Remover</button>
                <hr/>
            `;

            div.querySelector('.remove').onclick = () => div.remove();

            servicesDiv.appendChild(div);
        };

        hangar.servicos.forEach(renderService);

        document.getElementById('add-service').onclick = () => renderService();

        document.getElementById('edit-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const serviceNames = document.querySelectorAll('.service-name');
            const servicePrices = document.querySelectorAll('.service-price');

            const servicos = [];

            for (let i = 0; i < serviceNames.length; i++) {
                const nome = serviceNames[i].value;

                const preco = parseFloat(
                    servicePrices[i].value
                        .replace('.', '')
                        .replace(',', '.')
                );

                if (!nome || isNaN(preco)) {
                    msg.innerText = "Erro nos serviços";
                    return;
                }

                servicos.push({ nome, preco_produto: preco });
            }

            try {
                await HangarService.updateHangar(id, {
                    nome: nomeInput.value,
                    icao: icaoInput.value,
                    servicos
                });

                msg.style.color = "green";
                msg.innerText = "Atualizado com sucesso!";
            } catch (err) {
                msg.style.color = "red";
                msg.innerText = err.message;
            }
        });
    }
};

export default EditHangarView;