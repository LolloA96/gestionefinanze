// app.js - versione rifattorizzata e corretta
document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------
     Utility helpers
     ------------------------- */
  const qs = id => document.getElementById(id);
  const safeAdd = (el, ev, fn) => el?.addEventListener(ev, fn);

  function parseAmount(str) {
    if (str === null || str === undefined) return 0;
    const cleaned = String(str).replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const v = parseFloat(cleaned);
    return Number.isFinite(v) ? v : 0;
  }

  function formatEuro(num) {
    return Number(num).toFixed(2) + '€';
  }

  /* -------------------------
     LocalStorage keys & monthly reset
     ------------------------- */
  const LS = {
    income: 'gf_income',
    expenses: 'gf_expenses',
    savings: 'gf_savings',
    lastMonth: 'gf_last_month',
    goals: 'gf_goals',
    cumulativeSavings: 'gf_cumulative_savings'
  };

  function getCurrentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function checkAndHandleMonthlyReset() {
    const currentMonth = getCurrentMonthKey();
    const last = localStorage.getItem(LS.lastMonth);
    if (last !== currentMonth) {
      const prevSavings = parseAmount(localStorage.getItem(LS.savings));
      if (prevSavings && !isNaN(prevSavings)) {
        const cum = parseAmount(localStorage.getItem(LS.cumulativeSavings));
        localStorage.setItem(LS.cumulativeSavings, (cum + prevSavings).toString());
      }
      localStorage.setItem(LS.income, '0');
      localStorage.setItem(LS.expenses, JSON.stringify([]));
      localStorage.setItem(LS.savings, '0');
      localStorage.setItem(LS.lastMonth, currentMonth);
    }
  }

  /* -------------------------
     State + UI refs
     ------------------------- */
  checkAndHandleMonthlyReset();

  let income = parseAmount(localStorage.getItem(LS.income));
  let expensesData = JSON.parse(localStorage.getItem(LS.expenses) || '[]');
  let savings = parseAmount(localStorage.getItem(LS.savings));
  const cumulativeSavings = parseAmount(localStorage.getItem(LS.cumulativeSavings) || '0');

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

  // Goals
  const addGoalBtn = qs('addGoalBtn');
  const goalOverlay = qs('goalOverlay');
  const closeGoalOverlay = qs('closeGoalOverlay');
  const addGoalForm = qs('addGoalForm');
  const goalList = qs('goalList');

  /* -------------------------
     Initial UI population
     ------------------------- */
  if (userNameElem && profileIcon) {
    const userName = localStorage.getItem('gf_user_name') || 'Utente';
    userNameElem.textContent = userName;
    profileIcon.textContent = userName.charAt(0).toUpperCase();
    profileIcon?.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }

  function renderExpenses() {
    if (!expensesList) return;
    expensesList.innerHTML = '';
    if (!Array.isArray(expensesData) || expensesData.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nessuna spesa per questo mese';
      expensesList.appendChild(li);
      return;
    }
    expensesData.forEach(exp => {
      const li = document.createElement('li');
      const desc = exp.desc || 'Spesa';
      const amt = Number.isFinite(exp.amount) ? exp.amount : parseAmount(exp.amount);
      li.textContent = `${desc}: -${formatEuro(amt).replace('€','')}€`;
      expensesList.appendChild(li);
    });
  }

  function renderSummary() {
    if (incomeElem) incomeElem.textContent = formatEuro(income);
    if (savingsElem) savingsElem.textContent = formatEuro(savings);
    renderExpenses();
    renderGoals();
  }

  /* -------------------------
     Savings calculation
     ------------------------- */
  function updateSavingsAndPersist() {
    const totalExpenses = expensesData.reduce((acc, e) => acc + (Number.isFinite(e.amount) ? e.amount : parseAmount(e.amount) ), 0);
    savings = income - totalExpenses;
    if (!Number.isFinite(savings)) savings = 0;
    localStorage.setItem(LS.savings, savings.toString());
    localStorage.setItem(LS.income, income.toString());
    localStorage.setItem(LS.expenses, JSON.stringify(expensesData));
    renderSummary();
  }

  /* -------------------------
     Overlay helpers
     ------------------------- */
  function openOverlay(el) { el?.classList.remove('hidden'); }
  function closeOverlay(el) { el?.classList.add('hidden'); }
  function overlayOutsideClose(overlayEl, innerSelector = '.overlay-content') {
    if (!overlayEl) return;
    safeAdd(overlayEl, 'mousedown', (e) => {
      const box = overlayEl.querySelector(innerSelector);
      if (box && !box.contains(e.target)) {
        closeOverlay(overlayEl);
      }
    });
  }

  /* -------------------------
     Entrate/Uscite overlay
     ------------------------- */
  if (openOverlayBtn && overlay && overlayContent && overlayForm) {
    openOverlayBtn.addEventListener('click', () => {
      tabEntrata?.classList.add('active');
      tabUscita?.classList.remove('active');
      overlayForm.reset();
      const submitBtn = overlayForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
      openOverlay(overlay);
    });

    safeAdd(tabEntrata, 'click', () => {
      tabEntrata.classList.add('active');
      tabUscita?.classList.remove('active');
      overlayForm.reset();
    });
    safeAdd(tabUscita, 'click', () => {
      tabUscita.classList.add('active');
      tabEntrata?.classList.remove('active');
      overlayForm.reset();
    });

    overlayOutsideClose(overlay, '#overlayContent');

    safeAdd(overlayForm, 'submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const nome = form.desc?.value?.trim() || '';
      const quantita = parseAmount(form.amount?.value);
      const isEntrata = !!(tabEntrata && tabEntrata.classList.contains('active'));

      if (!nome || !Number.isFinite(quantita) || quantita <= 0) {
        alert('Compila correttamente descrizione e importo (maggiore di 0).');
        return;
      }

      if (isEntrata) {
        income += quantita;
        localStorage.setItem(LS.income, income.toString());
      } else {
        expensesData.push({ desc: nome, amount: quantita });
        localStorage.setItem(LS.expenses, JSON.stringify(expensesData));
      }

      updateSavingsAndPersist();
      form.reset();
      closeOverlay(overlay);
    });
  }

  /* -------------------------
     Goals (Obiettivi)
     ------------------------- */
  function saveGoals(goals) {
    localStorage.setItem(LS.goals, JSON.stringify(goals));
    renderGoals();
  }

  function getGoals() {
    const g = localStorage.getItem(LS.goals);
    try { return g ? JSON.parse(g) : []; } catch { return []; }
  }

  function renderGoals() {
    if (!goalList) return;
    const goals = getGoals();
    goalList.innerHTML = '';

    if (goals.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nessun obiettivo ancora aggiunto';
      goalList.appendChild(li);
      return;
    }

    goals.forEach((goal, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${goal.text}</strong>`;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '❌';
      removeBtn.addEventListener('click', () => {
        const updated = goals.filter((_, idx) => idx !== i);
        saveGoals(updated);
      });
      li.appendChild(removeBtn);
      goalList.appendChild(li);
    });
  }

  if (addGoalBtn && goalOverlay && closeGoalOverlay && addGoalForm) {
    closeOverlay(goalOverlay);
    safeAdd(addGoalBtn, 'click', () => openOverlay(goalOverlay));
    safeAdd(closeGoalOverlay, 'click', () => closeOverlay(goalOverlay));
    overlayOutsideClose(goalOverlay, '.overlay-content');

    safeAdd(addGoalForm, 'submit', (e) => {
      e.preventDefault();
      const input = qs('goalInput');
      const text = input?.value.trim();
      if (!text) {
        alert('Inserisci un obiettivo valido');
        return;
      }
      const goals = getGoals();
      goals.push({ text });
      saveGoals(goals);
      addGoalForm.reset();
      closeOverlay(goalOverlay);
    });
  }

  /* -------------------------
     Public functions
     ------------------------- */
  window.openSpeseOverlay = function(mese) {
    const el = qs('spese-overlay');
    const titolo = qs('titoloMese');
    if (el && titolo) {
      titolo.innerText = 'Le Spese Di ' + mese;
      openOverlay(el);
    }
  };
  window.closeOverlay = function(id) {
    const el = qs(id);
    if (el) closeOverlay(el);
  };

  /* -------------------------
     Init
     ------------------------- */
  renderSummary();
  renderGoals();

  window._GF = {
    reload: () => {
      income = parseAmount(localStorage.getItem(LS.income));
      expensesData = JSON.parse(localStorage.getItem(LS.expenses) || '[]');
      savings = parseAmount(localStorage.getItem(LS.savings));
      renderSummary();
    }
  };
});