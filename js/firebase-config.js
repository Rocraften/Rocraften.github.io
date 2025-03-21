// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAn1XNTCpTNw6ezx1wl_OMx0qGEYzZBug",
  authDomain: "rocraftengithub.firebaseapp.com",
  projectId: "rocraftengithub",
  storageBucket: "rocraftengithub.firebasestorage.app",
  messagingSenderId: "659589454843",
  appId: "1:659589454843:web:7f9eb31e15adf49f69c95e",
  measurementId: "G-3RB426FKWQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
