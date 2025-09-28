document.addEventListener('DOMContentLoaded', () => {
  // Dati iniziali
  let income = 1200;
  const savings = 400;
  const expenses = 800;

  document.getElementById('income').textContent = income.toFixed(2) + '€';
  document.getElementById('savings').textContent = savings.toFixed(2) + '€';

  // Lista spese iniziale
  const expensesData = [
    { desc: 'Spesa super', amount: 100 },
    { desc: 'Benzina', amount: 50 },
    { desc: 'Uscita serale', amount: 80 }
  ];

  const expensesList = document.getElementById('expensesList');
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

  // Apri overlay
  openOverlay.addEventListener('click', () => {
    overlay.classList.remove('hidden');
    tabEntrata.classList.add('active');
    tabUscita.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Cambia tab Entrata
  tabEntrata.addEventListener('click', () => {
    tabEntrata.classList.add('active');
    tabUscita.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Cambia tab Uscita
  tabUscita.addEventListener('click', () => {
    tabUscita.classList.add('active');
    tabEntrata.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Chiudi overlay click fuori
  overlay.addEventListener('mousedown', (e) => {
    if (!overlayContent.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  // Gestione submit form aggiunta
  overlayForm.addEventListener('submit', e => {
    e.preventDefault();

    const nome = e.target.elements[0].value;
    const quantità = parseFloat(e.target.elements[1].value);

    const isEntrata = tabEntrata.classList.contains('active');

    if (isEntrata) {
      // Somma entrate esistenti con nuova
      income += quantità;
      document.getElementById('income').textContent = income.toFixed(2) + '€';
    } else {
      // Crea nuovo elemento spesa nella lista
      const nuovoLi = document.createElement('li');
      nuovoLi.textContent = `${nome}: -${quantità.toFixed(2)}€`;
      expensesList.appendChild(nuovoLi);
    }

    e.target.reset();
    overlay.classList.add('hidden');
  });
});
