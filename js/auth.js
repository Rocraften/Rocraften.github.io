// js/auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Successful login – redirect to home page
      window.location.href = "index.html";
    })
    .catch((error) => {
      // If sign-in fails, attempt to register the user
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          window.location.href = "index.html";
        })
        .catch((err) => {
          errorMessage.innerText = err.message;
        });
    });
});
