// app.js
// Gestione home: entrate, uscite, obiettivi, overlay

// --- AUTH CHECK ---
function getUserSession() {
  return JSON.parse(localStorage.getItem("currentUser"));
}
const user = getUserSession();
if (!user) window.location.href = "login.html";
else document.body.classList.remove("hidden");

// --- OVERLAY ENTRATE/USCITE ---
const openOverlay = document.getElementById("openOverlay");
const overlay = document.getElementById("overlay");
const overlayForm = document.getElementById("overlayForm");
const tabEntrata = document.getElementById("tabEntrata");
const tabUscita = document.getElementById("tabUscita");

let currentType = "entrata";

openOverlay?.addEventListener("click", () => {
  overlay.classList.remove("hidden");
});

tabEntrata?.addEventListener("click", () => {
  currentType = "entrata";
  tabEntrata.classList.add("active");
  tabUscita.classList.remove("active");
});

tabUscita?.addEventListener("click", () => {
  currentType = "uscita";
  tabUscita.classList.add("active");
  tabEntrata.classList.remove("active");
});

overlayForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(overlayForm);
  const entry = {
    type: currentType,
    desc: formData.get("desc"),
    amount: parseFloat(formData.get("amount")),
    notes: formData.get("notes"),
    date: new Date().toISOString(),
  };

  let entries = JSON.parse(localStorage.getItem("entries") || "[]");
  entries.push(entry);
  localStorage.setItem("entries", JSON.stringify(entries));
  overlay.classList.add("hidden");
  overlayForm.reset();
  renderEntries();
});

// --- OBIETTIVI ---
const addGoalBtn = document.getElementById("addGoalBtn");
const goalOverlay = document.getElementById("goalOverlay");
const addGoalForm = document.getElementById("addGoalForm");
const goalList = document.getElementById("goalList");

addGoalBtn?.addEventListener("click", () => {
  goalOverlay.classList.remove("hidden");
});

addGoalForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const goal = {
    text: addGoalForm.goalInput.value,
    deadline: addGoalForm.goalDeadline.value,
  };
  let goals = JSON.parse(localStorage.getItem("goals") || "[]");
  goals.push(goal);
  localStorage.setItem("goals", JSON.stringify(goals));
  goalOverlay.classList.add("hidden");
  addGoalForm.reset();
  renderGoals();
});

// --- RENDER ---
function renderEntries() {
  const list = document.getElementById("expensesList");
  if (!list) return;
  list.innerHTML = "";
  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  let income = 0;
  let savings = 0;

  entries.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = `${e.desc} - ${e.amount}€ (${e.type})`;
    list.appendChild(li);

    if (e.type === "entrata") income += e.amount;
    else savings -= e.amount;
  });

  document.getElementById("income").textContent = income.toFixed(2) + "€";
  document.getElementById("savings").textContent = savings.toFixed(2) + "€";
}

function renderGoals() {
  if (!goalList) return;
  goalList.innerHTML = "";
  const goals = JSON.parse(localStorage.getItem("goals") || "[]");
  goals.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = g.deadline ? `${g.text} (entro ${g.deadline})` : g.text;
    goalList.appendChild(li);
  });
}

renderEntries();
renderGoals();