// auth.js
// Gestione login/signup + controllo autenticazione

// --- UTILS ---
function saveUserSession(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function getUserSession() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function clearUserSession() {
  localStorage.removeItem("currentUser");
}

// --- LOGIN/SIGNUP ---
const loginForm = document.getElementById("formLogin");
const signupForm = document.getElementById("formSignup");
const goLoginBtn = document.getElementById("goLogin");
const goSignUpBtn = document.getElementById("goSignUp");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = {
      username: loginForm.loginUser.value,
      email: loginForm.loginUser.value,
    };
    saveUserSession(user);
    window.location.href = "index.html";
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = {
      username: signupForm.signupUser.value,
      email: signupForm.signupEmail.value,
    };
    saveUserSession(user);
    window.location.href = "index.html";
  });
}

// Switch pannelli
if (goLoginBtn && goSignUpBtn) {
  goSignUpBtn.addEventListener("click", () => {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.remove("hidden");
  });
  goLoginBtn.addEventListener("click", () => {
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
  });
}

// --- PROTECTED PAGES ---
function checkAuth() {
  const user = getUserSession();
  if (!user) {
    if (!window.location.href.includes("login.html")) {
      window.location.href = "login.html";
    }
  } else {
    document.body.classList.remove("hidden");
    const uName = document.getElementById("userName");
    if (uName) uName.textContent = user.username;
  }
}

checkAuth();