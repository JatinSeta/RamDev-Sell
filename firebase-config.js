import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkQ-ZSrxaQNLRMe6ogXUHpgax4tzfHSiA",
  authDomain: "ramdev-hardware.firebaseapp.com",
  projectId: "ramdev-hardware",
  storageBucket: "ramdev-hardware.appspot.com",
  messagingSenderId: "228198129735",
  appId: "1:228198129735:web:7b8469d483dfeaa6c21162",
  measurementId: "G-E47CXNVPJP"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
