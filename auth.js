// auth.js - gestione login / signup con Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/* -------------------------
   Firebase Config
   ------------------------- */
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

/* -------------------------
   DOM Ready
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const goLogin = document.getElementById('goLogin');   // bottone "vai a login"
  const goSignUp = document.getElementById('goSignUp'); // bottone "vai a registrazione"

  /* -------------------------
     Switch tra login e registrazione
     ------------------------- */
  if (goLogin && signupForm && loginForm) {
    goLogin.addEventListener('click', () => {
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });
  }

  if (goSignUp && signupForm && loginForm) {
    goSignUp.addEventListener('click', () => {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    });
  }

  /* -------------------------
     Registrazione
     ------------------------- */
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = signupForm.signupEmail?.value || '';
      const password = signupForm.signupPassword?.value || '';

      if (!email || !password) {
        alert('Inserisci email e password');
        return;
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          const user = userCredential.user;
          alert('✅ Registrazione effettuata con successo!');
          signupForm.reset();
          signupForm.classList.add('hidden');
          loginForm?.classList.remove('hidden');
        })
        .catch(error => {
          alert('❌ Errore registrazione: ' + (error.message || error.code));
        });
    });
  }

  /* -------------------------
     Login
     ------------------------- */
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const emailOrUser = loginForm.loginUser?.value || '';
      const password = loginForm.loginPassword?.value || '';

      if (!emailOrUser || !password) {
        alert('Inserisci credenziali valide');
        return;
      }

      signInWithEmailAndPassword(auth, emailOrUser, password)
        .then(userCredential => {
          alert('✅ Accesso effettuato!');
          loginForm.reset();
          // redirect alla home
          window.location.href = 'index.html';
        })
        .catch(error => {
          alert('❌ Errore accesso: ' + (error.message || error.code));
        });
    });
  }

  /* -------------------------
     Auth state listener
     ------------------------- */
  onAuthStateChanged(auth, user => {
    if (user) {
      // Utente loggato
      console.log("User loggato:", user.email);
      localStorage.setItem('gf_user_email', user.email || '');
      // Puoi anche salvare displayName o uid se ti serve
    } else {
      console.log("Nessun utente loggato.");
      localStorage.removeItem('gf_user_email');
    }
  });

  /* -------------------------
     Logout (se c'è il bottone)
     ------------------------- */
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth).then(() => {
        alert("Logout effettuato");
        window.location.href = 'login.html';
      }).catch((error) => {
        alert("Errore logout: " + (error.message || error.code));
      });
    });
  }
});