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
            <div style="
                width:100%;
                background:#222;
                color:#fff;
                padding:10px;
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">
                <div>
                    <strong>AviationHub</strong>
                </div>

                <div>
                    <button id="nav-map">Mapa</button>

                    ${
                        user?.permissions?.canEditReservations
                        ? `
                            <button id="nav-create">Criar Hangar</button>
                            <button id="nav-manage">Meus Hangares</button>

                            <button id="nav-dashboard">
                                Dashboard
                                <span id="badge" style="
                                    background:red;
                                    border-radius:10px;
                                    padding:2px 6px;
                                    margin-left:6px;
                                    font-size:12px;
                                    display:none;
                                ">0</span>
                            </button>
                          `
                        : ''
                    }

                    <button id="nav-logout">Logout</button>
                </div>
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

        // 🔥 BADGE EM TEMPO REAL
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
                badge.style.display = "inline-block";
                badge.innerText = count;
            } else {
                badge.style.display = "none";
            }
        });

        document.getElementById('nav-dashboard')?.addEventListener('click', async () => {

            const hangar = hangares[0];
            window.navigate(`/hangar-dashboard?hangarId=${hangar.id}`);
        });
    }
};

export default Navbar;