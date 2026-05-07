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
        // 🔥 destrói mapa anterior corretamente
        if (mapInstance) {
            mapInstance.off();
            mapInstance.remove();
            mapInstance = null;
        }

        // 🔥 cria mapa
        mapInstance = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([-23.55, -46.63], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
            .addTo(mapInstance);

        // 🔥 CORREÇÃO DEFINITIVA DO MAPA BRANCO
        requestAnimationFrame(() => {
            mapInstance.invalidateSize();
        });

        window.addEventListener("resize", () => {
            mapInstance.invalidateSize();
        });

        const btnBuscar = document.getElementById("buscarBtn");
        const sheet = document.getElementById("airportSheet");
        const placeholder = document.getElementById("sheet-content-placeholder");

        // 🔹 navegação
        window.openHangarDetails = (id) => {
            sheet.classList.remove("visible");
            setTimeout(() => {
                window.location.hash = `#/hangar?id=${id}`;
            }, 300);
        };

        // 🔥 LOADING TEMPLATE
        const renderLoading = () => `
            <div class="drawer-loading">
                <div class="loading-header">
                    <div class="spinner"></div>
                    <strong>Buscando informações...</strong>
                </div>

                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-subtitle"></div>

                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        `;

        btnBuscar.addEventListener("click", async () => {
            const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
            if (!icao) return;

            // 🔥 abre drawer com loading
            placeholder.innerHTML = renderLoading();
            sheet.classList.add("visible");

            // 🔥 garante render do mapa mesmo com animação
            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 400);

            try {
                const airportData = await WeatherService.getWeather(icao);

                if (!airportData) {
                    placeholder.innerHTML = `<div class="error-msg">ICAO não encontrado.</div>`;
                    return;
                }

                const { lat, lon } = airportData;

                mapInstance.flyTo([lat, lon], 13, {
                    animate: true,
                    duration: 2
                });

                if (markerInstance) {
                    mapInstance.removeLayer(markerInstance);
                }

                markerInstance = L.marker([lat, lon]).addTo(mapInstance);

                // 🔥 busca hangares sem quebrar fluxo
                let hangares = [];
                try {
                    hangares = await HangarService.getHangaresByIcao(icao);
                } catch (e) {
                    console.warn("Erro ao buscar hangares:", e);
                }

                const metarExibicao = airportData.raw_text || "METAR INDISPONÍVEL";

                placeholder.innerHTML = this.renderDrawer(
                    airportData,
                    icao,
                    hangares,
                    metarExibicao
                );

            } catch (err) {
                console.error("Erro MapView:", err);

                placeholder.innerHTML = `
                    <div class="error-msg">
                        Erro ao buscar dados do aeroporto.
                    </div>
                `;
            }
        });

        mapInstance.on('click', () => {
            sheet.classList.remove("visible");
        });
    },

    renderDrawer(airport, icao, hangares, metar) {
        return `
            <div class="drawer-header-sticky">
                <div class="drawer-header-content">
                    <div class="header-text-group">
                        <h2>${airport.name}</h2>
                        <span class="icao-badge">${icao}</span>
                    </div>
                    
                    <button class="close-sheet-btn"
                        onclick="document.getElementById('airportSheet').classList.remove('visible')">
                        ✕
                    </button>

                    <div class="metar-container">
                        <span class="metar-label">Condições Meteorológicas</span>
                        <p class="metar-text">${metar}</p>
                    </div>
                </div>
            </div>

            <div class="drawer-body">
                <h3 class="section-title">Hangares disponíveis</h3>

                ${
                    hangares?.length
                        ? hangares.map(h => `
                            <div class="hangar-card-pill">
                                <div>
                                    <span class="status-label">Disponível</span>
                                    <strong>${h.nome}</strong>
                                </div>
                                <div class="pill-actions">
                                    <button class="btn-action secondary"
                                        onclick="window.openHangarDetails('${h.id}')">
                                        Detalhes
                                    </button>
                                </div>
                            </div>
                        `).join("")
                        : `
                        <div class="empty-state">
                            Nenhum hangar disponível para este aeroporto.
                        </div>
                    `
                }
            </div>
        `;
    }
};