import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
    apiKey: "AIzaSyBS1EibPsFe5MpY8Va0bAqza5mg0CS5ip8",
    authDomain: "zakiya-caster-queue.firebaseapp.com",
    projectId: "zakiya-caster-queue",
    storageBucket: "zakiya-caster-queue.firebasestorage.app",
    messagingSenderId: "131113806402",
    appId: "1:131113806402:web:87abeb6167bdd15d741bdb",
    measurementId: "G-J7QSMZRM84"
};


/* =========================
   INITIALIZE FIREBASE
========================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================
   ELEMENT
========================= */

const loginPanel = document.getElementById("loginPanel");

const adminPanel = document.getElementById("adminPanel");

const loginForm = document.getElementById("loginForm");

const queueForm = document.getElementById("queueForm");

const loginMessage = document.getElementById("loginMessage");

const queueMessage = document.getElementById("queueMessage");

const queueList = document.getElementById("queueList");

const adminEmail = document.getElementById("adminEmail");

const connectionStatus = document.getElementById("connectionStatus");

const waitingCount = document.getElementById("waitingCount");

const servingCount = document.getElementById("servingCount");

const doneCount = document.getElementById("doneCount");

const nowServing = document.getElementById("nowServing");


/* =========================
   LOGIN ADMIN
========================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginMessage.textContent = "Memproses login...";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginMessage.textContent = "";

    } catch (error) {

        console.error(error);

        loginMessage.textContent =
            "Login gagal. Periksa email dan password.";

    }

});


/* =========================
   LOGOUT
========================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await signOut(auth);

    });


/* =========================
   TAMBAH ANTRIAN
========================= */

queueForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    queueMessage.textContent = "";

    const number =
        Number(
            document.getElementById("queueNumber").value
        );

    const name =
        document
            .getElementById("queueName")
            .value
            .trim();


    if (!number || !name) {

        queueMessage.textContent =
            "Nomor dan nama wajib diisi.";

        return;

    }


    try {

        await addDoc(
            collection(db, "queues"),
            {

                number: number,

                name: name,

                status: "waiting",

                createdAt: serverTimestamp()

            }
        );


        queueForm.reset();

        queueMessage.style.color = "#4cf7a4";

        queueMessage.textContent =
            "Antrian berhasil ditambahkan.";

    } catch (error) {

        console.error(error);

        queueMessage.style.color = "#ff9aa8";

        queueMessage.textContent =
            "Gagal menambahkan antrian.";

    }

});


/* =========================
   CEK LOGIN
========================= */

onAuthStateChanged(auth, (user) => {

    if (user) {

        loginPanel.classList.add("hidden");

        adminPanel.classList.remove("hidden");

        adminEmail.textContent =
            user.email || "";

        startRealtimeQueue();

    } else {

        loginPanel.classList.remove("hidden");

        adminPanel.classList.add("hidden");

    }

});


/* =========================
   REALTIME FIRESTORE
========================= */

function startRealtimeQueue() {

    const queueQuery =
        query(
            collection(db, "queues"),
            orderBy("number", "asc")
        );


    onSnapshot(
        queueQuery,

        (snapshot) => {

            connectionStatus.textContent =
                "● REALTIME CONNECTED";

            const items =
                snapshot.docs.map((item) => ({

                    id: item.id,

                    ...item.data()

                }));


            renderQueue(items);

        },

        (error) => {

            console.error(error);

            connectionStatus.textContent =
                "CONNECTION ERROR";

        }

    );

}


/* =========================
   TAMPILKAN ANTRIAN
========================= */

function renderQueue(items) {

    const waiting =
        items.filter(
            item => item.status === "waiting"
        );


    const serving =
        items.filter(
            item => item.status === "serving"
        );


    const done =
        items.filter(
            item => item.status === "done"
        );


    waitingCount.textContent =
        waiting.length;

    servingCount.textContent =
        serving.length;

    doneCount.textContent =
        done.length;


    /* NOW SERVING */

    if (serving.length > 0) {

        const active =
            serving[0];


        nowServing.innerHTML = `

            <div>

                <span>
                    #${escapeHtml(active.number)}
                </span>

                <strong>
                    ${escapeHtml(active.name)}
                </strong>

            </div>

        `;

    } else {

        nowServing.innerHTML = `

            <div>

                <span>#---</span>

                <strong>
                    Belum ada antrian aktif
                </strong>

            </div>

        `;

    }


    /* EMPTY */

    if (items.length === 0) {

        queueList.innerHTML = `

            <div class="empty">

                Belum ada antrian.

            </div>

        `;

        return;

    }


    /* QUEUE LIST */

    queueList.innerHTML =
        items.map(item => {

            let statusText = "MENUNGGU";

            if (item.status === "serving") {

                statusText = "DILAYANI";

            }

            if (item.status === "done") {

                statusText = "SELESAI";

            }


            return `

                <div class="queue-item">

                    <div class="q-number">

                        #${escapeHtml(item.number)}

                    </div>


                    <div class="q-name">

                        <strong>

                            ${escapeHtml(item.name)}

                        </strong>

                        <span>

                            ${statusText}

                        </span>

                    </div>


                    <div class="q-actions">


                        ${
                            item.status !== "serving" &&
                            item.status !== "done"

                            ?

                            `

                            <button

                                class="call"

                                data-action="call"

                                data-id="${item.id}"

                            >

                                PANGGIL

                            </button>

                            `

                            :

                            ""

                        }


                        ${
                            item.status === "serving"

                            ?

                            `

                            <button

                                class="done"

                                data-action="done"

                                data-id="${item.id}"

                            >

                                SELESAI

                            </button>

                            `

                            :

                            ""

                        }


                        ${
                            item.status === "done"

                            ?

                            `

                            <button

                                data-action="waiting"

                                data-id="${item.id}"

                            >

                                KEMBALIKAN

                            </button>

                            `

                            :

                            ""

                        }


                        <button

                            class="delete"

                            data-action="delete"

                            data-id="${item.id}"

                        >

                            HAPUS

                        </button>


                    </div>

                </div>

            `;

        }).join("");

}


/* =========================
   TOMBOL ANTRIAN
========================= */

queueList.addEventListener("click", async (event) => {

    const button =
        event.target.closest("button");


    if (!button) return;


    const id =
        button.dataset.id;

    const action =
        button.dataset.action;


    try {


        /* HAPUS */

        if (action === "delete") {

            if (
                confirm(
                    "Hapus antrian ini?"
                )
            ) {

                await deleteDoc(
                    doc(db, "queues", id)
                );

            }

            return;

        }


        /* STATUS */

        let status = "waiting";


        if (action === "call") {

            status = "serving";

        }


        if (action === "done") {

            status = "done";

        }


        if (action === "waiting") {

            status = "waiting";

        }


        await updateDoc(

            doc(db, "queues", id),

            {

                status: status

            }

        );


    } catch (error) {

        console.error(error);

        alert(
            "Perubahan gagal. Pastikan akun kamu memiliki akses admin."
        );

    }

});


/* =========================
   SECURITY
   MENCEGAH HTML INJECTION
========================= */

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}
