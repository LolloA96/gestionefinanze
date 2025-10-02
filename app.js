// app.js - versione definitiva con Firebase Auth e bottoni funzionanti
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// -------------------------
// Config Firebase
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDkroLyHVdHQEjnYnf2yLaE3jUhZCL4U0w",
  authDomain: "gestione-finanze-95e06.firebaseapp.com",
  projectId: "gestione-finanze-95e06",
  storageBucket: "gestione-finanze-95e06.appspot.com",
  messagingSenderId: "229873840755",
  appId: "1:229873840755:web:5fe74e3199082d72f07006",
  measurementId: "G-QJH7V53NKJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// -------------------------
// Mostra pagina solo se loggato
// -------------------------
document.body.classList.add('hidden'); // nascondi body fino a controllo auth

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    document.body.classList.remove('hidden');
    if (!localStorage.getItem('gf_user_name')) {
      localStorage.setItem('gf_user_name', user.displayName || user.email);
    }
    document.addEventListener('DOMContentLoaded', initApp);
  }
});

// -------------------------
// Funzione principale
// -------------------------
function initApp() {
  const qs = id => document.getElementById(id);
  const safeAdd = (el, ev, fn) => el?.addEventListener(ev, fn);
  const parseAmount = str => {
    if (!str) return 0;
    const cleaned = String(str).replace(/€/g,'').replace(/\s/g,'').replace(/\./g,'').replace(',', '.');
    const v = parseFloat(cleaned);
    return Number.isFinite(v)?v:0;
  };
  const formatEuro = num => Number(num).toFixed(2) + '€';

  const LS = {
    income: 'gf_income',
    expenses: 'gf_expenses',
    savings: 'gf_savings',
    lastMonth: 'gf_last_month',
    goals: 'gf_goals',
    cumulativeSavings: 'gf_cumulative_savings',
    userName: 'gf_user_name'
  };

  // reset mensile
  const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const checkMonthlyReset = () => {
    const current = getCurrentMonthKey();
    const last = localStorage.getItem(LS.lastMonth);
    if (last !== current) {
      const prevSavings = parseAmount(localStorage.getItem(LS.savings));
      const cum = parseAmount(localStorage.getItem(LS.cumulativeSavings));
      localStorage.setItem(LS.cumulativeSavings,(cum+prevSavings).toString());
      localStorage.setItem(LS.income,'0');
      localStorage.setItem(LS.expenses,JSON.stringify([]));
      localStorage.setItem(LS.savings,'0');
      localStorage.setItem(LS.lastMonth,current);
    }
  };
  checkMonthlyReset();

  // -------------------------
  // Stato e riferimenti DOM
  // -------------------------
  let income = parseAmount(localStorage.getItem(LS.income));
  let expensesData = JSON.parse(localStorage.getItem(LS.expenses)||'[]');
  let savings = parseAmount(localStorage.getItem(LS.savings));

  const userNameElem = qs('userName');
  const profileIcon = qs('profileIcon');
  const incomeElem = qs('income');
  const savingsElem = qs('savings');
  const expensesList = qs('expensesList');

  const openOverlayBtn = qs('openOverlay');
  const overlay = qs('overlay');
  const overlayContent = qs('overlayContent');
  const tabEntrata = qs('tabEntrata');
  const tabUscita = qs('tabUscita');
  const overlayForm = qs('overlayForm');

  const addGoalBtn = qs('addGoalBtn');
  const goalOverlay = qs('goalOverlay');
  const closeGoalOverlay = qs('closeGoalOverlay');
  const addGoalForm = qs('addGoalForm');
  const goalList = qs('goalList');

  // -------------------------
  // UI iniziale
  // -------------------------
  if (userNameElem && profileIcon) {
    const userName = localStorage.getItem(LS.userName) || 'Utente';
    userNameElem.textContent = userName;
    profileIcon.textContent = userName.charAt(0).toUpperCase();
    safeAdd(profileIcon,'click',()=>window.location.href='profile.html');
  }

  // -------------------------
  // Render
  // -------------------------
  const renderExpenses = () => {
    if(!expensesList) return;
    expensesList.innerHTML='';
    if(!expensesData.length){
      const li=document.createElement('li');
      li.textContent='Nessuna spesa per questo mese';
      expensesList.appendChild(li);
      return;
    }
    expensesData.forEach(exp=>{
      const li=document.createElement('li');
      const desc=exp.desc||'Spesa';
      const amt=Number.isFinite(exp.amount)?exp.amount:parseAmount(exp.amount);
      li.textContent=`${desc}: -${formatEuro(amt)}`;
      expensesList.appendChild(li);
    });
  };

  const getGoals = () => {
    try{ return JSON.parse(localStorage.getItem(LS.goals))||[]; } catch { return []; }
  };
  const renderGoals = () => {
    if(!goalList) return;
    const goals = getGoals();
    goalList.innerHTML='';
    if(!goals.length){
      const li=document.createElement('li');
      li.textContent='Nessun obiettivo ancora aggiunto';
      goalList.appendChild(li);
      return;
    }
    goals.forEach((goal,i)=>{
      const li=document.createElement('li');
      li.innerHTML=`<strong>${goal.text}</strong>`;
      const btn=document.createElement('button');
      btn.textContent='❌';
      safeAdd(btn,'click',()=> {
        const updated=goals.filter((_,idx)=>idx!==i);
        localStorage.setItem(LS.goals,JSON.stringify(updated));
        renderGoals();
      });
      li.appendChild(btn);
      goalList.appendChild(li);
    });
  };

  const renderSummary = () => {
    if(incomeElem) incomeElem.textContent=formatEuro(income);
    if(savingsElem) savingsElem.textContent=formatEuro(savings);
    renderExpenses();
    renderGoals();
  };

  const updateSavings = () => {
    const totalExpenses = expensesData.reduce((acc,e)=>acc+(Number.isFinite(e.amount)?e.amount:parseAmount(e.amount)),0);
    savings=income-totalExpenses;
    localStorage.setItem(LS.savings,savings.toString());
    localStorage.setItem(LS.income,income.toString());
    localStorage.setItem(LS.expenses,JSON.stringify(expensesData));
    renderSummary();
  };

  // -------------------------
  // Overlay helpers
  // -------------------------
  const openOverlay = el => el?.classList.remove('hidden');
  const closeOverlay = el => el?.classList.add('hidden');
  const overlayOutsideClose = (overlayEl,innerSelector='.overlay-content') => {
    if(!overlayEl) return;
    safeAdd(overlayEl,'mousedown', e => {
      const box = overlayEl.querySelector(innerSelector);
      if(box && !box.contains(e.target)) closeOverlay(overlayEl);
    });
  };

  // -------------------------
  // Entrate/Uscite Overlay
  // -------------------------
  if(openOverlayBtn && overlay && overlayContent && overlayForm){
    safeAdd(openOverlayBtn,'click',()=>{
      tabEntrata?.classList.add('active');
      tabUscita?.classList.remove('active');
      overlayForm.reset();
      const btn=overlayForm.querySelector('button[type="submit"]');
      if(btn) btn.innerHTML='<span style="font-size:1.4em;">+</span> Aggiungi ora';
      openOverlay(overlay);
    });
    safeAdd(tabEntrata,'click',()=>{
      tabEntrata.classList.add('active');
      tabUscita?.classList.remove('active');
      overlayForm.reset();
    });
    safeAdd(tabUscita,'click',()=>{
      tabUscita.classList.add('active');
      tabEntrata?.classList.remove('active');
      overlayForm.reset();
    });
    overlayOutsideClose(overlay,'#overlayContent');
    safeAdd(overlayForm,'submit', e=>{
      e.preventDefault();
      const nome=overlayForm.desc?.value.trim()||'';
      const quant=parseAmount(overlayForm.amount?.value);
      const isEntrata=tabEntrata?.classList.contains('active');
      if(!nome||!Number.isFinite(quant)||quant<=0){
        return alert('Compila correttamente descrizione e importo (maggiore di 0).');
      }
      if(isEntrata) income+=quant;
      else expensesData.push({desc:nome,amount:quant});
      updateSavings();
      overlayForm.reset();
      closeOverlay(overlay);
    });
  }

  // -------------------------
  // Goals overlay
  // -------------------------
  if(addGoalBtn && goalOverlay && closeGoalOverlay && addGoalForm){
    safeAdd(addGoalBtn,'click',()=>openOverlay(goalOverlay));
    safeAdd(closeGoalOverlay,'click',()=>closeOverlay(goalOverlay));
    overlayOutsideClose(goalOverlay,'.overlay-content');
    safeAdd(addGoalForm,'submit', e=>{
      e.preventDefault();
      const input=qs('goalInput');
      const text=input?.value.trim();
      if(!text) return alert('Inserisci un obiettivo valido');
      const goals=getGoals();
      goals.push({text});
      localStorage.setItem(LS.goals,JSON.stringify(goals));
      renderGoals();
      addGoalForm.reset();
      closeOverlay(goalOverlay);
    });
  }

  // -------------------------
  // Global functions
  // -------------------------
  window.openSpeseOverlay=mese=>{
    const el=qs('spese-overlay');
    const titolo=qs('titoloMese');
    if(el && titolo){
      titolo.innerText='Le Spese Di '+mese;
      openOverlay(el);
    }
  };

  window.closeOverlay=id=>{
    const el=qs(id);
    if(el) closeOverlay(el);
  };

  // -------------------------
  // Init render
  // -------------------------
  renderSummary();

  window._GF={reload:()=>{
    income=parseAmount(localStorage.getItem(LS.income));
    expensesData=JSON.parse(localStorage.getItem(LS.expenses)||'[]');
    savings=parseAmount(localStorage.getItem(LS.savings));
    renderSummary();
  }};
}