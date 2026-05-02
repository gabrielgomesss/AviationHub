// src/views/mapview.js
const MapView = {
    render: async () => {
        return `
            <div id="map-container" style="height: 100vh; width: 100%; background: #1a1a1a; position: relative;">
                <div style="position: absolute; top: 20px; left: 20px; z-index: 100; color: white; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px;">
                    <h1>HangarHub - Mapa</h1>
                    <p>Selecione um hangar para reserva.</p>
                </div>
                <div id="map-placeholder" style="display: flex; justify-content: center; align-items: center; height: 100%;">
                    <p style="color: #4ecca3; font-size: 1.2rem;">[ Espaço reservado para o Mapa Leaflet/Google ]</p>
                </div>
            </div>
        `;
    },

    after_render: async () => {
        console.log("Mapa carregado com sucesso.");
        // Aqui você inicializaria o mapa no futuro
    }
};

export default MapView; // ESSA LINHA É OBRIGATÓRIA