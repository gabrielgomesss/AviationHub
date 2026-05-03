import { HangarService } from "../services/hangarservice.js";

export default {

    async render() {
        return `
            <div>
                <h2>Editar Hangar</h2>
                <div id="editContainer">Carregando...</div>
            </div>
        `;
    },

    async after_render() {

        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");

        const hangar = await HangarService.getHangarById(id);

        if (!hangar) {
            document.getElementById("editContainer").innerHTML = "Hangar não encontrado";
            return;
        }

        document.getElementById("editContainer").innerHTML = `
            <input id="nome" value="${hangar.nome}" placeholder="Nome do hangar"/>

            <h3>Serviços</h3>

            <div id="servicosContainer"></div>

            <button id="addServico">+ Adicionar serviço</button>

            <br/><br/>

            <button id="salvar">Salvar alterações</button>
        `;

        const container = document.getElementById("servicosContainer");

        // 🔥 Criar linha de serviço
        const criarServico = (s = {}) => {

            const div = document.createElement("div");
            div.style.marginBottom = "10px";

            div.innerHTML = `
                <input class="nome" value="${s.nome || ''}" placeholder="Nome do serviço"/>

                <input class="preco" type="number" value="${s.preco_produto || 0}" placeholder="Preço"/>

                <select class="tipo">
                    <option value="fixo" ${s.tipo === "fixo" ? "selected" : ""}>Fixo</option>
                    <option value="diaria" ${s.tipo === "diaria" ? "selected" : ""}>Diária</option>
                </select>

                <button class="remove">X</button>
            `;

            container.appendChild(div);

            div.querySelector(".remove").addEventListener("click", () => {
                div.remove();
            });
        };

        // 🔥 Carregar serviços existentes
        (hangar.servicos || []).forEach(s => {
            criarServico({
                ...s,
                tipo: s.tipo || "fixo" // fallback pra não quebrar
            });
        });

        // 🔥 Adicionar novo serviço
        document.getElementById("addServico").addEventListener("click", () => {
            criarServico();
        });

        // 🔥 Salvar alterações
        document.getElementById("salvar").addEventListener("click", async () => {

            const nome = document.getElementById("nome").value;

            const servicos = Array.from(container.children).map(div => ({
                nome: div.querySelector(".nome").value,
                preco_produto: parseFloat(div.querySelector(".preco").value),
                tipo: div.querySelector(".tipo").value
            }));

            await HangarService.updateHangar(id, {
                nome,
                servicos
            });

            alert("Hangar atualizado com sucesso!");
            window.navigate('/hangares');
        });
    }
};