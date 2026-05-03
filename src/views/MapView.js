import { HangarService } from '../services/hangarservice.js';
import { WeatherService } from '../services/weatherservice.js';

let mapInstance = null;
let markerInstance = null;

export default {
    // Renderiza a estrutura básica do componente
    async render() {
        return `
            <div class="map-container">
                <!-- BARRA DE BUSCA -->
                <div class="map-search-container">
                    <div class="map-search-glass">
                        <input type="text" id="icaoInput" placeholder="Buscar ICAO (ex: SBJD)" autocomplete="off" />
                        <button id="buscarBtn">BUSCAR</button>
                    </div>
                </div>

                <!-- CONTAINER DO MAPA -->
                <div id="map"></div>

                <!-- BOTTOM SHEET (DRAWER) -->
                <div id="airportSheet" class="airport-bottom-sheet">
                    <div class="sheet-handle"></div>
                    <div id="sheet-content-placeholder"></div>
                </div>
            </div>
        `;
    },

    // Executa a lógica após a renderização do HTML no DOM
    async after_render() {
        // Limpeza de instância prévia do mapa para evitar erros de re-inicialização
        if (mapInstance) {
            mapInstance.off();
            mapInstance.remove();
            mapInstance = null;
        }

        // Inicialização do Mapa Leaflet
        mapInstance = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([-15.78, -47.93], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

        // Força o ajuste do tamanho do mapa após o carregamento (Evita o mapa cinza)
        setTimeout(() => {
            if (mapInstance) mapInstance.invalidateSize();
        }, 200);

        const btnBuscar = document.getElementById("buscarBtn");
        const sheet = document.getElementById("airportSheet");
        const contentPlaceholder = document.getElementById("sheet-content-placeholder");

        // Evento de Busca
        btnBuscar.addEventListener("click", async () => {
            const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
            if (!icao) return;

            try {
                // Busca dados do aeroporto via WeatherService
                const airportData = await WeatherService.getAirportData(icao);

                if (!airportData) {
                    alert("ICAO não encontrado.");
                    return;
                }

                // Centraliza o mapa nas coordenadas do aeroporto
                mapInstance.flyTo([airportData.lat, airportData.lon], 12, {
                    animate: true,
                    duration: 1.5
                });

                // Atualiza o Marcador
                if (markerInstance) mapInstance.removeLayer(markerInstance);
                markerInstance = L.marker([airportData.lat, airportData.lon]).addTo(mapInstance);

                // Busca os hangares vinculados ao ICAO
                const hangares = await HangarService.getHangaresByIcao(icao);

                // Renderiza o conteúdo dentro do Bottom Sheet e exibe
                contentPlaceholder.innerHTML = await this.renderDrawerContent(airportData, icao, hangares);
                sheet.classList.add("visible");

            } catch (err) {
                console.error("Erro na busca do aeroporto:", err);
                alert("Erro ao processar a busca. Verifique o console.");
            }
        });

        // Fecha o Bottom Sheet ao clicar no mapa
        mapInstance.on('click', () => {
            sheet.classList.remove("visible");
        });
    },

    // Função interna para gerar o HTML do Drawer com estilo ajustado
    async renderDrawerContent(airport, icao, hangares) {
        return `
            <div class="drawer-header" style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
                <div>
                    <h2 style="margin:0; color:#1a1a1a; font-size: 1.3rem;">${airport.name}</h2>
                    <span class="icao-badge">${icao}</span>
                </div>
                <button onclick="document.getElementById('airportSheet').classList.remove('visible')" 
                        style="background:#f1f5f9; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:14px;">✕</button>
            </div>

            <hr style="border:0; border-top:1px solid #eee; margin-bottom:20px;"/>

            <h3 style="color:#4a5568; font-size:1rem; margin-bottom:15px;">Hangares disponíveis</h3>
            
            <div class="hangar-grid-mini">
                ${hangares?.length ? hangares.map(h => `
                    <div class="hangar-card-pill">
                        <strong>${h.nome}</strong>
                        <div class="pill-actions">
                            <button class="btn-ver" onclick="window.goToPage('/hangar?id=${h.id}')">Ver</button>
                            <button class="btn-reservar highlight" onclick="window.goToPage('/reserva?hangarId=${h.id}')">Reservar</button>
                        </div>
                    </div>
                `).join("") : `<p style="color:#94a3b8; font-size:0.9rem;">Nenhum hangar disponível para este aeroporto.</p>`}
            </div>
        `;
    }
};

/**
 * FUNÇÕES GLOBAIS DE NAVEGAÇÃO
 * Mantidas fora do objeto para acesso direto via 'onclick' no HTML injetado
 */
window.goToPage = (path) => {
    const sheet = document.getElementById("airportSheet");
    if (sheet) sheet.classList.remove("visible");
    
    // Pequeno delay para a animação de saída da aba antes de navegar
    setTimeout(() => {
        if (window.navigate) {
            window.navigate(path);
        } else {
            window.location.hash = path;
        }
    }, 250);
};