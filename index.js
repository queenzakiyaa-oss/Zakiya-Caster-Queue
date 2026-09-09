import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyBS1EibPsFe5MpY8Va0bAqza5mgOCS5ip8",
    authDomain: "zakiya-caster-queue.firebaseapp.com",
    projectId: "zakiya-caster-queue",
    storageBucket: "zakiya-caster-queue.firebasestorage.app",
    messagingSenderId: "131113806402",
    appId: "1:131113806402:web:87abeb6167bdd15d741bdb",
    measurementId: "G-J7QSMZRM84"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const servingNumber =
    document.querySelector(".serving-number");

const servingName =
    document.querySelector(".serving-info strong");

const servingBadge =
    document.querySelector(".serving-badge");

const totalValue =
    document.querySelector(".mini-card .mini-value");

const queueCount =
    document.querySelector(".queue-count span");

const queueList =
    document.querySelector(".queue-list");

const queueInput =
    document.getElementById("queueInput");

const checkButton =
    document.getElementById("checkButton");

const result =
    document.getElementById("result");


let allQueues = [];



/* =========================
   REALTIME FIRESTORE
========================= */

const queueQuery = query(
    collection(db, "queues"),
    orderBy("number", "asc")
);


onSnapshot(
    queueQuery,

    (snapshot) => {

        allQueues = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        updatePublicPage(allQueues);

    },

    (error) => {

        console.error(
            "Firebase queue error:",
            error
        );

        if (queueList) {

            queueList.innerHTML = `
                <div class="queue-row">
                    <div class="queue-person">
                        <strong>Gagal memuat antrian</strong>
                        <span>Silakan refresh halaman.</span>
                    </div>
                </div>
            `;

        }

    }
);



/* =========================
   UPDATE PUBLIC PAGE
========================= */

function updatePublicPage(queues) {

    const waiting =
        queues.filter(
            queue => queue.status === "waiting"
        );

    const serving =
        queues.filter(
            queue => queue.status === "serving"
        );

    /*
       Total yang sedang aktif.
       Antrian selesai tidak dihitung.
    */

    const activeQueues = [
        ...serving,
        ...waiting
    ];


    /* =========================
       NOW SERVING
    ========================= */

    if (serving.length > 0) {

        const current =
            serving[0];

        servingNumber.textContent =
            "#" + formatNumber(current.number);

        servingName.textContent =
            current.name || "Tanpa nama";

        servingBadge.textContent =
            "SEDANG DILAYANI";

    } else {

        servingNumber.textContent =
            "#---";

        servingName.textContent =
            "Belum ada antrian";

        servingBadge.textContent =
            "MENUNGGU";

    }



    /* =========================
       TOTAL
    ========================= */

    if (totalValue) {

        totalValue.textContent =
            activeQueues.length;

    }


    if (queueCount) {

        queueCount.textContent =
            activeQueues.length;

    }



    /* =========================
       QUEUE LIST
    ========================= */

    if (!activeQueues.length) {

        queueList.innerHTML = `
            <div class="queue-row">

                <div class="queue-index">
                    #---
                </div>

                <div class="queue-person">

                    <strong>
                        Belum ada antrian
                    </strong>

                    <span>
                        Menunggu antrian ditambahkan admin
                    </span>

                </div>

                <div class="queue-state waiting">

                    <span></span>
                    MENUNGGU

                </div>

            </div>
        `;

        return;

    }


    queueList.innerHTML =
        activeQueues.map(queue => {

            const isServing =
                queue.status === "serving";

            return `
                <div class="queue-row">

                    <div class="queue-index">
                        #${formatNumber(queue.number)}
                    </div>

                    <div class="queue-person">

                        <strong>
                            ${escapeHtml(queue.name)}
                        </strong>

                        <span>
                            ${
                                isServing
                                    ? "Sedang dilayani"
                                    : "Menunggu giliran"
                            }
                        </span>

                    </div>

                    <div class="queue-state ${
                        isServing
                            ? "serving"
                            : "waiting"
                    }">

                        <span></span>

                        ${
                            isServing
                                ? "DILAYANI"
                                : "MENUNGGU"
                        }

                    </div>

                </div>
            `;

        }).join("");

}



/* =========================
   CEK NOMOR ANTRIAN
========================= */

checkButton.addEventListener(
    "click",
    checkQueue
);


queueInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            checkQueue();

        }

    }
);


function checkQueue() {

    const number =
        Number(queueInput.value);


    if (!number) {

        result.innerHTML = `
            <div class="queue-row">
                <div class="queue-person">
                    <strong>
                        Masukkan nomor antrian
                    </strong>

                    <span>
                        Contoh: 12
                    </span>
                </div>
            </div>
        `;

        return;

    }


    const found =
        allQueues.find(
            queue =>
                Number(queue.number) === number
        );


    if (!found) {

        result.innerHTML = `
            <div class="queue-row">

                <div class="queue-person">

                    <strong>
                        Nomor #${formatNumber(number)}
                        tidak ditemukan
                    </strong>

                    <span>
                        Pastikan nomor yang kamu masukkan benar.
                    </span>

                </div>

            </div>
        `;

        return;

    }


    let statusText =
        "MENUNGGU";

    if (found.status === "serving") {

        statusText =
            "SEDANG DILAYANI";

    } else if (found.status === "done") {

        statusText =
            "SELESAI";

    }


    result.innerHTML = `
        <div class="queue-row">

            <div class="queue-index">
                #${formatNumber(found.number)}
            </div>

            <div class="queue-person">

                <strong>
                    ${escapeHtml(found.name)}
                </strong>

                <span>
                    Status: ${statusText}
                </span>

            </div>

            <div class="queue-state ${
                found.status === "serving"
                    ? "serving"
                    : "waiting"
            }">

                <span></span>

                ${statusText}

            </div>

        </div>
    `;

}



/* =========================
   FORMAT NOMOR
========================= */

function formatNumber(number) {

    return String(number)
        .padStart(3, "0");

}



/* =========================
   SECURITY
========================= */

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}
