import { HangarService } from '../services/hangarservice.js';
import { WeatherService } from '../services/weatherservice.js';

let mapInstance = null;
let markerInstance = null;

export default {
    async render() {
        return `
            <div class="map-container">
                <div id="toast-container"></div>
                <div class="map-search-container" style="z-index: 5 !important;">
                    <div class="map-search-glass">
                        <input type="text" id="icaoInput" placeholder="EX: SBJD" autocomplete="off" maxlength="4" />
                        <button id="buscarBtn">BUSCAR</button>
                    </div>
                </div>

                <div id="map" style="z-index: 1;"></div>

                <div id="airportSheet" class="airport-bottom-sheet" style="z-index: 1000;">
                    <div id="sheet-content-placeholder" style="height: 100%; display: flex; flex-direction: column;"></div>
                </div>

                <div id="modalHangarDetalhes" class="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); z-index: 99999; align-items:center; justify-content:center; padding: 20px; opacity: 0; transition: opacity 0.3s ease;">
                    <div class="modal-content" style="background:white; padding:30px; border-radius:32px; width:100%; max-width:400px; position: relative; transform: scale(0.9); transition: transform 0.3s ease; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                        <button onclick="window.closeHangarModal()" style="position:absolute; top:20px; right:20px; border:none; background:#1e293b; width:36px; height:36px; border-radius:50%; font-weight:bold; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
                        <div id="hangarModalBody"></div>
                    </div>
                </div>
            </div>
        `;
    },

    async after_render() {
        if (mapInstance) {
            mapInstance.off();
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([-23.55, -46.63], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

        const btnBuscar = document.getElementById('buscarBtn');
        const icaoInput = document.getElementById('icaoInput');

        window.closeHangarModal = () => {
            const modal = document.getElementById('modalHangarDetalhes');
            if (modal) {
                modal.style.opacity = '0';
                const content = modal.querySelector('.modal-content');
                if (content) content.style.transform = 'scale(0.9)';
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        };

        window.irParaReserva = (id) => {
            window.closeHangarModal();
            setTimeout(() => {
                // Sincronizado: enviando 'hangarId'
                window.location.hash = `#/reserva?hangarId=${id}`;
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            }, 350);
        };

        window.openHangarDetails = async (id) => {
            const modal = document.getElementById('modalHangarDetalhes');
            const body = document.getElementById('hangarModalBody');
            if (!modal || !body) return;

            body.innerHTML = `<div style="text-align:center; padding:40px;"><div style="width:40px; height:40px; border:4px solid #f3f3f3; border-top:4px solid #10b981; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto;"></div></div>`;
            modal.style.display = 'flex';
            setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
            
            try {
                const hangar = await HangarService.getHangarById(id);
                body.innerHTML = `
                    <div style="margin-bottom:25px;">
                        <span style="background:#ecfdf5; color:#10b981; padding:4px 12px; border-radius:10px; font-size:0.7rem; font-weight:800; text-transform:uppercase;">Hangar Ativo</span>
                        <h2 style="color:#1e293b; margin:10px 0 5px 0; font-weight:800; font-size:1.4rem;">${hangar.nome}</h2>
                        <p style="color:#64748b; font-size:0.85rem;">Localização: <strong>${hangar.icao}</strong></p>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${hangar.servicos?.map(s => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:12px 15px; border-radius:14px; border:1px solid #e2e8f0;">
                                <span style="font-weight:700; color:white; font-size:0.85rem;">${s.nome}</span>
                                <span style="color:white; font-weight:800; font-size:0.8rem;">${s.sob_consulta ? 'Consultar' : 'R$ ' + s.preco_produto}</span>
                            </div>
                        `).join('') || '<p>Sem serviços.</p>'}
                    </div>
                    <button onclick="window.irParaReserva('${id}')" style="width:100%; margin-top:25px; background:#10b981; color:white; border:none; padding:18px; border-radius:20px; font-weight:800; cursor:pointer; font-size:1rem;">RESERVAR AGORA</button>
                `;
            } catch (error) {
                body.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar dados.</p>';
            }
        };

        const showToast = (message) => {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast-message';
            toast.innerHTML = `<span>⚠️</span> ${message}`;
            
            container.appendChild(toast);

            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);

            // Remove após 3 segundos
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        const realizarBusca = async () => {
            const rawValue = icaoInput ? icaoInput.value.trim().toUpperCase() : "";
            if (rawValue.length < 4) return;

            try {
                if (btnBuscar) { btnBuscar.innerText = "..."; btnBuscar.disabled = true; }
                
                const [weatherData, hangares] = await Promise.all([
                    WeatherService.getWeather(rawValue),
                    HangarService.getHangaresByIcao(rawValue)
                ]);

                // LÓGICA DE VERIFICAÇÃO:
                // Se não houver clima (aeródromo não existe) OU se a lista de hangares for vazia
                if (!weatherData || !weatherData.lat || !hangares || hangares.length === 0) {
                    showToast(`Nenhum hangar encontrado para o ICAO ${rawValue}`);
                    if (btnBuscar) { btnBuscar.innerText = "BUSCAR"; btnBuscar.disabled = false; }
                    return; // Interrompe a execução
                }

                // Se chegou aqui, o aeródromo e o hangar existem
                const pos = [weatherData.lat, weatherData.lng || weatherData.lon];
                mapInstance.flyTo(pos, 14, { animate: true, duration: 2.5 });
                
                if (markerInstance) markerInstance.remove();
                markerInstance = L.marker(pos).addTo(mapInstance);
                
                document.getElementById('sheet-content-placeholder').innerHTML = this.renderDrawer(weatherData, rawValue, hangares, weatherData.metar);
                document.getElementById('airportSheet').classList.add("visible");

            } catch (e) { 
                console.error(e);
                showToast("Verifique o código ICAO.");
            } finally { 
                if (btnBuscar) { btnBuscar.innerText = "BUSCAR"; btnBuscar.disabled = false; } 
            }
        };

        if (btnBuscar) btnBuscar.onclick = realizarBusca;
        if (icaoInput) {
            icaoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { realizarBusca(); icaoInput.blur(); } });
        }
    },

    renderDrawer(airport, icao, hangares, metar) {
        return `
            <div class="drawer-header-sticky" style="padding: 20px 20px 0 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0;">${airport.name || 'Aeródromo'}</h2>
                    <button onclick="document.getElementById('airportSheet').classList.remove('visible')" style="border:none; background: #f1f5f9; width: 32px; height: 32px; border-radius: 50%; color: #64748b; font-weight:bold;">✕</button>
                </div>
                <div style="background: #0f172a; padding: 15px; border-radius: 18px; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 0.8rem; color: #f8fafc; line-height: 1.4; font-family: monospace;">${metar || 'METAR indisponível'}</p>
                </div>
            </div>
            <div class="drawer-body" style="padding: 25px 20px 110px 20px;">
                <h3 style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px;">Hangares Disponíveis</h3>
                ${hangares?.length ? hangares.map(h => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 20px; border-radius: 18px; margin-bottom: 10px;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.5rem; font-weight: 800; color: #10b981; text-transform: uppercase;">✓ Ativo</span>
                            <strong style="color: #ffffff; font-size: 0.9rem;">${h.nome}</strong>
                        </div>
                        <button onclick="window.openHangarDetails('${h.id}')" style="background: #10b981; border: none; padding: 8px 14px; border-radius: 10px; font-weight: 800; color: white; cursor: pointer;">Detalhes</button>
                    </div>
                `).join("") : `<p style="text-align:center; color:#94a3b8;">Nenhum hangar disponível.</p>`}
            </div>
        `;
    }
};