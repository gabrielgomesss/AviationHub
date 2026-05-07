/**
 * AirportService
 * Responsável por gerenciar dados estáticos e auxiliares de aeroportos.
 * A busca de dados em tempo real (METAR/Coordenadas) foi movida para o 
 * WeatherService via Netlify Functions por segurança[cite: 8, 9].
 */

export const AirportService = {

    /**
     * Retorna dados básicos de aeroportos comuns (Fallback ou Mock)
     * Útil para testes rápidos ou preenchimento de campos sem busca na rede.
     */
    async getAirportByIcao(icao) {
        const airports = {
            SBJD: { lat: -23.1817, lng: -46.9444, name: "Jundiaí" },
            SBSP: { lat: -23.6261, lng: -46.6564, name: "Congonhas" },
            SBGR: { lat: -23.4356, lng: -46.4731, name: "Guarulhos" }
        };

        return airports[icao.toUpperCase()] || null;
    },

    /**
     * Formata o nome do aeroporto para exibição padrão
     */
    formatAirportName(name) {
        if (!name) return "Aeroporto Desconhecido";
        return name.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
};