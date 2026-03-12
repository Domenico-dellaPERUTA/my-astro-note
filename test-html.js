import fs from 'fs';
fetch('http://localhost:4321/en/?id=1').then(r => r.text()).then(t => {
  const match = t.match(/<div[^>]*id="testo-renderizzato"[^>]*>/);
  console.log(match ? match[0] : "Not found");
});
