document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openAddDoc');
  const overlay = document.getElementById('overlay-add-doc');
  const closeBtn = document.getElementById('closeAddDoc');
  const overlayContent = document.getElementById('contentAddDoc');
  const addDocForm = document.getElementById('addDocForm');

  openBtn.addEventListener('click', () => {
    overlay.classList.remove('hidden');
    addDocForm.reset();
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });

  // Chiudi overlay cliccando fuori dal box
  overlay.addEventListener('mousedown', (e) => {
    if (!overlayContent.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  // Demo submit
  addDocForm.addEventListener('submit', e => {
    e.preventDefault();
    overlay.classList.add('hidden');
    alert('Documento aggiunto!');
  });
});
