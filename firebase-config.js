import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase project configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAkQ-ZSrxaQNLRMe6ogXUHpgax4tzfHSiA",
  authDomain: "ramdev-hardware.firebaseapp.com",
  projectId: "ramdev-hardware",
  storageBucket: "ramdev-hardware.appspot.com",
  messagingSenderId: "228198129735",
  appId: "1:228198129735:web:7b8469d483dfeaa6c21162",
  measurementId: "G-E47CXNVPJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (optional)
const db = getFirestore(app);

// Export them so other files can use
export { app, db };
