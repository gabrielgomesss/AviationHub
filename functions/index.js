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

    const API_KEY = "dbc89fb291f74509bc11b23786fa2f86";
    const cleanIcao = icao.toUpperCase().trim();

    try {
        const stationUrl = `https://api.checkwx.com/station/${cleanIcao}`;
        const stationResult = await fetchFromCheckWX(stationUrl, API_KEY);

        if (!stationResult.data || stationResult.data.length === 0) {
            throw new HttpsError("not-found", `Aeródromo ${cleanIcao} não encontrado.`);
        }

        const station = stationResult.data[0];
        let lat = null;
        let lon = null;

        if (station.geometry && station.geometry.coordinates) {
            lon = parseFloat(station.geometry.coordinates[0]);
            lat = parseFloat(station.geometry.coordinates[1]);
        } else if (station.latitude && station.longitude) {
            lat = parseFloat(station.latitude);
            lon = parseFloat(station.longitude);
        }

        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
            throw new HttpsError("data-loss", "Aeródromo localizado, mas sem coordenadas geográficas válidas.");
        }

        let metar = "METAR não disponível no momento.";
        try {
            const metarUrl = `https://api.checkwx.com/metar/${cleanIcao}/decoded`;
            const metarResult = await fetchFromCheckWX(metarUrl, API_KEY);
            if (metarResult.data && metarResult.data.length > 0) {
                metar = metarResult.data[0].raw_text;
            }
        } catch (e) {
            console.warn(`Erro ao buscar METAR para ${cleanIcao}.`);
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
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Erro interno.");
    }
});

// ======================================================
// 2. ATUALIZAR HANGAR
// ======================================================
exports.updateHangar = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const { id, ...dados } = request.data || {};
    if (!id) throw new HttpsError("invalid-argument", "ID do hangar é obrigatório.");

    try {
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
// 4. CRIAR RESERVA (Atualizada com nomeUsuario)
// ======================================================
exports.createReserva = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    try {
<<<<<<< HEAD
        // Busca os dados do usuário para pegar o nome
=======
>>>>>>> adição de módulos, ajustes de layout e inclusão de RDN em reservas - Stable
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        const userData = userDoc.data();
        const nomeUsuario = userData ? userData.display_name : "Usuário Desconhecido";

        const rRef = db.collection("reservas").doc();
        await rRef.set({
            ...request.data,
            clienteId: request.auth.uid,
<<<<<<< HEAD
            nomeUsuario: nomeUsuario, // Salvando o nome de quem reservou
=======
            nomeUsuario: nomeUsuario,
>>>>>>> adição de módulos, ajustes de layout e inclusão de RDN em reservas - Stable
            status: "pendente",
            createdAt: FieldValue.serverTimestamp()
        });
        return { id: rRef.id, success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 5. LISTAR MINHAS RESERVAS (Nova: Busca Segura por Cliente)
// ======================================================
exports.getMinhasReservas = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");

    try {
        const snapshot = await db.collection("reservas")
            .where("clienteId", "==", request.auth.uid)
            .orderBy("createdAt", "desc")
            .get();
            
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 6. ATUALIZAR STATUS DA RESERVA (Nova: Com mensagem do Admin)
// ======================================================
exports.updateReservaStatus = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const { id, status, msgAdmin } = request.data || {};
    if (!id || !status) throw new HttpsError("invalid-argument", "ID e Status são obrigatórios.");

    try {
        await db.collection("reservas").doc(id).update({
            status: status,
            msgAdmin: msgAdmin || "",
            updatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 7. LISTAR HANGARES POR ICAO
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

// ======================================================
// 8. PILOTHUB: BUSCAR PERFIL DO PILOTO
// ======================================================
exports.getPilotProfile = onCall({ cors: true }, async (request) => {
    const { userId } = request.data || {};
    if (!userId) throw new HttpsError("invalid-argument", "ID do usuário é obrigatório.");

    try {
        const doc = await db.collection("pilotos").doc(userId).get();
        return doc.exists ? doc.data() : null;
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 9. PILOTHUB: SALVAR/ATUALIZAR PERFIL
// ======================================================
exports.savePilotProfile = onCall({ cors: true , memory: "1GiB" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const { userId, profileData } = request.data || {};
    if (!userId) throw new HttpsError("invalid-argument", "ID do usuário é obrigatório.");

    try {
        await db.collection("pilotos").doc(userId).set({
            ...profileData,
            lastUpdate: FieldValue.serverTimestamp(),
            uid: userId 
        }, { merge: true });
        return { success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 10. PILOTHUB: LISTAR TODOS OS PILOTOS
// ======================================================
exports.getAllPilots = onCall({ cors: true,  }, async (request) => {
    try {
        const snapshot = await db.collection("pilotos")
            .orderBy("lastUpdate", "desc")
            .limit(50)
            .get();
            
        return snapshot.docs.map(doc => doc.data());
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 11. PARTNERHUB: BUSCAR PERFIL DO PARCEIRO
// ======================================================
exports.getPartnerProfile = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const { userId } = request.data || {};
    if (!userId) throw new HttpsError("invalid-argument", "ID do usuário é obrigatório.");

    try {
        const doc = await db.collection("parceiros").doc(userId).get();
        return doc.exists ? doc.data() : null;
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 12. PARTNERHUB: SALVAR/ATUALIZAR PERFIL DO PARCEIRO
// ======================================================
exports.savePartnerProfile = onCall({ cors: true, memory: "1GiB" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    const { userId, profileData } = request.data || {};
    if (!userId) throw new HttpsError("invalid-argument", "ID do usuário é obrigatório.");

    try {
        // Salva na coleção "parceiros" e garante que o campo 'active' exista
        await db.collection("parceiros").doc(userId).set({
            ...profileData,
            lastUpdate: FieldValue.serverTimestamp(),
            uid: userId 
        }, { merge: true });

        // Opcional: Se quiser garantir que a role no Auth/Users também seja atualizada, 
        // você pode adicionar essa lógica aqui ou via Admin SDK.
        
        return { success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// 13. PARTNERHUB: LISTAR TODOS OS PARCEIROS
// ======================================================
exports.getAllPartners = onCall({ cors: true }, async (request) => {
    try {
        // Retorna parceiros ordenados pela última atualização
        const snapshot = await db.collection("parceiros")
            .orderBy("lastUpdate", "desc")
            .limit(100)
            .get();
            
        return snapshot.docs.map(doc => doc.data());
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});