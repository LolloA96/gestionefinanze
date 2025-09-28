document.addEventListener('DOMContentLoaded', () => {
  // Funzione per convertire da stringa a numero
  function parseAmount(str) {
    return parseFloat(str ? str.toString().replace('€', '').replace(',', '.') : '0') || 0;
  }

  // Carica dati da localStorage o imposta default a 0
  let income = parseAmount(localStorage.getItem('income'));
  const savings = parseAmount(localStorage.getItem('savings'));
  let expensesData = JSON.parse(localStorage.getItem('expensesData')) || [];

  // Inizializza dati se nulli (azzeramento)
  if (localStorage.getItem('reset') !== 'done') {
    income = 0;
    expensesData = [];
    localStorage.setItem('income', income);
    localStorage.setItem('expensesData', JSON.stringify(expensesData));
    localStorage.setItem('reset', 'done');
  }

  // Aggiorna UI con dati caricati o azzerati
  document.getElementById('income').textContent = income.toFixed(2) + '€';
  document.getElementById('savings').textContent = savings.toFixed(2) + '€';

  const expensesList = document.getElementById('expensesList');
  expensesList.innerHTML = '';
  expensesData.forEach(exp => {
    const li = document.createElement('li');
    li.textContent = `${exp.desc}: ${exp.amount.toFixed(2)}€`;
    expensesList.appendChild(li);
  });

  // Riferimenti DOM
  const openOverlay = document.getElementById('openOverlay');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlayContent');
  const tabEntrata = document.getElementById('tabEntrata');
  const tabUscita = document.getElementById('tabUscita');
  const overlayForm = document.getElementById('overlayForm');

  // Gestione apertura overlay
  openOverlay.addEventListener('click', () => {
    overlay.classList.remove('hidden');
    tabEntrata.classList.add('active');
    tabUscita.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Cambio tab Entrata
  tabEntrata.addEventListener('click', () => {
    tabEntrata.classList.add('active');
    tabUscita.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Cambio tab Uscita
  tabUscita.addEventListener('click', () => {
    tabUscita.classList.add('active');
    tabEntrata.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Chiudi overlay cliccando fuori
  overlay.addEventListener('mousedown', (e) => {
    if (!overlayContent.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  // Gestione submit form
  overlayForm.addEventListener('submit', e => {
    e.preventDefault();

    const nome = e.target.elements[0].value;
    const quantità = parseFloat(e.target.elements[1].value);

    const isEntrata = tabEntrata.classList.contains('active');

    if (isEntrata) {
      income += quantità;
      localStorage.setItem('income', income);
      document.getElementById('income').textContent = income.toFixed(2) + '€';
    } else {
      expensesData.push({ desc: nome, amount: quantità });
      localStorage.setItem('expensesData', JSON.stringify(expensesData));

      const nuovoLi = document.createElement('li');
      nuovoLi.textContent = `${nome}: -${quantità.toFixed(2)}€`;
      expensesList.appendChild(nuovoLi);
    }

    e.target.reset();
    overlay.classList.add('hidden');
  });

});
