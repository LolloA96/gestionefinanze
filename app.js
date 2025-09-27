document.addEventListener('DOMContentLoaded', () => {

  // Simulazione dati iniziali
  const income = 1200;
  const savings = 400;
  const expenses = 800;

  document.getElementById('income').textContent = income.toFixed(2) + '€';
  document.getElementById('savings').textContent = savings.toFixed(2) + '€';

  // Simulazione lista spese
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

  // Elementi overlay e pulsanti
  const openOverlay = document.getElementById('openOverlay');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlayContent');
  const tabEntrata = document.getElementById('tabEntrata');
  const tabUscita = document.getElementById('tabUscita');
  const overlayForm = document.getElementById('overlayForm');

  // Apri overlay con pulsante +
  openOverlay.addEventListener('click', () => {
    overlay.classList.remove('hidden');
    tabEntrata.classList.add('active');
    tabUscita.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Cambio tab a Entrata
  tabEntrata.addEventListener('click', () => {
    tabEntrata.classList.add('active');
    tabUscita.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Cambio tab a Uscita
  tabUscita.addEventListener('click', () => {
    tabUscita.classList.add('active');
    tabEntrata.classList.remove('active');
    overlayForm.reset();
    overlayForm.querySelector('button[type="submit"]').innerHTML = '<span style="font-size:1.4em;">+</span> Aggiungi ora';
  });

  // Chiudi overlay cliccando fuori dal box
  overlay.addEventListener('mousedown', (e) => {
    if (!overlayContent.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  // Submit form demo
  overlayForm.addEventListener('submit', e => {
    e.preventDefault();
    alert('Operazione aggiunta!');
    overlay.classList.add('hidden');
  });

});
