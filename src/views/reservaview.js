import { HangarService } from "../services/hangarservice.js";
import { ReservaService } from "../services/reservaservice.js";
import { AuthService } from "../services/authservice.js";

export default {

    async render() {
        return `
            <div>
                <h2>Nova Reserva</h2>
                <div id="reservaContainer">Carregando...</div>
            </div>
        `;
    },

    async after_render() {

        const params = new URLSearchParams(window.location.search);
        const hangarId = params.get("hangarId");

        const hangar = await HangarService.getHangarById(hangarId);

        if (!hangar) {
            document.getElementById("reservaContainer").innerHTML = "Hangar não encontrado";
            return;
        }

        document.getElementById("reservaContainer").innerHTML = `
            <h3>${hangar.nome}</h3>

            <div id="servicosContainer"></div>

            <button id="addServicoBtn">+ Adicionar serviço</button>

            <br/><br/>

            <label>Data início:</label>
            <input type="datetime-local" id="inicio"/>

            <br/><br/>

            <label>Data fim:</label>
            <input type="datetime-local" id="fim"/>

            <br/><br/>

            <h3 id="precoTotal">Total: R$ 0.00</h3>

            <button id="reservarBtn">Confirmar Reserva</button>
        `;

        const container = document.getElementById("servicosContainer");

        // 🔥 CRIAR LINHA DE SERVIÇO
        const criarServico = () => {

            const div = document.createElement("div");
            div.style.marginBottom = "10px";

            div.innerHTML = `
                <select class="servicoSelect">
                    ${
                        hangar.servicos.map(s => `
                            <option 
                                value="${s.nome}" 
                                data-preco="${s.preco_produto}" 
                                data-tipo="${s.tipo || 'fixo'}"
                            >
                                ${s.nome} - R$ ${s.preco_produto}
                            </option>
                        `).join('')
                    }
                </select>

                <button class="removerServico">X</button>
            `;

            container.appendChild(div);

            div.querySelector(".removerServico").addEventListener("click", () => {
                div.remove();
                calcularTotal();
            });

            div.querySelector(".servicoSelect").addEventListener("change", calcularTotal);
        };

        // 🔥 ADICIONAR PRIMEIRO
        criarServico();

        document.getElementById("addServicoBtn").addEventListener("click", criarServico);

        // 🔥 CALCULAR TOTAL
        const calcularTotal = () => {

            const selects = document.querySelectorAll(".servicoSelect");

            const inicio = new Date(document.getElementById("inicio").value);
            const fim = new Date(document.getElementById("fim").value);

            let dias = 1;

            if (inicio && fim && fim > inicio) {
                dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
            }

            let total = 0;

            selects.forEach(select => {

                const preco = parseFloat(select.selectedOptions[0].dataset.preco || 0);
                const tipo = select.selectedOptions[0].dataset.tipo;

                if (tipo === "diaria") {
                    total += preco * dias;
                } else {
                    total += preco;
                }
            });

            document.getElementById("precoTotal").innerText =
                `Total: R$ ${total.toFixed(2)}`;
        };

        document.getElementById("inicio").addEventListener("change", calcularTotal);
        document.getElementById("fim").addEventListener("change", calcularTotal);

        // 🔥 RESERVAR
        document.getElementById("reservarBtn").addEventListener("click", async () => {

            try {

                const user = AuthService.getCurrentUser();

                const selects = document.querySelectorAll(".servicoSelect");

                const servicos = Array.from(selects).map(select => ({
                    nome: select.value,
                    preco: parseFloat(select.selectedOptions[0].dataset.preco),
                    tipo: select.selectedOptions[0].dataset.tipo
                }));

                const reserva = {
                    hangarId,
                    userId: user.uid,
                    servicos,
                    dataInicio: document.getElementById("inicio").value,
                    dataFim: document.getElementById("fim").value,
                    status: "ativa"
                };

                await ReservaService.criarReserva(reserva);

                alert("Reserva criada com sucesso!");
                window.navigate("/");

            } catch (err) {
                alert(err.message);
            }
        });
    }
};