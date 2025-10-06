// app.js
// Stato e persistenza leggera
const storage = {
  get: (k, d=null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
    catch { return d; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k)
};

// Chiavi di storage
const KEY_FIRST_RUN_DONE = 'gs:firstRunDone';
const KEY_SESSION = 'gs:session';        // { uid, name, email }
const KEY_DATA = 'gs:data';              // demo data for lists

// Selettori rapidi
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// Views
const viewSignin = $('#view-signin');
const viewLogin  = $('#view-login');
const viewApp    = $('#view-app');

// Pagine
const pageHome   = $('#home');
const pageProfile= $('#profile');

// Top username
const usernameTop = $('#username-top');
const usernameProfile = $('#username-profile');

// Overlay refs
const dlgAdd   = $('#ov-add');
const dlgEntr  = $('#ov-entrata');
const dlgUsc   = $('#ov-uscita');
const dlgGoal  = $('#ov-goal');
const dlgDocs  = $('#ov-docs');
const docsAddPanel = $('#docs-add-panel');
const dlgEditProfile = $('#ov-edit-profile');

// Bottoni globali
document.addEventListener('DOMContentLoaded', () => {
$('#go-login-from-signin').addEventListener('click', () => showView('login'));
$('#go-signin-from-login').addEventListener('click', () => showView('signin'));
$('#open-add').addEventListener('click', () => openDialog(dlgAdd));
$('#open-docs').addEventListener('click', () => openDialog(dlgDocs));
if ($('#open-docs-add')) {
  $('#open-docs-add').addEventListener('click', () => docsAddPanel.classList.remove('hidden'));
}
if ($('#close-docs-add')) {
  $('#close-docs-add').addEventListener('click', () => docsAddPanel.classList.add('hidden'));
}

$$('.close').forEach(btn => btn.addEventListener('click', (e) => {
  const dlg = e.target.closest('dialog');
  if (dlg) dlg.close('cancel');
}));

// Selettore aggiungi -> apre overlay specifico
$('#chooser-entrata').addEventListener('click', () => { dlgAdd.close(); openDialog(dlgEntr); });
$('#chooser-uscita').addEventListener('click', () => { dlgAdd.close(); openDialog(dlgUsc); });
$('#chooser-goal').addEventListener('click',   () => { dlgAdd.close(); openDialog(dlgGoal); });
$('#chooser-doc').addEventListener('click',    () => { dlgAdd.close(); openDialog(dlgDocs); });

// Tabs
$$('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
  const t = btn.dataset.tab;
  if (!t) return;
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  switchPage(t);
}));

// Form: Signin
$('#form-signin').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#su-name').value.trim();
  const email = $('#su-email').value.trim().toLowerCase();
  const password = $('#su-password').value; // mock
  if (!name || !email || !password) return;

  // Mock account creation
  const uid = 'uid_' + Math.random().toString(36).slice(2,10);
  const session = { uid, name, email };
  storage.set(KEY_SESSION, session);
  storage.set(KEY_FIRST_RUN_DONE, true);

  initDemoDataIfNeeded();
  hydrateUser(session);
  showView('app');
});

// Form: Login
$('#form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#li-email').value.trim().toLowerCase();
  const password = $('#li-password').value;

  // Mock login
  let session = storage.get(KEY_SESSION, null);
  if (session && session.email && session.email === email) {
    // ok
  } else if (!session) {
    const name = email.split('@')[0].replace(/\W+/g,' ').trim() || 'Utente';
    session = { uid: 'uid_' + Math.random().toString(36).slice(2,10), name, email };
    storage.set(KEY_SESSION, session);
  } else {
    session.email = email;
    storage.set(KEY_SESSION, session);
  }
  initDemoDataIfNeeded();
  hydrateUser(session);
  showView('app');
});

