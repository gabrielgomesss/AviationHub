const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const https = require("https");


if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();


// STRIPE
const PLANS = {
    parceiro: 'price_1TWZBkFBlnWfYBlqNyEbjvdZ', 
    piloto: 'price_1TWZCQFBlnWfYBlqm7iiDCvK',     
    admin_hangar: 'price_1TWZCQFBlnWfYBlqm7iiDCvK'     
};

exports.createStripeCheckout = onCall({ 
    cors: true, // Isso resolve o erro de CORS se a função carregar com sucesso
    region: "us-central1",
    secrets: ["STRIPE_SECRET_KEY"]
}, async (request) => {
    const { email, role } = request.data || {};
    
    if (!email || !role) {
        throw new HttpsError("invalid-argument", "Email e Role são obrigatórios.");
    }

    try {
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        const stripe = require('stripe')(stripeSecret);
        const session = await stripe.checkout.sessions.create({
            customer_email: email.trim().toLowerCase(),
            payment_method_types: ['card'],
            line_items: [{
                price: PLANS[role],
                quantity: 1,
            }],
            mode: 'subscription',
            // URLs de retorno (ajustadas para o seu ambiente local conforme o log)
            success_url: 'https://aviationhub1.netlify.app/#/payment-success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://aviationhub1.netlify.app/#/register',
            // success_url: 'http://127.0.0.1:5501/#/payment-success?session_id={CHECKOUT_SESSION_ID}',
            // cancel_url: 'http://127.0.0.1:5501/#/register',
        });

        return { url: session.url };
    } catch (error) {
        console.error("Erro no Stripe:", error);
        throw new HttpsError("internal", error.message);
    }
});

// Mantendo as outras funções (savePartnerProfile, etc)
exports.savePartnerProfile = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    const { userId, profileData } = request.data || {};
    try {
        await db.collection("users").doc(userId).set({
            ...profileData,
            lastUpdate: FieldValue.serverTimestamp(),
            uid: userId 
        }, { merge: true });
        return { success: true };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

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

    const cleanIcao = icao.toUpperCase().trim();

    try {
        const stationUrl = `https://api.checkwx.com/station/${cleanIcao}`;
        const stationResult = await fetchFromCheckWX(stationUrl, process.env.CHECKWX_API_KEY);

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
            const metarResult = await fetchFromCheckWX(metarUrl, process.env.CHECKWX_API_KEY);
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

exports.createReserva = onCall({ cors: true, region: "us-central1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    try {
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        const userData = userDoc.data();
        
        // Garante a recuperação do nome usando fallback seguro para não gerar undefined
        const nomeUsuario = userData ? (userData.display_name || userData.displayName || "Usuário Desconhecido") : "Usuário Desconhecido";

        // Remove dinamicamente qualquer propriedade 'undefined' enviada pelo formulário frontend
        const dadosSanitizados = {};
        if (request.data) {
            Object.keys(request.data).forEach(key => {
                if (request.data[key] !== undefined) {
                    dadosSanitizados[key] = request.data[key];
                } else {
                    dadosSanitizados[key] = ""; // Substitui por string vazia para aceitação no Firestore
                }
            });
        }

        const rRef = db.collection("reservas").doc();
        await rRef.set({
            ...dadosSanitizados,
            clienteId: request.auth.uid,
            nomeUsuario: nomeUsuario,
            status: "pendente",
            createdAt: FieldValue.serverTimestamp()
        });
        
        return { id: rRef.id, success: true };
    } catch (e) {
        console.error("Erro interno ao salvar reserva no Firestore:", e);
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
            lida: false, // <--- MUITO IMPORTANTE: Isso ativa a bolinha vermelha no front do piloto
            lidaPeloPiloto: false,
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

// ======================================================
// NOTIFICAÇÕES: RESERVAS PENDENTES (PARA ADMIN)
// ======================================================
exports.getPendingReservationsCount = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    try {
        const snapshot = await db.collection("reservas")
            .where("hangarId", "==", request.data.hangarId)
            .where("status", "==", "pendente")
            .get();
            
        return { count: snapshot.size };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});

// ======================================================
// NOTIFICAÇÕES: ATUALIZAÇÕES PARA O PILOTO
// ======================================================
exports.getPilotNotificationCount = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    try {
        // Busca reservas do piloto que não estão mais como 'pendente' 
        // e que ele ainda não "visualizou" (exemplo de lógica)
        const snapshot = await db.collection("reservas")
            .where("pilotoId", "==", request.auth.uid)
            .where("status", "in", ["aprovada", "recusada"])
            .where("lidaPeloPiloto", "==", false)
            .get();
            
        return { count: snapshot.size };
    } catch (e) {
        throw new HttpsError("internal", e.message);
    }
});
// ======================================================
// 11. MARCAR NOTIFICAÇÕES DO PILOTO COMO LIDAS
// ======================================================
exports.marcarReservasComoLidas = onCall({ cors: true, region: "us-central1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Acesso negado.");
    
    try {
        // Busca todas as reservas do piloto que precisam ser limpas
        const snapshot = await db.collection("reservas")
            .where("clienteId", "==", request.auth.uid)
            .where("lida", "==", false)
            .where("status", "in", ["aprovada", "recusada", "aprovado", "recusado"])
            .get();

        if (snapshot.empty) {
            return { success: true, updated: 0 };
        }

        const batch = db.batch();

        snapshot.forEach(doc => {
            batch.update(doc.ref, { 
                lida: true,
                lidaPeloPiloto: true 
            });
        });

        await batch.commit();
        return { success: true, updated: snapshot.size };
    } catch (e) {
        console.error("Erro na Cloud Function marcarReservasComoLidas:", e);
        throw new HttpsError("internal", e.message);
    }
});