// firebaseConfig.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkQ-ZSrxaQNLRMe6ogXUHpgax4tzfHSiA",
  authDomain: "ramdev-hardware.firebaseapp.com",
  projectId: "ramdev-hardware",
  storageBucket: "ramdev-hardware.firebasestorage.app",
  messagingSenderId: "228198129735",
  appId: "1:228198129735:web:7b8469d483dfeaa6c21162",
  measurementId: "G-E47CXNVPJP"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
