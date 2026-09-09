import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
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


const firebaseConfig = {
    apiKey: "AIzaSyBS1EibPsFe5MpY8Va0bAqza5mg0CS5ip8",
    authDomain: "zakiya-caster-queue.firebaseapp.com",
    projectId: "zakiya-caster-queue",
    storageBucket: "zakiya-caster-queue.firebasestorage.app",
    messagingSenderId: "131113806402",
    appId: "1:131113806402:web:87abeb6167bdd15d741bdb",
    measurementId: "G-J7QSMZRM84"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


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
   LOGIN
========================= */

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    loginMessage.style.color = "#9ca8c7";
    loginMessage.textContent = "Memproses login...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginMessage.textContent = "";

    } catch (error) {

        console.error(error);

        loginMessage.style.color = "#ff9aa8";

        if (error.code === "auth/invalid-credential") {

            loginMessage.textContent =
                "Email atau password salah.";

        } else if (error.code === "auth/invalid-email") {

            loginMessage.textContent =
                "Format email tidak valid.";

        } else if (error.code === "auth/too-many-requests") {

            loginMessage.textContent =
                "Terlalu banyak percobaan. Coba lagi nanti.";

        } else {

            loginMessage.textContent =
                "Login gagal. Periksa email dan password.";
        }
    }
});



/* =========================
   LUPA PASSWORD
========================= */

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");


if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener("click", async () => {

        const email =
            document.getElementById("email").value.trim();


        if (!email) {

            loginMessage.style.color = "#ff9aa8";

            loginMessage.textContent =
                "Masukkan email terlebih dahulu.";

            return;
        }


        loginMessage.style.color = "#9ca8c7";

        loginMessage.textContent =
            "Mengirim email reset password...";


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );

            loginMessage.style.color = "#4cf7a4";

            loginMessage.textContent =
                "Email reset password sudah dikirim. Cek inbox dan folder spam.";

        } catch (error) {

            console.error(error);

            loginMessage.style.color = "#ff9aa8";


            if (error.code === "auth/user-not-found") {

                loginMessage.textContent =
                    "Email tersebut belum terdaftar.";

            } else if (error.code === "auth/invalid-email") {

                loginMessage.textContent =
                    "Format email tidak valid.";

            } else {

                loginMessage.textContent =
                    "Gagal mengirim email reset password. Coba lagi.";
            }
        }

    });

}



/* =========================
   LOGOUT
========================= */

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        signOut(auth);

    });

}



/* =========================
   TAMBAH ANTRIAN
========================= */

queueForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    queueMessage.textContent = "";

    const number =
        Number(
            document.getElementById("queueNumber").value
        );

    const name =
        document.getElementById("queueName").value.trim();


    if (!number || !name) {

        queueMessage.style.color = "#ff9aa8";

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
            "Gagal menambah. Pastikan akunmu adalah admin.";
    }

});



/* =========================
   AUTH STATE
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
   REALTIME QUEUE
========================= */

function startRealtimeQueue() {

    const q = query(
        collection(db, "queues"),
        orderBy("number", "asc")
    );


    onSnapshot(
        q,

        (snapshot) => {

            connectionStatus.textContent =
                "● REALTIME CONNECTED";


            const items =
                snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data()
                }));


            renderQueue(items);

        },

        (error) => {

            connectionStatus.textContent =
                "CONNECTION ERROR";

            console.error(error);

        }
    );

}



/* =========================
   RENDER QUEUE
========================= */

function renderQueue(items) {

    const waiting =
        items.filter(
            x => x.status === "waiting"
        );

    const serving =
        items.filter(
            x => x.status === "serving"
        );

    const done =
        items.filter(
            x => x.status === "done"
        );


    waitingCount.textContent =
        waiting.length;

    servingCount.textContent =
        serving.length;

    doneCount.textContent =
        done.length;



    /* NOW SERVING */

    if (serving.length) {

        const active = serving[0];

        nowServing.innerHTML = `
            <div>
                <span>#${escapeHtml(active.number)}</span>
                <strong>${escapeHtml(active.name)}</strong>
            </div>
        `;

    } else {

        nowServing.innerHTML = `
            <div>
                <span>#---</span>
                <strong>Belum ada antrian aktif</strong>
            </div>
        `;

    }



    /* EMPTY */

    if (!items.length) {

        queueList.innerHTML =
            `<div class="empty">Belum ada antrian.</div>`;

        return;
    }



    /* QUEUE LIST */

    queueList.innerHTML = items.map(item => {

        const statusText =
            item.status === "waiting"
                ? "MENUNGGU"
                : item.status === "serving"
                ? "DILAYANI"
                : "SELESAI";


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
                            data-id="${item.id}">
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
                            data-id="${item.id}">
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
                            data-id="${item.id}">
                            KEMBALIKAN
                        </button>
                        `
                        :
                        ""
                    }


                    <button
                        class="delete"
                        data-action="delete"
                        data-id="${item.id}">
                        HAPUS
                    </button>

                </div>

            </div>
        `;

    }).join("");

}



/* =========================
   BUTTON QUEUE
========================= */

queueList.addEventListener("click", async (e) => {

    const button =
        e.target.closest("button");


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

        const status =
            action === "call"
                ? "serving"
                : action === "done"
                ? "done"
                : "waiting";


        await updateDoc(
            doc(db, "queues", id),
            {
                status: status
            }
        );


    } catch (error) {

        console.error(error);

        alert(
            "Perubahan gagal. Pastikan akunmu adalah admin."
        );

    }

});



/* =========================
   HTML SECURITY
========================= */

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}
