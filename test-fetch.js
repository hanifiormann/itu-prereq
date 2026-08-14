fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://obs.itu.edu.tr/public/DersProgram/SearchBransKoduByProgramSeviye?programSeviyeTipiAnahtari=LS'))
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
