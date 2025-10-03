// profile.js
// Gestione profilo utente + logout

function getUserSession() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function clearUserSession() {
  localStorage.removeItem("currentUser");
}

const user = getUserSession();
if (!user) window.location.href = "login.html";
else document.body.classList.remove("hidden");

// --- RENDER DATI ---
document.getElementById("profileFullName").textContent = user.username;
document.getElementById("profileEmail").textContent = user.email;
document.getElementById("profileInitial").textContent = user.username.charAt(0).toUpperCase();

// --- LOGOUT ---
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearUserSession();
  window.location.href = "login.html";
});

// --- EDIT PROFILO ---
const editBtn = document.getElementById("editProfileBtn");
const overlay = document.getElementById("editProfileOverlay");
const form = document.getElementById("editProfileForm");
const closeBtn = document.getElementById("closeEditProfile");

editBtn?.addEventListener("click", () => overlay.classList.remove("hidden"));
closeBtn?.addEventListener("click", () => overlay.classList.add("hidden"));

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const updated = {
    username: form.editFirstName.value || user.username,
    email: form.editEmail.value || user.email,
  };
  localStorage.setItem("currentUser", JSON.stringify(updated));
  window.location.reload();
});