fetch('https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://obs.itu.edu.tr/public/DersProgram/DersProgramSearch?ProgramSeviyeTipiAnahtari=LS&DersBransKoduId=26'))
  .then(r => r.text())
  .then(html => {
    require('fs').writeFileSync('obs_mat.html', html);
    console.log("Saved obs_mat.html");
  })
  .catch(console.error);
