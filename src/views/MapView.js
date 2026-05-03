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

                <div id="map"></div>

                <div id="airportSheet" class="airport-bottom-sheet">
                    <div id="sheet-content-placeholder"></div>
                </div>
            </div>
        `;
    },

    async after_render() {
        // Limpeza de segurança para evitar múltiplas instâncias do Leaflet
        if (mapInstance) {
            mapInstance.off();
            mapInstance.remove();
            mapInstance = null;
        }

        // Inicialização do mapa focada na região de operação
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

        btnBuscar.addEventListener("click", async () => {
            const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
            if (!icao) return;

            try {
                // Busca de dados meteorológicos via CheckWX
                const airportData = await WeatherService.getAirportData(icao);
                if (!airportData) return alert("ICAO não encontrado ou erro na API.");

                // Navegação no mapa até as coordenadas do aeródromo
                mapInstance.flyTo([airportData.lat, airportData.lon], 13, { animate: true, duration: 2 });

                // Gestão de marcadores
                if (markerInstance) mapInstance.removeLayer(markerInstance);
                markerInstance = L.marker([airportData.lat, airportData.lon]).addTo(mapInstance);

                // Consulta de hangares disponíveis no banco de dados
                const hangares = await HangarService.getHangaresByIcao(icao);
                
                // Extração do texto bruto (raw_text) para evitar exibição de objetos
                const metarExibicao = airportData.raw_text || "METAR INDISPONÍVEL";

                placeholder.innerHTML = this.renderDrawer(airportData, icao, hangares, metarExibicao);
                sheet.classList.add("visible");
            } catch (err) {
                console.error("Erro na operação MapView:", err);
            }
        });

        // Fechar painel ao interagir com o mapa
        mapInstance.on('click', () => sheet.classList.remove("visible"));
    },

    renderDrawer(airport, icao, hangares, metar) {
        return `
            <div class="drawer-header-sticky">
                <div class="sheet-handle"></div>
                
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

                    <!-- Container METAR: Ajustado para 100% da largura -->
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
                            <button class="btn-action secondary" onclick="window.goToPage('/hangar?id=${h.id}')">Detalhes</button>
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

// Utilitário global para navegação entre módulos do AviationHub
window.goToPage = (path) => {
    const sheet = document.getElementById("airportSheet");
    if (sheet) sheet.classList.remove("visible");
    
    setTimeout(() => {
        if (window.navigate) window.navigate(path);
        else window.location.hash = path;
    }, 300);
};