import { AuthService } from '../src/services/authservice.js';
import { HangarService } from '../src/services/hangarservice.js';
import { db } from '../src/services/firebase-config.js';

import {
    collection,
    query,
    where,
    onSnapshot
} from "../src/services/firebase-config.js";

let unsubscribeReservas = null;

const Navbar = {

render: () => {

    const user = AuthService.getUser();

    return `
        <div class="bottom-nav" id="main-nav">

            <!-- MAPA -->
            <button id="nav-map">
                <svg viewBox="0 0 24 24" class="nav-icon">
                    <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/>
                </svg>
                <span>Mapa</span>
            </button>

            ${
                user?.permissions?.canEditReservations
                ? `
                    <!-- CRIAR -->
                    <button id="nav-create">
                        <svg viewBox="0 0 24 24" class="nav-icon">
                            <path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6z"/>
                        </svg>
                        <span>Novo hangar</span>
                    </button>

                    <!-- HANGARES -->
                    <button id="nav-manage">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 128C512 92.7 483.3 64 448 64L192 64zM304 416L336 416C353.7 416 368 430.3 368 448L368 528L272 528L272 448C272 430.3 286.3 416 304 416zM224 176C224 167.2 231.2 160 240 160L272 160C280.8 160 288 167.2 288 176L288 208C288 216.8 280.8 224 272 224L240 224C231.2 224 224 216.8 224 208L224 176zM368 160L400 160C408.8 160 416 167.2 416 176L416 208C416 216.8 408.8 224 400 224L368 224C359.2 224 352 216.8 352 208L352 176C352 167.2 359.2 160 368 160zM224 304C224 295.2 231.2 288 240 288L272 288C280.8 288 288 295.2 288 304L288 336C288 344.8 280.8 352 272 352L240 352C231.2 352 224 344.8 224 336L224 304zM368 288L400 288C408.8 288 416 295.2 416 304L416 336C416 344.8 408.8 352 400 352L368 352C359.2 352 352 344.8 352 336L352 304C352 295.2 359.2 288 368 288z"/></svg>
                        <span>Meus hangares</span>
                    </button>

                    <!-- DASHBOARD -->
                    <button id="nav-dashboard">
<svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM384 416C384 389.1 367.5 366.1 344 356.7L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184L296 356.7C272.5 366.2 256 389.2 256 416C256 451.3 284.7 480 320 480C355.3 480 384 451.3 384 416zM208 240C225.7 240 240 225.7 240 208C240 190.3 225.7 176 208 176C190.3 176 176 190.3 176 208C176 225.7 190.3 240 208 240zM192 320C192 302.3 177.7 288 160 288C142.3 288 128 302.3 128 320C128 337.7 142.3 352 160 352C177.7 352 192 337.7 192 320zM480 352C497.7 352 512 337.7 512 320C512 302.3 497.7 288 480 288C462.3 288 448 302.3 448 320C448 337.7 462.3 352 480 352zM464 208C464 190.3 449.7 176 432 176C414.3 176 400 190.3 400 208C400 225.7 414.3 240 432 240C449.7 240 464 225.7 464 208z"/></svg>

                        <span>Dashboard</span>

                        <span id="badge">0</span>
                    </button>
                  `
                : ''
            }

            <!-- LOGOUT -->
            <button id="nav-logout">
                <svg viewBox="0 0 24 24" class="nav-icon">
                    <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-14H11v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                </svg>
                <span>Sair</span>
            </button>

        </div>
    `;
},

after_render: async () => {

    document.getElementById('nav-map')?.addEventListener('click', () => {
        window.navigate('/');
    });

    document.getElementById('nav-create')?.addEventListener('click', () => {
        window.navigate('/create-hangar');
    });

    document.getElementById('nav-manage')?.addEventListener('click', () => {
        window.navigate('/hangares');
    });

    document.getElementById('nav-logout')?.addEventListener('click', async () => {
        await AuthService.logout();
        window.navigate('/login');
    });

    const user = AuthService.getUser();

    if (!user?.uid) return;

    const hangares = await HangarService.getMyHangares();
    if (!hangares.length) return;

    const hangarIds = hangares.map(h => h.id);

    const q = query(
        collection(db, "reservas"),
        where("hangarId", "in", hangarIds),
        where("status", "==", "aguardando_pagamento")
    );

    const badge = document.getElementById("badge");

    unsubscribeReservas = onSnapshot(q, (snapshot) => {

        const count = snapshot.size;

        if (count > 0) {
            badge.style.display = "inline-flex";
            badge.innerText = count;
        } else {
            badge.style.display = "none";
        }
    });

    document.getElementById('nav-dashboard')?.addEventListener('click', () => {
        const hangar = hangares[0];
        window.navigate(`/hangar-dashboard?hangarId=${hangar.id}`);
    });
}

};

export default Navbar;