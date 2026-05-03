import { HangarService } from '../services/hangarservice.js';
import { WeatherService } from '../services/weatherservice.js';

let mapInstance = null;
let markerInstance = null;

export default {
    async render() {
        return `
            <div class="map-container">
                <div class="map-search-container">
                    <div class="map-search-glass">
                        <input type="text" id="icaoInput" placeholder="EX: SBJD, SBSP..." autocomplete="off" />
                        <button id="buscarBtn">BUSCAR</button>
                    </div>
                </div>

                <div id="map" style="height: 100vh; width: 100%;"></div>

                <div id="airportSheet" class="airport-bottom-sheet">
                    <div id="sheet-content-placeholder"></div>
                </div>
            </div>
        `;
    },

    async after_render() {
        // 1. Limpeza de segurança para evitar múltiplas instâncias do Leaflet
        if (mapInstance) {
            mapInstance.off();
            mapInstance.remove();
            mapInstance = null;
        }

        // 2. Inicialização do mapa
        mapInstance = L.map('map', { 
            zoomControl: false, 
            attributionControl: false 
        }).setView([-23.55, -46.63], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        
        // Ajuste de redimensionamento após renderização do DOM
        setTimeout(() => mapInstance.invalidateSize(), 300);

        const btnBuscar = document.getElementById("buscarBtn");
        const sheet = document.getElementById("airportSheet");
        const placeholder = document.getElementById("sheet-content-placeholder");

        // 3. Função Global de Navegação para os detalhes do Hangar (dentro do escopo da SPA)[cite: 4, 6]
        window.openHangarDetails = (id) => {
            sheet.classList.remove("visible");
            setTimeout(() => {
                window.location.hash = `#/hangar?id=${id}`; // Navegação via Hash
            }, 300);
        };

        btnBuscar.addEventListener("click", async () => {
            const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
            if (!icao) return;

            try {
                const airportData = await WeatherService.getAirportData(icao);
                if (!airportData) return alert("ICAO não encontrado ou erro na API.");

                mapInstance.flyTo([airportData.lat, airportData.lon], 13, { animate: true, duration: 2 });

                if (markerInstance) mapInstance.removeLayer(markerInstance);
                markerInstance = L.marker([airportData.lat, airportData.lon]).addTo(mapInstance);

                const hangares = await HangarService.getHangaresByIcao(icao);
                const metarExibicao = airportData.raw_text || "METAR INDISPONÍVEL";

                placeholder.innerHTML = this.renderDrawer(airportData, icao, hangares, metarExibicao);
                sheet.classList.add("visible");
            } catch (err) {
                console.error("Erro na operação MapView:", err);
            }
        });

        mapInstance.on('click', () => sheet.classList.remove("visible"));
    },

    renderDrawer(airport, icao, hangares, metar) {
        return `
            <div class="drawer-header-sticky">
                <div class="drawer-header-content">
                    <div class="header-text-group">
                        <h2 style="margin:0; color:#0f172a; font-size:1.3rem; font-weight:800; line-height: 1.2;">
                            ${airport.name}
                        </h2>
                        <span class="icao-badge">${icao}</span>
                    </div>
                    
                    <button class="close-sheet-btn" onclick="document.getElementById('airportSheet').classList.remove('visible')">
                        ✕
                    </button>

                    <div class="metar-container">
                        <span class="metar-label">Condições Meteorológicas (METAR)</span>
                        <p class="metar-text">${metar}</p>
                    </div>
                </div>
            </div>

            <div class="drawer-body">
                <h3 style="color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:16px;">
                    Hangares disponíveis
                </h3>
                ${hangares?.length ? hangares.map(h => `
                    <div class="hangar-card-pill">
                        <div>
                            <span style="color:#94a3b8; font-size:0.65rem; font-weight:800; text-transform:uppercase;">Disponível</span>
                            <strong style="display:block; color:#1e293b; font-size:1.05rem;">${h.nome}</strong>
                        </div>
                        <div class="pill-actions">
                            <button class="btn-action secondary" onclick="window.openHangarDetails('${h.id}')">Detalhes</button>
                        </div>
                    </div>
                `).join("") : `
                    <div style="text-align:center; padding:30px;">
                        <p style="color:#94a3b8; font-size:0.9rem;">Nenhum hangar disponível para este aeroporto.</p>
                    </div>
                `}
            </div>
        `;
    }
};