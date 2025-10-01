// app.js - versione rifattorizzata e corretta
document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------
     Utility helpers
     ------------------------- */
  const qs = id => document.getElementById(id);
  const safeAdd = (el, ev, fn) => el?.addEventListener(ev, fn);

  function parseAmount(str) {
    if (str === null || str === undefined) return 0;
    // accetta "1.234,56€" "1234.56" "1234,56" "1234"
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
    income: 'gf_income', // current month income
    expenses: 'gf_expenses', // current month expenses array
    savings: 'gf_savings', // current month savings
    lastMonth: 'gf_last_month', // "YYYY-MM"
    goal: 'gf_goal', // object { amount, deadline }
    cumulativeSavings: 'gf_cumulative_savings' // optional long-term tracker
  };

  function getCurrentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // If month changed since last visit, archive/rollover logic:
  // For now: when month changes we add current month's savings to cumulativeSavings and reset monthly values.
  function checkAndHandleMonthlyReset() {
    const currentMonth = getCurrentMonthKey();
    const last = localStorage.getItem(LS.lastMonth);
    if (last !== currentMonth) {
      // archive previous month savings into cumulativeSavings (if any)
      const prevSavings = parseAmount(localStorage.getItem(LS.savings));
      if (prevSavings && !isNaN(prevSavings)) {
        const cum = parseAmount(localStorage.getItem(LS.cumulativeSavings));
        localStorage.setItem(LS.cumulativeSavings, (cum + prevSavings).toString());
      }
      // reset monthly values
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

  // UI elements (safely retrieved)
  const userNameElem = qs('userName');
  const profileIcon = qs('profileIcon');
  const incomeElem = qs('income');
  const savingsElem = qs('savings');
  const expensesList = qs('expensesList');

  // overlay + form elements
  const openOverlayBtn = qs('openOverlay'); // bottone + in basso
  const overlay = qs('overlay');
  const overlayContent = qs('overlayContent');
  const tabEntrata = qs('tabEntrata');
  const tabUscita = qs('tabUscita');
  const overlayForm = qs('overlayForm');

  // goal elements
  const addGoalBtn = qs('addGoalBtn');
  const goalOverlay = qs('goalOverlay');
  const closeGoalOverlay = qs('closeGoalOverlay');
  const goalForm = qs('goalForm');
  const goalBlock = qs('goalBlock'); // area dove mostrare goal / progresso (se presente)

  /* -------------------------
     Initial UI population
     ------------------------- */
  if (userNameElem && profileIcon) {
    const userName = localStorage.getItem('gf_user_name') || 'Lorenzo';
    userNameElem.textContent = userName;
    profileIcon.textContent = userName.charAt(0).toUpperCase();
    // profileIcon click should navigate to profile if link exists
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
    renderGoal(); // update goal UI if present
  }

  /* -------------------------
     Savings calculation + persistance
     ------------------------- */
  function updateSavingsAndPersist() {
    const totalExpenses = expensesData.reduce((acc, e) => acc + (Number.isFinite(e.amount) ? e.amount : parseAmount(e.amount) ), 0);
    savings = income - totalExpenses;
    // ensure not NaN
    if (!Number.isFinite(savings)) savings = 0;
    localStorage.setItem(LS.savings, savings.toString());
    localStorage.setItem(LS.income, income.toString());
    localStorage.setItem(LS.expenses, JSON.stringify(expensesData));
    renderSummary();
  }

  /* -------------------------
     Overlay helpers (centralizzati)
     ------------------------- */
  function openOverlay(el) {
    el?.classList.remove('hidden');
  }
  function closeOverlay(el) {
    el?.classList.add('hidden');
  }

  // Close when clicking outside content box (generalized)
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
     Overlay: add entrata/uscita
     ------------------------- */
  // Defensive: link elements only if exist
  if (openOverlayBtn && overlay && overlayContent && overlayForm) {
    openOverlayBtn.addEventListener('click', () => {
      // default to Entrata
      tabEntrata?.classList.add('active');
      tabUscita?.classList.remove('active');
      overlayForm.reset();
      // adjust button text if any
      const submitBtn = overlayForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
      openOverlay(overlay);
    });

    // Tabs safe listeners
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

    // close overlay when click outside
    overlayOutsideClose(overlay, '#overlayContent');

    // IMPORTANT: use name attributes inside form:
    // <input name="desc"> and <input name="amount">
    safeAdd(overlayForm, 'submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const nome = form.desc?.value?.trim() || '';
      const quantita = parseAmount(form.amount?.value);
      const isEntrata = !!(tabEntrata && tabEntrata.classList.contains('active'));

      // Basic validation
      if (!nome || !Number.isFinite(quantita) || quantita <= 0) {
        alert('Compila correttamente descrizione e importo (maggiore di 0).');
        return;
      }

      if (isEntrata) {
        income = income + quantita;
        localStorage.setItem(LS.income, income.toString());
      } else {
        expensesData.push({ desc: nome, amount: quantita });
        localStorage.setItem(LS.expenses, JSON.stringify(expensesData));
      }

      updateSavingsAndPersist();

      // Close & reset
      form.reset();
      closeOverlay(overlay);
    });
  } else {
    // If any of the overlay elements are missing, avoid throwing errors
    // console.info('Overlay add-entry elements not found on this page.');
  }

  /* -------------------------
     Goals (obiettivo)
     ------------------------- */
  function saveGoal(goalObj) {
    localStorage.setItem(LS.goal, JSON.stringify(goalObj));
    renderGoal();
  }

  function getGoal() {
    const g = localStorage.getItem(LS.goal);
    try {
      return g ? JSON.parse(g) : null;
    } catch (e) {
      return null;
    }
  }

  function renderGoal() {
    if (!goalBlock) return;
    const goal = getGoal();
    goalBlock.innerHTML = '';
    if (!goal) {
      const title = document.createElement('div');
      title.textContent = 'Obiettivo da raggiungere';
      const btn = document.createElement('button');
      btn.id = 'addGoalBtn';
      btn.className = 'btn btn-primary';
      btn.textContent = 'Aggiungi obiettivo';
      btn.addEventListener('click', () => openOverlay(goalOverlay));
      goalBlock.appendChild(title);
      goalBlock.appendChild(btn);
      return;
    }

    // calculate progress: prefer cumulativeSavings (archiviato) else current savings
    const cum = parseAmount(localStorage.getItem(LS.cumulativeSavings) || '0');
    const referenceSaved = cum > 0 ? cum + savings : savings;
    const progress = Math.min(100, Math.round((referenceSaved / goal.amount) * 100));
    const title = document.createElement('div');
    title.innerHTML = `<strong>Obiettivo:</strong> ${formatEuro(goal.amount)} entro ${goal.deadline || '...'}<br>`;
    const prog = document.createElement('div');
    prog.textContent = `Progresso stimato: ${progress}% (${formatEuro(referenceSaved)} salvati)`;

    // simple progress bar
    const barWrap = document.createElement('div');
    barWrap.className = 'goal-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'goal-bar';
    bar.style.width = `${progress}%`;
    barWrap.appendChild(bar);

    // edit/remove buttons
    const actions = document.createElement('div');
    actions.className = 'goal-actions';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Modifica';
    editBtn.addEventListener('click', () => openOverlay(goalOverlay));
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Rimuovi';
    removeBtn.addEventListener('click', () => {
      localStorage.removeItem(LS.goal);
      renderGoal();
    });
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    goalBlock.appendChild(title);
    goalBlock.appendChild(prog);
    goalBlock.appendChild(barWrap);
    goalBlock.appendChild(actions);
  }

  // Goal overlay listeners (if present)
  if (addGoalBtn && goalOverlay && closeGoalOverlay && goalForm) {
    // ensure overlay starts hidden
    closeOverlay(goalOverlay);

    safeAdd(addGoalBtn, 'click', () => {
      openOverlay(goalOverlay);
    });
    safeAdd(closeGoalOverlay, 'click', () => {
      closeOverlay(goalOverlay);
    });
    overlayOutsideClose(goalOverlay, '.overlay-content');

    safeAdd(goalForm, 'submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const amount = parseAmount(form.goalAmount?.value);
      const deadline = form.goalDeadline?.value || '';
      if (!Number.isFinite(amount) || amount <= 0) {
        alert('Inserisci una cifra valida per l\'obiettivo');
        return;
      }
      saveGoal({ amount, deadline });
      form.reset();
      closeOverlay(goalOverlay);
    });
  } else {
    // console.info('Goal elements missing on this page');
  }

  /* -------------------------
     Public functions for profile page (if profile.js calls them)
     ------------------------- */
  window.openSpeseOverlay = function(mese) {
    // this function can be used by profile view to open monthly expenses
    const el = qs('spese-overlay');
    const titolo = qs('titoloMese');
    if (el && titolo) {
      titolo.innerText = 'Le Spese Di ' + mese;
      openOverlay(el);
      // TODO: caricare la lista dettagliata basata su mese (al momento mostra le spese correnti)
    }
  };
  window.closeOverlay = function(id) {
    const el = qs(id);
    if (el) closeOverlay(el);
  };

  /* -------------------------
     Initialization render
     ------------------------- */
  renderSummary();

  // If there's a goal block on load, render it
  renderGoal();

  /* -------------------------
     Expose small API for debug (optional)
     ------------------------- */
  window._GF = {
    reload: () => {
      income = parseAmount(localStorage.getItem(LS.income));
      expensesData = JSON.parse(localStorage.getItem(LS.expenses) || '[]');
      savings = parseAmount(localStorage.getItem(LS.savings));
      renderSummary();
    },
    addTestExpense: (desc, amt) => {
      expensesData.push({ desc, amount: parseAmount(amt) });
      updateSavingsAndPersist();
    }
  };
});