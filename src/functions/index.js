const functions = require("firebase-functions");
const fetch = require("node-fetch");

const API_KEY = "dbc89fb291f74509bc11b23786fa2f86";

exports.getWeather = functions.https.onRequest(async (req, res) => {
    const icao = req.query.icao;

    if (!icao) {
        return res.status(400).json({ error: "ICAO obrigatório" });
    }

    try {
        const response = await fetch(`https://api.checkwx.com/metar/${icao}/decoded`, {
            headers: {
                "X-API-Key": API_KEY
            }
        });

        const data = await response.json();

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar clima" });
    }
});