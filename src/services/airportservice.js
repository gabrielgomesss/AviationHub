const API_KEY = 'dbc89fb291f74509bc11b23786fa2f86';

export const AirportService = {

    // 🔥 MOCK INICIAL (depois trocamos por API real)
    async getAirportByIcao(icao) {

        const airports = {
            SBJD: { lat: -23.1817, lng: -46.9444, name: "Jundiaí" },
            SBSP: { lat: -23.6261, lng: -46.6564, name: "Congonhas" },
            SBGR: { lat: -23.4356, lng: -46.4731, name: "Guarulhos" }
        };

        return airports[icao.toUpperCase()] || null;
    }
};

// export const AirportService = {

//     async searchAirport(query) {
//         const res = await fetch(`https://api.checkwx.com/metar/${query}`, {
//             headers: {
//                 'X-API-Key': API_KEY
//             }
//         });

//         if (!res.ok) {
//             throw new Error("Erro ao buscar aeroporto");
//         }

//         const data = await res.json();

//         return data.data || [];
//     }
// };