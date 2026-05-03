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
                        <input type="text" id="icaoInput" placeholder="Ex: SBJD, SBSP..." autocomplete="off" />
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
        // Limpeza de instância prévia do mapa para evitar bugs de re-renderização
        if (mapInstance) {
            mapInstance.off();
            mapInstance.remove();
            mapInstance = null;
        }

        // Inicialização do Mapa
        mapInstance = L.map('map', { 
            zoomControl: false, 
            attributionControl: false 
        }).setView([-23.55, -46.63], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        
        // Garante que o mapa preencha o container corretamente após o render
        setTimeout(() => mapInstance.invalidateSize(), 300);

        const btnBuscar = document.getElementById("buscarBtn");
        const sheet = document.getElementById("airportSheet");
        const placeholder = document.getElementById("sheet-content-placeholder");

        btnBuscar.addEventListener("click", async () => {
            const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
            if (!icao) return;

            try {
                // Busca dados do Aeroporto e METAR
                const airportData = await WeatherService.getAirportData(icao);
                if (!airportData) return alert("ICAO não encontrado.");

                // Movimenta o mapa até o aeroporto
                mapInstance.flyTo([airportData.lat, airportData.lon], 13, { animate: true, duration: 2 });

                // Atualiza o Marcador
                if (markerInstance) mapInstance.removeLayer(markerInstance);
                markerInstance = L.marker([airportData.lat, airportData.lon]).addTo(mapInstance);

                // Busca Hangares vinculados ao ICAO
                const hangares = await HangarService.getHangaresByIcao(icao);
                
                // EXTRAÇÃO DO RAW TEXT: Filtra o objeto para exibir apenas a string do METAR
                let metarExibicao = "METAR indisponível";
                if (airportData) {
                    metarExibicao = airportData.raw_text || 
                                    (airportData.metar && airportData.metar.raw_text) || 
                                    (typeof airportData.metar === 'string' ? airportData.metar : "METAR indisponível");
                }

                // Renderiza o conteúdo do Drawer
                placeholder.innerHTML = this.renderDrawer(airportData, icao, hangares, metarExibicao);
                sheet.classList.add("visible");
            } catch (err) {
                console.error("Erro na busca AviationHub:", err);
            }
        });

        // Fecha o drawer ao clicar no mapa
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

// Função global para navegação entre páginas dentro do sistema AviationHub
window.goToPage = (path) => {
    const sheet = document.getElementById("airportSheet");
    if (sheet) sheet.classList.remove("visible");
    
    setTimeout(() => {
        if (window.navigate) window.navigate(path);
        else window.location.hash = path;
    }, 300);
};