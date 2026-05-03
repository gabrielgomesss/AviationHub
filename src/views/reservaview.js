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

            <h3 id="precoTotal">Total: R$ 0.00</h3>

            <button id="reservarBtn">Confirmar Reserva</button>
        `;

        const container = document.getElementById("servicosContainer");

        // =========================
        // 🔥 CALCULAR TOTAL (POR SERVIÇO)
        // =========================
        const calcularTotal = () => {

            const blocos = document.querySelectorAll("#servicosContainer > div");

            let total = 0;

            blocos.forEach(bloco => {

                const select = bloco.querySelector(".servicoSelect");
                const inicio = bloco.querySelector(".inicioServico").value;
                const fim = bloco.querySelector(".fimServico").value;

                if (!select) return;

                const preco = parseFloat(select.selectedOptions[0]?.dataset?.preco || 0);
                const tipo = select.selectedOptions[0]?.dataset?.tipo;

                let multiplicador = 1;

                if (inicio && fim && tipo === "diaria") {

                    const ini = new Date(inicio);
                    const end = new Date(fim);

                    if (end > ini) {
                        multiplicador = Math.ceil((end - ini) / (1000 * 60 * 60 * 24));
                    }
                }

                total += preco * multiplicador;
            });

            document.getElementById("precoTotal").innerText =
                `Total: R$ ${total.toFixed(2)}`;
        };

        // =========================
        // 🔥 CRIAR SERVIÇO
        // =========================
        const criarServico = () => {

            const div = document.createElement("div");

            div.style.marginBottom = "20px";
            div.style.padding = "10px";
            div.style.border = "1px solid #ccc";

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

                <br/><br/>

                <label>Início:</label>
                <input type="datetime-local" class="inicioServico"/>

                <br/><br/>

                <label>Fim:</label>
                <input type="datetime-local" class="fimServico"/>

                <br/><br/>

                <button class="removerServico">Remover</button>

                <hr/>
            `;

            container.appendChild(div);

            div.querySelector(".removerServico").addEventListener("click", () => {
                div.remove();
                calcularTotal();
            });

            div.querySelectorAll("select, input").forEach(el => {
                el.addEventListener("change", calcularTotal);
            });
        };

        // =========================
        // INIT
        // =========================
        criarServico();

        document.getElementById("addServicoBtn").addEventListener("click", criarServico);

        // =========================
        // RESERVA FINAL
        // =========================
        document.getElementById("reservarBtn").addEventListener("click", async () => {

            try {

                const user = AuthService.getCurrentUser();

                const blocos = document.querySelectorAll("#servicosContainer > div");

                const servicos = Array.from(blocos).map(bloco => {

                    const select = bloco.querySelector(".servicoSelect");

                    return {
                        nome: select.value,
                        preco: parseFloat(select.selectedOptions[0].dataset.preco),
                        tipo: select.selectedOptions[0].dataset.tipo,
                        inicio: bloco.querySelector(".inicioServico").value,
                        fim: bloco.querySelector(".fimServico").value
                    };
                });

                const reserva = {
                    hangarId,
                    userId: user.uid,
                    servicos,
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