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

/* ==== NUOVE FUNZIONALITÀ: SPESE MESE PER MESE ==== */

// Chiave storage dati app principale (adatta se diverso)
const KEY_DATA = 'gs:data';

// Helper: formatta importi
function formatEuro(n){ return (n || 0).toLocaleString('it-IT', { style:'currency', currency:'EUR' }); }
// Helper: etichetta mese "ottobre 2025"
function monthKey(ts){
  return new Date(ts || Date.now()).toLocaleDateString('it-IT', { month:'long', year:'numeric' });
}

// Raccoglie dati da localStorage dell'app
function getAppData(){
  const fallback = { entrate:[], uscite:[], goals:[], docs:[], risparmi:[], speseStorico:[], speseDettagliate:[] };
  try{
    return JSON.parse(localStorage.getItem(KEY_DATA)) || fallback;
  }catch{
    return fallback;
  }
}

// Popola la lista "Le tue spese mese per mese"
function renderExpensesByMonth(){
  const data = getAppData();
  const ul = document.getElementById('profileExpensesList');
  const tpl = document.getElementById('tpl-expense-month-row');
  if (!ul || !tpl) return;

  ul.innerHTML = '';

  // Aggrega: somma spese correnti del mese + storico consolidato salvato ai reset
  const map = new Map();

  // Corrente (mese in corso, non ancora chiuso)
  (data.uscite || []).forEach(u => {
    const k = monthKey(u.ts);
    map.set(k, (map.get(k) || 0) + Math.abs(u.valore));
  });

  // Storico consolidato (creato al reset mese)
  (data.speseStorico || []).forEach(s => {
    const k = s.key || monthKey(s.ts);
    map.set(k, (map.get(k) || 0) + Math.abs(s.valore || 0));
  });

  // Ordina per data desc usando un timestamp fittizio del 1° del mese
  const items = Array.from(map.entries()).map(([k, tot]) => {
    // prova a costruire una data dal label locale (fallback all'ordine di inserimento)
    let sortTS = Date.parse(`01 ${k}`);
    if (isNaN(sortTS)) sortTS = Date.now();
    return { key:k, totale:tot, sort:sortTS };
  }).sort((a,b) => b.sort - a.sort);

  items.forEach(({ key, totale }) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.month-label').textContent = key;
    node.querySelector('.month-total').textContent = '-' + formatEuro(totale).replace('-', '');

    const btn = node.querySelector('.view-month-btn');
    btn.addEventListener('click', () => openMonthDialog(key));

    ul.appendChild(node);
  });
}

// Apre il dialog con il dettaglio spese del mese selezionato
function openMonthDialog(monthLabel){
  const data = getAppData();
  const dlg = document.getElementById('ov-expenses-month');
  const title = document.getElementById('ov-expenses-title');
  const list = document.getElementById('ov-expenses-list');
  if (!dlg || !title || !list) return;

  title.textContent = `Spese: ${monthLabel}`;
  list.innerHTML = '';

  // Usa snapshot se presente (salvato al reset mese), altrimenti prendi le uscite correnti con stessa etichetta
  const snap = (data.speseDettagliate || []).find(x => x.key === monthLabel);
  let voci = [];
  if (snap) {
    voci = snap.voci || [];
  } else {
    voci = (data.uscite || []).filter(u => monthKey(u.ts) === monthLabel)
      .map(u => ({ nome:u.nome, valore: Math.abs(u.valore), ts:u.ts }));
  }

  if (!voci.length){
    const li = document.createElement('li');
    li.innerHTML = `<span>Nessuna spesa registrata</span>`;
    list.appendChild(li);
  } else {
    voci.forEach(v => {
      const li = document.createElement('li');
      const dateStr = v.ts ? new Date(v.ts).toLocaleDateString('it-IT') : '';
      li.innerHTML = `
        <span>${v.nome}${dateStr ? ' · ' + dateStr : ''}</span>
        <span style="margin-left:auto; color: var(--danger)">${formatEuro(v.valore)}</span>
      `;
      list.appendChild(li);
    });
  }

  if (dlg.showModal) dlg.showModal(); else dlg.classList.remove('hidden');

  // bind chiusura (una sola volta)
  dlg.querySelector('.close')?.addEventListener('click', () => {
    if (dlg.close) dlg.close('cancel'); else dlg.classList.add('hidden');
  }, { once:true });
}

// Boot rendering
renderExpensesByMonth();
