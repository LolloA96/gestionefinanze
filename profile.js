// profile.js - gestione overlay profilo e spese
document.addEventListener('DOMContentLoaded', () => {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const overlays = ['mod-profile-overlay', 'spese-overlay', 'risparmi-overlay'];

  /* -------------------------
     Funzioni helper overlay
     ------------------------- */
  function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function openOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function openSpeseOverlay(mese) {
    const speseOverlay = document.getElementById('spese-overlay');
    const titoloMese = document.getElementById('titoloMese');

    if (speseOverlay) speseOverlay.classList.remove('hidden');
    if (titoloMese) titoloMese.innerText = 'Le Spese di ' + mese;
  }

  /* -------------------------
     Eventi overlay
     ------------------------- */
  editProfileBtn?.addEventListener('click', () => {
    openOverlay('mod-profile-overlay');
  });

  // Chiudi overlay cliccando fuori dal box
  overlays.forEach(id => {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    overlay.addEventListener('mousedown', (e) => {
      const box = overlay.querySelector('.overlay-content');
      if (box && !box.contains(e.target)) {
        overlay.classList.add('hidden');
      }
    });
  });

  /* -------------------------
     Espongo funzioni globali
     ------------------------- */
  window.closeOverlay = closeOverlay;
  window.openSpeseOverlay = openSpeseOverlay;
});