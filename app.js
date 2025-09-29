document.addEventListener('DOMContentLoaded', () => {
  // Dati utente visuali (puoi poi leggerli da Firebase user.displayName)
  const userName = 'Lorenzo';

  // UI nome e iniziale
  const userNameElem = document.getElementById('userName');
  const profileIcon = document.getElementById('profileIcon');
  if (userNameElem) userNameElem.textContent = userName;
  if (profileIcon) profileIcon.textContent = userName.charAt(0).toUpperCase();

  // Vai al profilo
  profileIcon?.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });

  // Util
  function parseAmount(str) {
    return parseFloat(str ? str.toString().replace('€', '').replace(',', '.') : '0') || 0;
  }

  // Stato iniziale
  let income = parseAmount(localStorage.getItem('income'));
  const savings = parseAmount(localStorage.getItem('savings'));
  let expensesData = JSON.parse(localStorage.getItem('expensesData')) || [];

  if (localStorage.getItem('reset') !== 'done') {
    income = 0;
    expensesData = [];
    localStorage.setItem('income', income);
    localStorage.setItem('expensesData', JSON.stringify(expensesData));
    localStorage.setItem('reset', 'done');
  }

  // UI iniziale
  const incomeElem = document.getElementById('income');
  const savingsElem = document.getElementById('savings');
  if (incomeElem) incomeElem.textContent = income.toFixed(2) + '€';
  if (savingsElem) savingsElem.textContent = savings.toFixed(2) + '€';

  const expensesList = document.getElementById('expensesList');
  if (expensesList) {
    expensesList.innerHTML = '';
    expensesData.forEach(exp => {
      const li = document.createElement('li');
      li.textContent = `${exp.desc}: ${exp.amount.toFixed(2)}€`;
      expensesList.appendChild(li);
    });
  }

  // Overlay Entrate/Uscite
  const openOverlay = document.getElementById('openOverlay');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlayContent');
  const tabEntrata = document.getElementById('tabEntrata');
  const tabUscita = document.getElementById('tabUscita');
  const overlayForm = document.getElementById('overlayForm');

  openOverlay?.addEventListener('click', () => {
    overlay?.classList.remove('hidden');
    tabEntrata?.classList.add('active');
    tabUscita?.classList.remove('active');
    overlayForm?.reset();
    overlayForm?.querySelector('button[type="submit"]')?.setAttribute('data-label', 'add');
    const btn = overlayForm?.querySelector('button[type="submit"]');
    if (btn) btn.innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  tabEntrata?.addEventListener('click', () => {
    tabEntrata.classList.add('active');
    tabUscita?.classList.remove('active');
    overlayForm?.reset();
    const btn = overlayForm?.querySelector('button[type="submit"]');
    if (btn) btn.innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  tabUscita?.addEventListener('click', () => {
    tabUscita.classList.add('active');
    tabEntrata?.classList.remove('active');
    overlayForm?.reset();
    const btn = overlayForm?.querySelector('button[type="submit"]');
    if (btn) btn.innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  overlay?.addEventListener('mousedown', (e) => {
    if (overlayContent && !overlayContent.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  overlayForm?.addEventListener('submit', e => {
    e.preventDefault();
    const nome = e.target.elements[0].value;
    const quantita = parseFloat(e.target.elements[1].value);
    const isEntrata = tabEntrata?.classList.contains('active');

    if (isEntrata) {
      income += quantita;
      localStorage.setItem('income', income);
      if (incomeElem) incomeElem.textContent = income.toFixed(2) + '€';
    } else {
      expensesData.push({ desc: nome, amount: quantita });
      localStorage.setItem('expensesData', JSON.stringify(expensesData));
      if (expensesList) {
        const nuovoLi = document.createElement('li');
        nuovoLi.textContent = `${nome}: -${quantita.toFixed(2)}€`;
        expensesList.appendChild(nuovoLi);
      }
    }

    e.target.reset();
    overlay?.classList.add('hidden');
  });

  /* ============ Overlay Obiettivi ============ */
  const goalOverlay = document.getElementById('goalOverlay');
  const addGoalBtn = document.getElementById('addGoalBtn');
  const closeGoalOverlay = document.getElementById('closeGoalOverlay');
  const goalForm = document.getElementById('goalForm');

  // Safety reset: parte chiuso
  if (goalOverlay) {
    goalOverlay.classList.add('hidden');
    goalOverlay.style.display = '';
  }

  addGoalBtn?.addEventListener('click', () => {
    goalOverlay?.classList.remove('hidden');

    // Fallback anti-regole confliggenti
    if (goalOverlay && window.getComputedStyle(goalOverlay).display === 'none') {
      goalOverlay.style.display = 'flex';
    }
  });

  closeGoalOverlay?.addEventListener('click', () => {
    goalOverlay?.classList.add('hidden');
    if (goalOverlay) goalOverlay.style.display = '';
  });

  goalOverlay?.addEventListener('mousedown', (e) => {
    if (e.target === goalOverlay) {
      goalOverlay.classList.add('hidden');
      goalOverlay.style.display = '';
    }
  });

  goalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.goalAmount.value);
    if (!isNaN(amount)) {
      // TODO: salva obiettivo (es. localStorage o backend)
      console.log('Obiettivo aggiunto:', amount);
    }
    goalOverlay?.classList.add('hidden');
    if (goalOverlay) goalOverlay.style.display = '';
    e.target.reset();
  });
});
