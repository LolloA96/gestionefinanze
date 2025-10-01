// document.js - gestione documenti caricati
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openAddDoc');        // bottone "+" per aggiungere documento
  const overlay = document.getElementById('overlay-add-doc');   // overlay principale
  const closeBtn = document.getElementById('closeAddDoc');      // bottone chiudi overlay
  const overlayContent = document.getElementById('contentAddDoc'); // contenitore interno
  const addDocForm = document.getElementById('addDocForm');     // form per aggiungere documento
  const docList = document.getElementById('docList');           // lista documenti caricati (se esiste)

  /* -------------------------
     Funzioni helper overlay
     ------------------------- */
  function openOverlay() {
    if (overlay) {
      overlay.classList.remove('hidden');
      addDocForm?.reset();
    }
  }

  function closeOverlay() {
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /* -------------------------
     Eventi overlay
     ------------------------- */
  openBtn?.addEventListener('click', openOverlay);
  closeBtn?.addEventListener('click', closeOverlay);

  // Chiudi overlay cliccando fuori dal box
  overlay?.addEventListener('mousedown', (e) => {
    if (overlayContent && !overlayContent.contains(e.target)) {
      closeOverlay();
    }
  });

  /* -------------------------
     Submit documento
     ------------------------- */
  addDocForm?.addEventListener('submit', e => {
    e.preventDefault();
    const fileInput = addDocForm.querySelector('input[type="file"]');
    if (!fileInput || fileInput.files.length === 0) {
      alert("❌ Seleziona un file prima di continuare.");
      return;
    }

    const file = fileInput.files[0];
    // Per ora solo demo: aggiunge in lista locale
    if (docList) {
      const li = document.createElement('li');
      li.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      docList.appendChild(li);
    }

    // TODO: integrazione con Firebase Storage
    // esempio: uploadBytes(storageRef, file).then(...)

    alert('✅ Documento aggiunto!');
    closeOverlay();
    addDocForm.reset();
  });
});