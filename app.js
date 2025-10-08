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

// Chiavi
const KEY_FIRST_RUN_DONE = 'gs:firstRunDone';
const KEY_SESSION = 'gs:session';
const KEY_DATA = 'gs:data';

// Helpers selettori
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// Views e pagine
const viewSignin = $('#view-signin');
const viewLogin  = $('#view-login');
const viewApp    = $('#view-app');
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

// // Funzioni base
function openDialog(dlg){
  if (dlg?.showModal) dlg.showModal();
  else dlg?.classList?.remove('hidden');
}
function showView(which){
  [viewSignin, viewLogin, viewApp].forEach(v => v && v.classList.add('hidden'));
  if (which === 'signin') viewSignin?.classList?.remove('hidden');
  else if (which === 'login') viewLogin?.classList?.remove('hidden');
  else viewApp?.classList?.remove('hidden');
}
function switchPage(tab){
  pageHome?.classList?.toggle('page-active', tab === 'home');
  pageProfile?.classList?.toggle('page-active', tab === 'profile');
}
function hydrateUser(session){
  const name = session?.name || 'Utente';
  if (usernameTop) usernameTop.textContent = name;
  if (usernameProfile) usernameProfile.textContent = name;
}
function initDemoDataIfNeeded(){
  if (!storage.get(KEY_DATA, null)){
    storage.set(KEY_DATA, {
      entrate:[{nome:'Stipendio', valore:1000, ts:Date.now()}],
      uscite:[{nome:'Affitto', valore:-600, ts:Date.now()}],
      goals:[{nome:'Nuovo PC', importo:800, ts:Date.now()}],
      docs:[]
    });
  }
}

