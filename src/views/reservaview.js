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

        try {

            const params = new URLSearchParams(window.location.search);
            const hangarId = params.get("hangarId");

            if (!hangarId) {
                document.getElementById("reservaContainer").innerHTML =
                    "Hangar não informado na URL.";
                return;
            }

            const hangar = await HangarService.getHangarById(hangarId);

            if (!hangar) {
                document.getElementById("reservaContainer").innerHTML =
                    "Hangar não encontrado.";
                return;
            }

            const container = document.getElementById("reservaContainer");

            container.innerHTML = `
                <h3>${hangar.nome}</h3>

                <div id="servicosContainer"></div>

                <button id="addServicoBtn">+ Adicionar serviço</button>

                <br/><br/>

                <h3 id="precoTotal">Total: R$ 0.00</h3>

                <button id="reservarBtn">Confirmar Reserva</button>
            `;

            const servicosContainer = document.getElementById("servicosContainer");

            const calcularTotal = () => {

                const blocos = document.querySelectorAll("#servicosContainer > div");

                let total = 0;

                blocos.forEach(bloco => {

                    const select = bloco.querySelector(".servicoSelect");

                    const preco = parseFloat(select.selectedOptions[0]?.dataset?.preco || 0);
                    const tipo = select.selectedOptions[0]?.dataset?.tipo;

                    const inicio = bloco.querySelector(".inicioServico").value;
                    const fim = bloco.querySelector(".fimServico").value;

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

            const criarServico = () => {

                const div = document.createElement("div");

                div.style.margin = "10px 0";
                div.style.padding = "10px";
                div.style.border = "1px solid #ccc";

                div.innerHTML = `
                    <select class="servicoSelect">
                        ${hangar.servicos.map(s => `
                            <option value="${s.nome}"
                                data-preco="${s.preco_produto}"
                                data-tipo="${s.tipo || 'fixo'}">
                                ${s.nome} - R$ ${s.preco_produto}
                            </option>
                        `).join("")}
                    </select>

                    <br/><br/>

                    <input type="datetime-local" class="inicioServico"/>
                    <input type="datetime-local" class="fimServico"/>

                    <br/><br/>

                    <button class="remover">Remover</button>
                `;

                servicosContainer.appendChild(div);

                div.querySelector(".remover").onclick = () => {
                    div.remove();
                    calcularTotal();
                };

                div.querySelectorAll("select, input").forEach(i =>
                    i.addEventListener("change", calcularTotal)
                );
            };

            criarServico();

            document.getElementById("addServicoBtn").onclick = criarServico;

            document.getElementById("reservarBtn").onclick = async () => {

                try {

                    const user = AuthService.getUser(); // ✔ CORRETO (não getCurrentUser)

                    if (!user) throw new Error("Usuário não autenticado");

                    const prefixo = prompt("Prefixo da aeronave:");

                    const blocos = document.querySelectorAll("#servicosContainer > div");

                    let valorTotal = 0;

                    const servicos = Array.from(blocos).map(bloco => {

                        const select = bloco.querySelector(".servicoSelect");

                        const preco = parseFloat(select.selectedOptions[0].dataset.preco);
                        const tipo = select.selectedOptions[0].dataset.tipo;

                        const inicio = bloco.querySelector(".inicioServico").value;
                        const fim = bloco.querySelector(".fimServico").value;

                        let multiplicador = 1;

                        if (inicio && fim && tipo === "diaria") {
                            const ini = new Date(inicio);
                            const end = new Date(fim);

                            if (end > ini) {
                                multiplicador = Math.ceil((end - ini) / (1000 * 60 * 60 * 24));
                            }
                        }

                        const subtotal = preco * multiplicador;
                        valorTotal += subtotal;

                        return {
                            nome: select.value,
                            preco,
                            tipo,
                            inicio,
                            fim,
                            subtotal
                        };
                    });

                    await ReservaService.criarReserva({
                        hangarId,
                        userId: user.uid,
                        userEmail: user.email,
                        userName: user.displayName || "",
                        prefixoAviao: prefixo,
                        servicos,
                        valorTotal,
                        status: "aguardando_pagamento"
                    });

                    alert("Reserva criada com sucesso!");
                    window.navigate("/");

                } catch (err) {
                    console.error(err);
                    alert(err.message);
                }
            };

        } catch (err) {
            console.error("Erro view reserva:", err);
            document.getElementById("reservaContainer").innerHTML =
                "Erro ao carregar reserva.";
        }
    }
};