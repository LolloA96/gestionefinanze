import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkroLyHVdHQEjnYnf2yLaE3jUhZCL4U0w",
  authDomain: "gestione-finanze-95e06.firebaseapp.com",
  projectId: "gestione-finanze-95e06",
  storageBucket: "gestione-finanze-95e06.firebasestorage.app",
  messagingSenderId: "229873840755",
  appId: "1:229873840755:web:5fe74e3199082d72f07006",
  measurementId: "G-QJH7V53NKJ"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const goLogin = document.getElementById('goLogin');
  const goSignUp = document.getElementById('goSignUp');

  goLogin.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  goSignUp.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  });

  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = signupForm.signupEmail.value;
    const password = signupForm.signupPassword.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        alert('Registrazione effettuata con successo!');
        signupForm.reset();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
      })
      .catch(error => {
        alert('Errore registrazione: ' + error.message);
      });
  });

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = loginForm.loginUser.value;
    const password = loginForm.loginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        alert('Accesso effettuato con successo!');
        loginForm.reset();
        window.location.href = 'index.html'; // o altra pagina
      })
      .catch(error => {
        alert('Errore accesso: ' + error.message);
      });
  });
});