// Edit profilo
$('#form-edit-profile').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#in-profile-name').value.trim();
  const email = $('#in-profile-email').value.trim().toLowerCase();
  if (!name || !email) return;
  const session = storage.get(KEY_SESSION, {});
  session.name = name;
  session.email = email;
  storage.set(KEY_SESSION, session);
  hydrateUser(session);
  dlgEditProfile.close('confirm');
});
$('#open-edit-profile').addEventListener('click', () => {
  const s = storage.get(KEY_SESSION, {});
  $('#in-profile-name').value = s.name || '';
  $('#in-profile-email').value = s.email || '';
  openDialog(dlgEditProfile);
});

// =====================
// Snackbar + Undo (entrate) + Bottone in riga per spese
// =====================
document.addEventListener('DOMContentLoaded', () => {
  const sb = document.getElementById('snackbar');
  const sbText = document.getElementById('snackbar-text');
  const sbUndoBtn = document.getElementById('snackbar-undo');
  let sbTimer = null;
  let lastAction = null;

  function showSnackbar(message, action){
    if (!sb) return;
    sbText.textContent = message;
    sb.classList.remove('hidden');
    sb.classList.add('snackbar-enter');
    clearTimeout(sbTimer);
    lastAction = action || null;
    sbTimer = setTimeout(hideSnackbar, 5000);
  }
  function hideSnackbar(){
    if (!sb) return;
    sb.classList.add('hidden');
    sb.classList.remove('snackbar-enter');
    lastAction = null;
  }

  if (sbUndoBtn){
    sbUndoBtn.addEventListener('click', () => {
      const data = JSON.parse(localStorage.getItem('gs:data')) || { entrate:[], uscite:[] };
      if (lastAction?.type === 'entrata') {
        data.entrate.splice(lastAction.index, 1);
        localStorage.setItem('gs:data', JSON.stringify(data));
        render();
      } else if (lastAction?.type === 'uscita') {
        data.uscite.splice(lastAction.index, 1);
        localStorage.setItem('gs:data', JSON.stringify(data));
        render();
      }
      hideSnackbar();
    });
  }

  window.showSnackbar = showSnackbar; // esporta globalmente se usi altrove
});


// Entrata
$('#form-entrata').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = $('#in-entrata-nome').value.trim();
  const val  = parseFloat($('#in-entrata-valore').value);
  if (!nome || isNaN(val)) return;
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
  data.entrate.unshift({ nome, valore: val, ts: Date.now() });
  storage.set(KEY_DATA, data);
  dlgEntr.close('confirm');
  render();
  showSnackbar('Entrata aggiunta', { type:'entrata', index:0 });
});

// Uscita
$('#form-uscita').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = $('#in-uscita-nome').value.trim();
  const val  = parseFloat($('#in-uscita-valore').value);
  if (!nome || isNaN(val)) return;
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
  data.uscite.unshift({ nome, valore: val, ts: Date.now() });
  storage.set(KEY_DATA, data);
  dlgUsc.close('confirm');
  render();
  // opzionale: snackbar anche per uscita
  // showSnackbar('Uscita aggiunta', { type:'uscita', index:0 });
});

// Documenti
$('#form-doc').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#in-doc-title').value.trim();
  const note  = $('#in-doc-note').value.trim();
  if (!title) return;
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
  data.docs.unshift({ title, note, ts: Date.now() });
  storage.set(KEY_DATA, data);
  docsAddPanel.classList.add('hidden');
  renderDocs();
});

// Helpers
function openDialog(dlg){
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.classList.remove('hidden');
}

// Annulla una singola uscita (riga)
function undoSingleExpense(indexInUscite){
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[] });
  if (indexInUscite < 0 || indexInUscite >= data.uscite.length) return;
  data.uscite.splice(indexInUscite, 1);
  storage.set(KEY_DATA, data);
  render();
}

function showView(which){
  viewSignin.classList.add('hidden');
  viewLogin.classList.add('hidden');
  viewApp.classList.add('hidden');

  if (which === 'signin') viewSignin.classList.remove('hidden');
  else if (which === 'login') viewLogin.classList.remove('hidden');
  else viewApp.classList.remove('hidden');
}

