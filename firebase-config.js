// firebase-config.js
// Configuração do projeto Firebase CETEC

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTWt0dnSKlVi_W66ynRo6tC7PdNRUMXnM",
  authDomain: "cetec-3a52c.firebaseapp.com",
  projectId: "cetec-3a52c",
  storageBucket: "cetec-3a52c.firebasestorage.app",
  messagingSenderId: "14887050709",
  appId: "1:14887050709:web:12ff768563c1229481315c",
  measurementId: "G-63YYK83QEY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
