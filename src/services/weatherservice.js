const API_KEY = "dbc89fb291f74509bc11b23786fa2f86";
const MOCK_MODE = true; // Altere para false quando quiser usar a API real

export const WeatherService = {
    async getAirportData(icao) {
        const icaoUpper = icao.toUpperCase().trim();

        if (MOCK_MODE) {
            console.log(`[WeatherService] Mock Mode Ativo para: ${icaoUpper}`);
            return this.getMockData(icaoUpper);
        }

        try {
            const stationRes = await fetch(`https://api.checkwx.com/station/${icaoUpper}`, {
                method: 'GET',
                headers: { 
                    "X-API-Key": API_KEY,
                    "Accept": "application/json"
                }
            });

            if (!stationRes.ok) throw new Error(`Erro API Station: ${stationRes.status}`);

            const stationJson = await stationRes.json();
            if (!stationJson.data || stationJson.data.length === 0) return null;

            const station = stationJson.data[0];

            // Busca METAR Decoded
            let metarRaw = "METAR INDISPONÍVEL";
            try {
                const metarRes = await fetch(`https://api.checkwx.com/metar/${icaoUpper}/decoded`, {
                    method: 'GET',
                    headers: { "X-API-Key": API_KEY }
                });
                if (metarRes.ok) {
                    const metarJson = await metarRes.json();
                    if (metarJson?.data?.length > 0) {
                        metarRaw = metarJson.data[0].raw_text;
                    }
                }
            } catch (e) { console.warn("Erro ao buscar METAR real."); }

            return {
                name: station.name,
                lat: station.geometry.coordinates[1],
                lon: station.geometry.coordinates[0],
                raw_text: metarRaw
            };

        } catch (err) {
            console.error("Erro Crítico CheckWX:", err);
            return null;
        }
    },

    // Função interna para simular a resposta da API
    getMockData(icao) {
        const mocks = {
            "SBJD": {
                name: "Jundiaí Airport",
                lat: -23.1816,
                lon: -46.9442,
                raw_text: "METAR SBJD 031800Z 15005KT 9999 FEW030 25/18 Q1018="
            },
            "SBSP": {
                name: "São Paulo / Congonhas",
                lat: -23.6261,
                lon: -46.6564,
                raw_text: "METAR SBSP 031800Z 12010KT 8000 SCT025 24/19 Q1017="
            },
            "SBGR": {
                name: "Guarulhos / Gov. André Franco Montoro",
                lat: -23.4356,
                lon: -46.4731,
                raw_text: "METAR SBGR 031800Z 14008KT 9999 BKN035 23/17 Q1018="
            }
        };

        // Retorna o mock específico ou um genérico se o ICAO não estiver na lista
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(mocks[icao] || {
                    name: `Aeródromo Simulado (${icao})`,
                    lat: -23.5505,
                    lon: -46.6333,
                    raw_text: `METAR ${icao} 031800Z 00000KT 9999 CLR 22/15 Q1013=`
                });
            }, 500); // Simula um pequeno delay de rede
        });
    }
};