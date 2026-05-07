const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const https = require("https");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Helper para realizar chamadas de API externas usando o módulo nativo HTTPS.
 * Resolve problemas de compatibilidade do 'fetch' em diferentes versões do Node.
 */
function fetchFromCheckWX(url, apiKey) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { "X-API-Key": apiKey },
            timeout: 10000 
        };

        https.get(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("Erro ao processar resposta JSON da API."));
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

// ======================================================
// 1. BUSCAR CLIMA E COORDENADAS (getWeather)
// ======================================================
exports.getWeather = onCall({ cors: true }, async (request) => {
    const { icao } = request.data || {};
    if (!icao) throw new HttpsError("invalid-argument", "O código ICAO é obrigatório.");

    // Substitua pela sua chave real da CheckWX
    const API_KEY = "dbc89fb291f74509bc11b23786fa2f86";
    const cleanIcao = icao.toUpperCase().trim();

    try {
        // Passo A: Buscar informações da estação (Aeródromo)
        const stationUrl = `https://api.checkwx.com/station/${cleanIcao}`;
        const stationResult = await fetchFromCheckWX(stationUrl, API_KEY);

        if (!stationResult.data || stationResult.data.length === 0) {
            throw new HttpsError("not-found", `Aeródromo ${cleanIcao} não encontrado.`);
        }

        const station = stationResult.data[0];
        let lat = null;
        let lon = null;

        // EXTRAÇÃO GEOJSON: A CheckWX coloca as coordenadas em geometry.coordinates
        // Padrão GeoJSON: [0] = Longitude, [1] = Latitude
        if (station.geometry && station.geometry.coordinates) {
            lon = parseFloat(station.geometry.coordinates[0]);
            lat = parseFloat(station.geometry.coordinates[1]);
        } 
        // Fallback: Tenta buscar na raiz se existir
        else if (station.latitude && station.longitude) {
            lat = parseFloat(station.latitude);
            lon = parseFloat(station.longitude);
        }

        // Validação final das coordenadas
        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
            console.error(`Falha de coordenadas para ${cleanIcao}:`, station);
            throw new HttpsError("data-loss", "Aeródromo localizado, mas sem coordenadas geográficas válidas.");
        }

        // Passo B: Buscar METAR decodificado (Clima)
        let metar = "METAR não disponível no momento.";
        try {
            const metarUrl = `https://api.checkwx.com/metar/${cleanIcao}/decoded`;
            const metarResult = await fetchFromCheckWX(metarUrl, API_KEY);
            if (metarResult.data && metarResult.data.length > 0) {
                metar = metarResult.data[0].raw_text;
            }
        } catch (e) {
            console.warn(`Erro ao buscar METAR para ${cleanIcao} (não crítico).`);
        }

        return {
            icao: cleanIcao,
            name: station.name || "Aeródromo Desconhecido",
            lat: lat,
            lon: lon,
            raw_text: metar,
            city: station.city || ""
        };

    } catch (error) {
        console.error("Erro na Function getWeather:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Erro interno ao buscar dados do aeroporto.");
    }
});

// ======================================================
// 2. ATUALIZAR HANGAR (Com correção de Preço)
// ======================================================
exports.updateHangar = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const { id, ...dados } = request.data || {};
    if (!id) throw new HttpsError("invalid-argument", "ID do hangar é obrigatório.");

    try {
        // Garante que o preço seja gravado como Number
        if (dados.preco !== undefined) {
            dados.preco = parseFloat(String(dados.preco).replace(',', '.'));
        }

        const hangarRef = db.collection("Hangares").doc(id);
        await hangarRef.update({
            ...dados,
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 3. CRIAR HANGAR COM VÍNCULO DE ADMIN
// ======================================================
exports.createHangarWithLink = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login necessário.");
    
    const uid = request.auth.uid;
    const { nome, icao, servicos } = request.data || {};

    try {
        return await db.runTransaction(async (t) => {
            const hRef = db.collection("Hangares").doc();
            const uRef = db.collection("users").doc(uid);

            t.set(hRef, {
                admins: [uid],
                createdAt: FieldValue.serverTimestamp(),
                icao: icao ? icao.toUpperCase() : "",
                nome,
                ownerId: uid,
                servicos: servicos || []
            });

            t.set(uRef, { managed_hangars: FieldValue.arrayUnion(hRef.id) }, { merge: true });
            return { id: hRef.id, success: true };
        });
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 4. CRIAR RESERVA
// ======================================================
exports.createReserva = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    try {
        const rRef = db.collection("reservas").doc();
        await rRef.set({
            ...request.data,
            clienteId: request.auth.uid,
            status: "pendente",
            createdAt: FieldValue.serverTimestamp()
        });
        return { id: rRef.id, success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 5. LISTAR HANGARES POR ICAO
// ======================================================
exports.getHangaresByIcao = onCall({ cors: true }, async (request) => {
    const { icao } = request.data || {};
    if (!icao) throw new HttpsError("invalid-argument", "ICAO obrigatório.");

    try {
        const snapshot = await db.collection("Hangares")
            .where("icao", "==", icao.toUpperCase())
            .get();
            
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});