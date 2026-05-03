const API_KEY = "dbc89fb291f74509bc11b23786fa2f86";

export const WeatherService = {

    async getAirportData(icao) {
        try {
            // 🔥 1. BUSCAR ESTAÇÃO (SEMPRE TEM COORDENADA)
            const stationRes = await fetch(`https://api.checkwx.com/station/${icao}`, {
                headers: { "X-API-Key": API_KEY }
            });

            const stationJson = await stationRes.json();

            console.log("STATION:", stationJson);

            if (!stationJson.data || stationJson.data.length === 0) {
                return null;
            }

            const station = stationJson.data[0];

            // 🔥 2. BUSCAR METAR (PODE NÃO TER)
            const metarRes = await fetch(`https://api.checkwx.com/metar/${icao}/decoded`, {
                headers: { "X-API-Key": API_KEY }
            });

            const metarJson = await metarRes.json();

            console.log("METAR:", metarJson);

            let metar = null;

            if (metarJson?.data?.length > 0) {
                metar = metarJson.data[0];
            }

            return {
                name: station.name,
                lat: station.geometry.coordinates[1],
                lon: station.geometry.coordinates[0],
                metar: metar
            };

        } catch (err) {
            console.error("Erro CheckWX:", err);
            return null;
        }
    }
};