function switchPage(tab){
  pageHome.classList.toggle('page-active', tab === 'home');
  pageProfile.classList.toggle('page-active', tab === 'profile');
}

function hydrateUser(session){
  const name = session?.name || 'Utente';
  usernameTop.textContent = name;
  usernameProfile.textContent = name;
}

// Rendering
function initDemoDataIfNeeded(){
  if (!storage.get(KEY_DATA, null)){
    storage.set(KEY_DATA, {
      entrate:[{nome:'Stipendio', valore:1000, ts:Date.now()}],
      uscite:[{nome:'Affitto', valore: -600, ts:Date.now()}],
      goals:[{nome:'Nuovo PC', importo:800, ts:Date.now()}],
      docs:[]
    });
  }
}

function render(){
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
  // Totali semplici
  const totEntr = data.entrate.reduce((s,e)=>s+e.valore,0);
  const totUsc  = data.uscite.reduce((s,e)=>s+Math.abs(e.valore),0);
  $('#tot-entrate').textContent = formatEuro(totEntr);
  $('#tot-risparmi').textContent = formatEuro(Math.max(0, totEntr - totUsc));

  // Liste spese (home) - mostra solo prime 5, ma il bottone annulla usa l'indice reale
  const ulHome = $('#spese-mese'); ulHome.innerHTML='';
  data.uscite.slice(0,5).forEach((it, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(it.nome)}</span>
      <span style="margin-left:auto; margin-right:12px; color: var(--danger)">${formatEuro(Math.abs(it.valore))}</span>
    `;
    const btn = document.createElement('button');
    btn.className = 'row-action';
    btn.title = 'Annulla spesa';
    btn.innerHTML = '<span class="icon icon-trash"></span>';
    // Calcola indice reale nell'array completo (perché slice parte da 0 ma riferito alla lista troncata)
    const realIndex = idx; // perché usiamo unshift, i primi 5 sono gli stessi indici 0..4
    btn.addEventListener('click', () => undoSingleExpense(realIndex));
    li.appendChild(btn);
    ulHome.appendChild(li);
  });

  // Profilo liste (tutte)
  const ulSpese = $('#spese-profilo'); ulSpese.innerHTML='';
  data.uscite.forEach((it, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(it.nome)}</span>
      <span style="margin-left:auto; margin-right:12px; color: var(--danger)">${formatEuro(Math.abs(it.valore))}</span>
    `;
    const btn = document.createElement('button');
    btn.className = 'row-action';
    btn.title = 'Annulla spesa';
    btn.innerHTML = '<span class="icon icon-trash"></span>';
    btn.addEventListener('click', () => undoSingleExpense(idx));
    li.appendChild(btn);
    ulSpese.appendChild(li);
  });

  renderDocs();
}

function renderDocs(){
  const data = storage.get(KEY_DATA, { docs:[] });
  const ul = $('#docs-ul'); ul.innerHTML='';
  data.docs.forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(d.title)}</span><span class="pill">${new Date(d.ts).toLocaleDateString('it-IT')}</span>`;
    ul.appendChild(li);
  });
}

function formatEuro(n){ return n.toLocaleString('it-IT', { style:'currency', currency:'EUR' }); }
function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// Router iniziale: Signin SOLO al primo avvio, poi Login ai refresh
(function boot(){
  const firstDone = storage.get(KEY_FIRST_RUN_DONE, false);
  const session = storage.get(KEY_SESSION, null);

  if (!firstDone) {
    showView('signin'); // prima volta
  } else if (!session) {
    showView('login');  // dopo il primo avvio ma senza sessione
  } else {
    hydrateUser(session);
    initDemoDataIfNeeded();
    showView('app');    // sessione presente
  }

  // Bottom tabs default
  switchPage('home');
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab==='home'));
})();
