import Navbar from '../../components/navbar.js';
import { HangarService } from '../services/hangarservice.js';
import { AirportService } from '../services/airportservice.js';
import { WeatherService } from '../services/weatherservice.js';
import { AuthService } from "../services/authservice.js";


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

        let map = L.map('map').setView([-15.78, -47.93], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        let marker;

        document.getElementById("buscarBtn").addEventListener("click", async () => {

            const icao = document.getElementById("icaoInput").value.toUpperCase();

            if (!icao) return;

            try {

                // 🔥 Busca completa (station + metar)
                const airportData = await WeatherService.getAirportData(icao);

                if (!airportData) {
                    alert("ICAO inválido");
                    return;
                }

                const airport = {
                    name: airportData.name,
                    lat: airportData.lat,
                    lon: airportData.lon,
                    metar: airportData.metar,
                    message: airportData.metar ? null : "METAR indisponível"
                };

                // ✈️ voar até o aeroporto
                map.flyTo([airport.lat, airport.lon], 12, {
                    animate: true,
                    duration: 1.5
                });

                if (marker) map.removeLayer(marker);

                marker = L.marker([airport.lat, airport.lon]).addTo(map);

                // 🔥 buscar hangares
                const hangares = await HangarService.getHangaresByIcao(icao);

                // 🔥 abrir modal
                openBottomSheet(await renderDrawer(airport, icao, hangares));

            } catch (err) {
                console.error(err);
                alert("Erro ao buscar dados");
            }
        });
    }
};


// ==========================
// 🔽 BOTTOM SHEET
// ==========================

function openBottomSheet(content) {
    let sheet = document.getElementById("bottom-sheet");

    if (!sheet) {
        sheet = document.createElement("div");
        sheet.id = "bottom-sheet";

        sheet.style.position = "fixed";
        sheet.style.left = "0";
        sheet.style.bottom = "-100%";
        sheet.style.width = "100%";
        sheet.style.height = "70%";
        sheet.style.background = "#fff";
        sheet.style.boxShadow = "0 -2px 10px rgba(0,0,0,0.3)";
        sheet.style.transition = "bottom 0.3s ease";
        sheet.style.zIndex = "9999";
        sheet.style.borderTopLeftRadius = "12px";
        sheet.style.borderTopRightRadius = "12px";
        sheet.style.overflowY = "auto";
        sheet.style.padding = "15px";

        document.body.appendChild(sheet);
    }

    sheet.innerHTML = content;

    setTimeout(() => {
        sheet.style.bottom = "0";
    }, 10);
}

function closeBottomSheet() {
    const sheet = document.getElementById("bottom-sheet");
    if (sheet) {
        sheet.style.bottom = "-100%";
    }
}

window.closeBottomSheet = closeBottomSheet;


// ==========================
// 🔽 NAVEGAÇÃO
// ==========================

function goToPage(path) {
    closeBottomSheet();

    setTimeout(() => {
        window.navigate(path);
    }, 300);
}

window.goToPage = goToPage;


// ==========================
// 🔽 RENDER DO MODAL
// ==========================

async function renderDrawer(airport, icao, hangares) {

    let weatherHTML = "";

    if (airport.metar) {

        const m = airport.metar;

        weatherHTML = `
            <p><b>Condição:</b> ${m.conditions?.[0]?.text || '-'}</p>
            <p><b>Temperatura:</b> ${m.temperature?.celsius || '-'}°C</p>
            <p><b>Vento:</b> ${m.wind?.speed_kts || '-'} kt</p>
            <p><b>Visibilidade:</b> ${m.visibility?.meters || '-'} m</p>
            <p style="font-size:12px; color:gray;">
                Atualizado em: ${m.observed}
            </p>
        `;

    } else {

        weatherHTML = `
            <p style="color:#999;">
                ${airport.message}
            </p>
        `;
    }

    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="margin:0;">${airport.name} (${icao})</h2>
            <button onclick="closeBottomSheet()" style="font-size:18px;">✖</button>
        </div>

        <hr/>

        <h3>Clima</h3>
        ${weatherHTML}

        <hr/>

        <h3>Hangares disponíveis</h3>

        ${
            hangares.length
            ? hangares.map(h => `
                <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:8px;">
                    <h4>${h.nome}</h4>

                    <button onclick="goToPage('/hangar?id=${h.id}')">
                        Saiba mais
                    </button>

                    <button onclick="goToPage('/reserva?hangarId=${h.id}')">
                        Reservar
                    </button>
                </div>
            `).join('')
            : `<p style="color:#555;">Nenhum hangar disponível nesta localidade</p>`
        }
    `;
}