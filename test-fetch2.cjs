const { JSDOM } = require('jsdom');

fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://obs.itu.edu.tr/public/DersProgram/DersProgramSearch?ProgramSeviyeTipiAnahtari=LS&DersBransKoduId=26'))
  .then(r => r.text())
  .then(html => {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const table = document.querySelector('.table-responsive table tbody');
    if (!table) {
        console.log("No table found!");
        return;
    }
    const rows = table.querySelectorAll('tr');
    console.log("Found " + rows.length + " rows.");
    if (rows.length > 0) {
        const cols = rows[0].querySelectorAll('td');
        console.log("Row 0 columns: " + cols.length);
        if (cols.length >= 10) {
            console.log("CRN: " + cols[0].textContent.trim());
            console.log("Code: " + cols[1].textContent.trim());
            console.log("Day: " + cols[5].textContent.trim());
        }
    }
  })
  .catch(console.error);
