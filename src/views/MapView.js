import { HangarService } from '../services/hangarservice.js';
import { WeatherService } from '../services/weatherservice.js';

let mapInstance = null;
let markerInstance = null;

export default {

async render() {
    return `
        <div class="map-container">

            <!-- SEARCH OVERLAY -->
            <div class="map-search">
                <input type="text" id="icaoInput" placeholder="Buscar ICAO (ex: SBSP)" />
                <button id="buscarBtn">Buscar</button>
            </div>

            <div id="map"></div>

        </div>
    `;
},

async after_render() {

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    mapInstance = L.map('map', {
        zoomControl: false
    }).setView([-15.78, -47.93], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapInstance);

    document.getElementById("buscarBtn").addEventListener("click", async () => {

        const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
        if (!icao) return;

        try {

            const airportData = await WeatherService.getAirportData(icao);

            if (!airportData) {
                alert("ICAO não encontrado");
                return;
            }

            mapInstance.flyTo([airportData.lat, airportData.lon], 12, {
                animate: true,
                duration: 1.5
            });

            if (markerInstance) {
                mapInstance.removeLayer(markerInstance);
            }

            markerInstance = L.marker([airportData.lat, airportData.lon]).addTo(mapInstance);

            const hangares = await HangarService.getHangaresByIcao(icao);

            openBottomSheet(await renderDrawer(airportData, icao, hangares));

        } catch (err) {
            console.error(err);
            alert("Erro ao buscar aeroporto");
        }
    });
}

};

// ==========================
// BOTTOM SHEET
// ==========================
function openBottomSheet(content) {

    let sheet = document.getElementById("bottom-sheet");

    if (!sheet) {
        sheet = document.createElement("div");
        sheet.id = "bottom-sheet";

        Object.assign(sheet.style, {
            position: "fixed",
            left: "0",
            bottom: "-100%",
            width: "95%",
            height: "65%",
            background: "#fff",
            boxShadow: "0 -10px 30px rgba(0,0,0,0.25)",
            transition: "bottom 0.3s ease",
            zIndex: "99999",
            borderTopLeftRadius: "18px",
            borderTopRightRadius: "18px",
            overflowY: "auto",
            padding: "16px",
            color: "#666",
            fontSize: "11px"
        });

        document.body.appendChild(sheet);
    }

    sheet.innerHTML = content;

    setTimeout(() => {
        sheet.style.bottom = "0";
    }, 10);
}

function closeBottomSheet() {
    const sheet = document.getElementById("bottom-sheet");
    if (sheet) sheet.style.bottom = "-100%";
}

window.closeBottomSheet = closeBottomSheet;

// ==========================
// NAVIGATION
// ==========================
function goToPage(path) {
    closeBottomSheet();
    setTimeout(() => window.navigate(path), 250);
}

window.goToPage = goToPage;

// ==========================
// DRAWER (CORRIGIDO)
// ==========================
async function renderDrawer(airport, icao, hangares) {

    return `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:10px;
        ">

            <div>
                <h2 style="margin:0;">${airport.name}</h2>
                <small style="color:#777;">${icao}</small>
            </div>

            <!-- BOTÃO FECHAR CORRIGIDO -->
            <button onclick="closeBottomSheet()" style="
                width:3%;
                height:3%;
                border-radius:10px;
                border:none;
                background:#222;
                color:#fff;
                font-size:12px;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:center;
            ">
                ✕
            </button>

        </div>

        <hr/>

        <h3>Hangares disponíveis</h3>

        <!-- GRID CORRETO (NÃO POR ITEM) -->
        <div style="
            display:grid;
            grid-template-columns: repeat(2, 1fr);
            gap:10px;
        ">

            ${
                hangares?.length
                ? hangares.map(h => `
                    <div style="
                        padding:12px;
                        border:1px solid #eee;
                        border-radius:12px;
                        background:#fafafa;
                    ">
                        <strong>${h.nome}</strong>

                        <div style="margin-top:8px; display:flex; gap:6px;">
                            <button onclick="goToPage('/hangar?id=${h.id}')">
                                Ver
                            </button>

                            <button onclick="goToPage('/reserva?hangarId=${h.id}')">
                                Reservar
                            </button>
                        </div>
                    </div>
                `).join("")
                : `<p>Nenhum hangar disponível</p>`
            }

        </div>
    `;
}