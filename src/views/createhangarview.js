import { HangarService } from "../services/hangarservice.js";
import { AuthService } from "../services/authservice.js";

export default {

    async render() {
        return `
            <div>
                <h2>Criar Hangar</h2>

                <label>Nome do Hangar:</label>
                <input type="text" id="nome"/>

                <br/><br/>

                <label>ICAO:</label>
                <input type="text" id="icao"/>

                <br/><br/>

                <h3>Serviços</h3>

                <div id="servicosContainer"></div>

                <button id="addServicoBtn">+ Adicionar serviço</button>

                <br/><br/>

                <button id="criarHangarBtn">Criar Hangar</button>
            </div>
        `;
    },

    async after_render() {

        const container = document.getElementById("servicosContainer");

        // 🔥 CRIAR LINHA DE SERVIÇO
        const criarServico = () => {

            const div = document.createElement("div");
            div.style.marginBottom = "10px";

            div.innerHTML = `
                <input type="text" class="nomeServico" placeholder="Nome do serviço"/>

                <input type="number" class="precoServico" placeholder="Preço"/>

                <select class="tipoServico">
                    <option value="fixo">Fixo</option>
                    <option value="diaria">Diária</option>
                </select>

                <button class="removerServico">X</button>
            `;

            container.appendChild(div);

            div.querySelector(".removerServico").addEventListener("click", () => {
                div.remove();
            });
        };

        // 🔥 ADICIONAR PRIMEIRO SERVIÇO
        criarServico();

        document.getElementById("addServicoBtn")
            .addEventListener("click", criarServico);

        // 🔥 CRIAR HANGAR
        document.getElementById("criarHangarBtn")
            .addEventListener("click", async () => {

                try {

                    const user = AuthService.getCurrentUser();

                    if (!user) {
                        alert("Usuário não autenticado");
                        return;
                    }

                    const nome = document.getElementById("nome").value;
                    const icao = document.getElementById("icao").value.toUpperCase();

                    const servicosElements = document.querySelectorAll("#servicosContainer > div");

                    const servicos = Array.from(servicosElements).map(div => {

                        return {
                            nome: div.querySelector(".nomeServico").value,
                            preco_produto: parseFloat(div.querySelector(".precoServico").value),
                            tipo: div.querySelector(".tipoServico").value
                        };
                    });

                    const hangar = {
                        nome,
                        icao,
                        servicos,
                        ownerId: user.uid
                    };

                    await HangarService.createHangar(hangar);

                    alert("Hangar criado com sucesso!");

                    window.navigate("/");

                } catch (err) {
                    console.error(err);
                    alert("Erro ao criar hangar");
                }
            });
    }
};