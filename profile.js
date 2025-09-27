function closeOverlay(id) {
  document.getElementById(id).classList.add('hidden');
}

function openSpeseOverlay(mese) {
  document.getElementById('spese-overlay').classList.remove('hidden');
  document.getElementById('titoloMese').innerText = 'Le Spese Di ' + mese;
}

document.getElementById('editProfileBtn').addEventListener('click', () => {
  document.getElementById('mod-profile-overlay').classList.remove('hidden');
});

// Chiudi overlay cliccando fuori dal box
['mod-profile-overlay', 'spese-overlay', 'risparmi-overlay'].forEach(id => {
  document.getElementById(id).addEventListener('mousedown', (e) => {
    const box = e.currentTarget.querySelector('.overlay-content');
    if (!box.contains(e.target)) e.currentTarget.classList.add('hidden');
  });
});
