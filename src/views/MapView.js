import { HangarService } from '../services/hangarservice.js';
import { db, collection } from "../services/firebase-config.js";

const ref = collection(db, "Hangares");

let map;
let marker;

function openDrawer(content) {
    let drawer = document.getElementById("drawer");

    if (!drawer) {
        drawer = document.createElement("div");
        drawer.id = "drawer";

        drawer.style.position = "fixed";
        drawer.style.bottom = "0";
        drawer.style.left = "0";
        drawer.style.width = "100%";
        drawer.style.height = "50%";
        drawer.style.background = "#fff";
        drawer.style.boxShadow = "0 -2px 10px rgba(0,0,0,0.2)";
        drawer.style.borderTopLeftRadius = "12px";
        drawer.style.borderTopRightRadius = "12px";
        drawer.style.padding = "15px";
        drawer.style.overflowY = "auto";
        drawer.style.zIndex = "9999";
        drawer.style.transform = "translateY(100%)";
        drawer.style.transition = "transform 0.3s ease";

        document.body.appendChild(drawer);
    }

    drawer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>Detalhes</strong>
            <button id="closeDrawer">Fechar</button>
        </div>
        <hr/>
        ${content}
    `;

    setTimeout(() => {
        drawer.style.transform = "translateY(0)";
    }, 10);

    document.getElementById("closeDrawer").onclick = closeDrawer;
}

function closeDrawer() {
    const drawer = document.getElementById("drawer");
    if (drawer) {
        drawer.style.transform = "translateY(100%)";
    }
}

async function renderDrawer(icao, hangares) {

    let html = `<h3>${icao}</h3>`;

    if (!hangares || hangares.length === 0) {
        html += `<p>Nenhum hangar disponível nesta localidade.</p>`;
        return html;
    }

    for (const h of hangares) {

        // 🔥 pega dados atualizados do Firebase
        const hangar = await HangarService.getHangarById(h.id);

        html += `
            <div style="
                border:1px solid #ccc;
                padding:10px;
                margin-bottom:10px;
                border-radius:8px;
            ">
                <h4>${hangar.nome}</h4>

                <ul>
                    ${(hangar.servicos || []).map(s => `
                        <li>
                            ${s.nome} - R$ ${s.preco_produto}
                            (${s.tipo === 'diaria' ? 'Diária' : 'Fixo'})
                        </li>
                    `).join('')}
                </ul>

                <button onclick="goToHangar('${hangar.id}')">
                    Saiba mais
                </button>
            </div>
        `;
    }

    return html;
}

window.goToHangar = (id) => {
    closeDrawer();
    window.navigate(`/hangar?id=${id}`);
};

export default {

    async render() {
        return `
            <div>
                <h2>Buscar Hangares por ICAO</h2>

                <input type="text" id="icaoInput" placeholder="Ex: SBSP"/>
                <button id="buscarBtn">Buscar</button>

                <div id="map" style="height:300px; margin-top:15px;"></div>
            </div>
        `;
    },

    async after_render() {

        // 🔥 iniciar mapa
        map = L.map('map').setView([-23.5505, -46.6333], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        document.getElementById("buscarBtn").addEventListener("click", async () => {

            const icao = document.getElementById("icaoInput").value.toUpperCase();

            if (!icao) return;

            try {

                // 🔥 busca hangares por ICAO
                const hangares = await HangarService.getHangaresByICAO(icao);
                

                if (!hangares || hangares.length === 0) {
                    openDrawer(`<p>Nenhum hangar encontrado para ${icao}</p>`);
                    return;
                }

                // 🔥 pegar coordenadas do primeiro hangar
                const lat = hangares[0].lat || -23.5505;
                const lng = hangares[0].lng || -46.6333;

                // 🔥 anima o mapa
                map.flyTo([lat, lng], 12);

                if (marker) {
                    map.removeLayer(marker);
                }

                marker = L.marker([lat, lng]).addTo(map);

                // 🔥 abrir drawer com dados atualizados
                openDrawer(await renderDrawer(icao, hangares));

            } catch (err) {
                console.error(err);
                console.log("db =", db);
                openDrawer(`<p>Erro ao buscar hangares.</p>`);
            }
        });
    }
};