// AGGIUNTA 1: helper per confronto mese
function isSameMonth(tsA, tsB){
  const a = new Date(tsA), b = new Date(tsB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatEuro(n){ return n.toLocaleString('it-IT', { style:'currency', currency:'EUR' }); }
function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// Rendering
function render(){
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
  const totEntr = data.entrate.reduce((s,e)=>s+e.valore,0);
  const totUsc  = data.uscite.reduce((s,e)=>s+Math.abs(e.valore),0);
  $('#tot-entrate').textContent = formatEuro(totEntr);
  $('#tot-risparmi').textContent = formatEuro(Math.max(0, totEntr - totUsc));

  const ulHome = $('#spese-mese'); if (ulHome) { ulHome.innerHTML='';
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
      const realIndex = idx;
      btn.addEventListener('click', () => undoSingleExpense(realIndex));
      li.appendChild(btn);
      ulHome.appendChild(li);
    });
  }

  const ulSpese = $('#spese-profilo'); if (ulSpese) { ulSpese.innerHTML='';
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
  }

  renderDocs();
}
function renderDocs(){
  const data = storage.get(KEY_DATA, { docs:[] });
  const ul = $('#docs-ul'); if (!ul) return;
  ul.innerHTML='';
  data.docs.forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(d.title)}</span><span class="pill">${new Date(d.ts).toLocaleDateString('it-IT')}</span>`;
    ul.appendChild(li);
  });
}
function undoSingleExpense(indexInUscite){
  const data = storage.get(KEY_DATA, { entrate:[], uscite:[] });
  if (indexInUscite < 0 || indexInUscite >= data.uscite.length) return;
  data.uscite.splice(indexInUscite, 1);
  storage.set(KEY_DATA, data);
  render();
}

// Snackbar (safe)
let showSnackbar = () => {};
document.addEventListener('DOMContentLoaded', () => {
  const sb = document.getElementById('snackbar');
  const sbText = document.getElementById('snackbar-text');
  const sbUndoBtn = document.getElementById('snackbar-undo');
  let sbTimer = null, lastAction = null;

  function hideSnackbar(){
    if (!sb) return;
    sb.classList.add('hidden');
    sb.classList.remove('snackbar-enter');
    lastAction = null;
  }
  showSnackbar = function(message, action){
    if (!sb) return;
    sbText.textContent = message;
    sb.classList.remove('hidden');
    sb.classList.add('snackbar-enter');
    clearTimeout(sbTimer);
    lastAction = action || null;
    sbTimer = setTimeout(hideSnackbar, 5000);
  };
  if (sbUndoBtn){
    sbUndoBtn.addEventListener('click', () => {
      const data = storage.get(KEY_DATA, { entrate:[], uscite:[] });
      if (lastAction?.type === 'entrata') data.entrate.splice(lastAction.index, 1);
      if (lastAction?.type === 'uscita')  data.uscite.splice(lastAction.index, 1);
      storage.set(KEY_DATA, data);
      render();
      hideSnackbar();
    });
  }
});

// Bind eventi e boot in un unico DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Bottoni globali
  $('#go-login-from-signin')?.addEventListener('click', () => showView('login'));
  $('#go-signin-from-login')?.addEventListener('click', () => showView('signin'));
  $('#open-add')?.addEventListener('click', () => {
    if (dlgAdd?.showModal) dlgAdd.showModal();
    else dlgAdd?.classList?.remove('hidden');
  });

  $('#open-docs')?.addEventListener('click', () => openDialog(dlgDocs));
  $('#open-docs-add')?.addEventListener('click', () => docsAddPanel?.classList?.remove('hidden'));
  $('#close-docs-add')?.addEventListener('click', () => docsAddPanel?.classList?.add('hidden'));
  $$('.close').forEach(btn => btn.addEventListener('click', (e) => {
    const dlg = e.target.closest('dialog'); if (dlg?.close) dlg.close('cancel');
  }));

  // Selettore aggiungi
  document.getElementById('btn-add-entrata')?.addEventListener('click', () => {
    dlgAdd?.close?.();
    if (dlgEntr?.showModal) dlgEntr.showModal(); else dlgEntr?.classList?.remove('hidden');
  });
  document.getElementById('btn-add-uscita')?.addEventListener('click', () => {
    dlgAdd?.close?.();
    if (dlgUsc?.showModal) dlgUsc.showModal(); else dlgUsc?.classList?.remove('hidden');
  });

  dlgAdd?.querySelector('.close')?.addEventListener('click', () => {
    if (dlgAdd?.close) dlgAdd.close('cancel');
    else dlgAdd?.classList?.add('hidden');
  });

  $('#chooser-goal')?.addEventListener('click',   () => { dlgAdd?.close?.(); openDialog(dlgGoal); });
  $('#chooser-doc')?.addEventListener('click',    () => { dlgAdd?.close?.(); openDialog(dlgDocs); });

  // Tabs
  $$('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    const t = btn.dataset.tab; if (!t) return;
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    switchPage(t);
  }));

  // AGGIUNTA 2: reset entrate mese
  document.getElementById('reset-entrate-btn')?.addEventListener('click', () => {
    const ok = confirm('Azzerare le entrate del mese corrente e inserire un nuovo stipendio?');
    if (!ok) return;

    const now = Date.now();
    const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });

    // Tieni storiche, rimuovi solo mese corrente
    data.entrate = data.entrate.filter(e => !isSameMonth(e.ts || now, now));

    let imp = prompt('Inserisci il nuovo stipendio di questo mese (es. 1200.50):', '');
    if (imp === null) { storage.set(KEY_DATA, data); render(); return; }
    imp = parseFloat(String(imp).replace(',', '.'));
    if (isNaN(imp) || imp < 0) { alert('Importo non valido.'); storage.set(KEY_DATA, data); render(); return; }

    data.entrate.unshift({ nome:'Stipendio', valore: imp, ts: Date.now() });
    storage.set(KEY_DATA, data);
    render();
    showSnackbar?.('Entrate mese resettate', { type:'entrata', index:0 });
  });

  // Signin
  const formSignin = $('#form-signin');
  formSignin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#su-name')?.value?.trim();
    const email = $('#su-email')?.value?.trim()?.toLowerCase();
    const password = $('#su-password')?.value;
    if (!name || !email || !password) return;
    const uid = 'uid_' + Math.random().toString(36).slice(2,10);
    const session = { uid, name, email };
    storage.set(KEY_SESSION, session);
    storage.set(KEY_FIRST_RUN_DONE, true);
    initDemoDataIfNeeded();
    hydrateUser(session);
    showView('app');
    render();
  });

  // Login
  const formLogin = $('#form-login');
  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#li-email')?.value?.trim()?.toLowerCase();
    const password = $('#li-password')?.value;
    if (!email || !password) return;
    let session = storage.get(KEY_SESSION, null);
    if (session && session.email === email) {
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
    render();
  });

  // Edit profilo
  $('#form-edit-profile')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#in-profile-name')?.value?.trim();
    const email = $('#in-profile-email')?.value?.trim()?.toLowerCase();
    if (!name || !email) return;
    const session = storage.get(KEY_SESSION, {});
    session.name = name; session.email = email;
    storage.set(KEY_SESSION, session);
    hydrateUser(session);
    dlgEditProfile?.close?.('confirm');
  });
  $('#open-edit-profile')?.addEventListener('click', () => {
    const s = storage.get(KEY_SESSION, {});
    const n = $('#in-profile-name'); if (n) n.value = s.name || '';
    const e = $('#in-profile-email'); if (e) e.value = s.email || '';
    openDialog(dlgEditProfile);
  });

  // Entrata
  $('#form-entrata')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = $('#in-entrata-nome')?.value?.trim();
    const val  = parseFloat($('#in-entrata-valore')?.value);
    if (!nome || isNaN(val)) return;
    const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
    data.entrate.unshift({ nome, valore: val, ts: Date.now() });
    storage.set(KEY_DATA, data);
    dlgEntr?.close?.('confirm');
    render();
    showSnackbar('Entrata aggiunta', { type:'entrata', index:0 });
  });

  // Uscita
  $('#form-uscita')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = $('#in-uscita-nome')?.value?.trim();
    const val  = parseFloat($('#in-uscita-valore')?.value);
    if (!nome || isNaN(val)) return;
    const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
    data.uscite.unshift({ nome, valore: val, ts: Date.now() });
    storage.set(KEY_DATA, data);
    dlgUsc?.close?.('confirm');
    render();
  });

  // Documenti
  $('#form-doc')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#in-doc-title')?.value?.trim();
    const note  = $('#in-doc-note')?.value?.trim();
    if (!title) return;
    const data = storage.get(KEY_DATA, { entrate:[], uscite:[], goals:[], docs:[] });
    data.docs.unshift({ title, note, ts: Date.now() });
    storage.set(KEY_DATA, data);
    docsAddPanel?.classList?.add('hidden');
    renderDocs();
  });

  // BOOT dopo aver registrato tutti i listener
  const firstDone = storage.get(KEY_FIRST_RUN_DONE, false);
  const session = storage.get(KEY_SESSION, null);
  if (!firstDone) showView('signin');
  else if (!session) showView('login');
  else { hydrateUser(session); initDemoDataIfNeeded(); showView('app'); render(); }

  // Bottom tabs default
  switchPage('home');
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab==='home'));
});
