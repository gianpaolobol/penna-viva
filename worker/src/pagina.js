// Pagina pubblica di una "Giornata in 5 generi": /g/:id
// È il motore della condivisione: mostra i 5 episodi e il pulsante "Crea la tua".
// Il racconto originale dell'utente NON compare mai qui.

import { GENRES } from '../../shared/genres.js';
import { escapeHtml as e } from './util.js';

export function paginaGiornata({ episodi, appUrl, urlPagina }) {
  const primo = episodi[0];
  const descr = `${primo.testo.slice(0, 150)}…`;
  const carte = episodi
    .map((ep, i) => {
      const g = GENRES[ep.genere];
      return `<article class="carta" style="--c:${g.color};--bg:${g.bg}">
  <span class="etichetta">${e(g.label)}</span>
  <h2>${e(ep.titolo)}</h2>
  <p>${e(ep.testo)}</p>
  <span class="piede">Penna Viva · ${i + 1} di ${episodi.length}</span>
</article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Una giornata in 5 generi · Penna Viva</title>
<meta name="description" content="${e(descr)}">
<meta property="og:title" content="Una giornata in 5 generi">
<meta property="og:description" content="${e(descr)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${e(urlPagina)}">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Manrope:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;background:#0E0B1F;color:#F4EFE6;font-family:Manrope,system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:48px 20px 64px}
.sopra{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2DD4BF}
h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(30px,6vw,44px);line-height:1.1;margin:8px 0 28px}
h1 em{color:#FF7A59}
.carte{display:grid;gap:16px}
.carta{background:var(--bg);border:2px solid var(--c);border-radius:26px;padding:24px;display:flex;flex-direction:column;gap:12px}
.etichetta{align-self:flex-start;font-size:13px;font-weight:700;color:#1B1530;background:var(--c);border-radius:12px;padding:4px 12px}
.carta h2{margin:0;font-family:Fraunces,Georgia,serif;font-size:20px}
.carta p{margin:0;font-family:Fraunces,Georgia,serif;font-size:21px;line-height:1.4}
.piede{font-family:Fraunces,Georgia,serif;font-style:italic;font-size:14px;color:#B9B3D1}
.cta{display:flex;align-items:center;justify-content:center;margin-top:32px;height:56px;border-radius:28px;background:#FF7A59;color:#1B1530;font-weight:700;font-size:17px;text-decoration:none}
.nota{margin-top:16px;font-size:13px;color:#B9B3D1;text-align:center}
</style>
</head>
<body>
<main>
  <span class="sopra">Penna Viva</span>
  <h1>Una giornata<br><em>in 5 generi</em></h1>
  <div class="carte">
${carte}
  </div>
  <a class="cta" href="${e(appUrl)}">Racconta la tua giornata</a>
  <p class="nota">Testi scritti con l'aiuto dell'intelligenza artificiale a partire dal racconto di una persona vera.</p>
</main>
</body>
</html>`;
}

export function paginaNonTrovata(appUrl) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Penna Viva</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E0B1F;color:#F4EFE6;font-family:system-ui,sans-serif;text-align:center;padding:24px}a{color:#FF7A59}</style></head>
<body><div><p>Questa pagina non esiste o non è più condivisa.</p><p><a href="${e(appUrl)}">Vai a Penna Viva</a></p></div></body></html>`;
}
