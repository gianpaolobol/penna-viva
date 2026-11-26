// Immagini da condividere (formato 4:5, 1080×1350, adatto a Instagram e WhatsApp).
// Disegnate su canvas nel telefono: nessun server, nessun costo.

import { GENRES } from '../../shared/genres.js';

const W = 1080;
const H = 1350;

function aCapo(ctx, testo, maxW) {
  const parole = testo.split(/\s+/);
  const righe = [];
  let riga = '';
  for (const p of parole) {
    const prova = riga ? `${riga} ${p}` : p;
    if (ctx.measureText(prova).width > maxW && riga) { righe.push(riga); riga = p; } else riga = prova;
  }
  if (riga) righe.push(riga);
  return righe;
}

function testoAdattato(ctx, testo, { x, y, maxW, maxH, font, da = 64, a = 34, interlinea = 1.3 }) {
  let size = da;
  let righe;
  for (; size >= a; size -= 2) {
    ctx.font = font(size);
    righe = aCapo(ctx, testo, maxW);
    if (righe.length * size * interlinea <= maxH) break;
  }
  righe.forEach((r, i) => ctx.fillText(r, x, y + i * size * interlinea));
  return righe.length * size * interlinea;
}

function sfondo(ctx, bg, bordo) {
  ctx.fillStyle = '#0E0B1F';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.strokeStyle = bordo;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(60, 60, W - 120, H - 120, 56);
  ctx.fill();
  ctx.stroke();
}

function etichetta(ctx, testo, colore, x, y) {
  ctx.font = '700 34px Manrope, sans-serif';
  const w = ctx.measureText(testo).width + 48;
  ctx.fillStyle = colore;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 60, 24);
  ctx.fill();
  ctx.fillStyle = '#1B1530';
  ctx.fillText(testo, x + 24, y + 42);
}

async function pronto() {
  try { await document.fonts.ready; } catch { /* nessun problema */ }
}

export async function immagineEpisodio(ep, indice, totale) {
  await pronto();
  const g = GENRES[ep.genere];
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  sfondo(ctx, g.bg, g.color);
  etichetta(ctx, g.label, g.color, 130, 130);
  ctx.fillStyle = g.color;
  ctx.font = '600 44px Fraunces, Georgia, serif';
  ctx.fillText(ep.titolo, 130, 300);
  ctx.fillStyle = '#F4EFE6';
  testoAdattato(ctx, ep.testo, { x: 130, y: 420, maxW: W - 260, maxH: 680, font: (s) => `400 ${s}px Fraunces, Georgia, serif` });
  ctx.fillStyle = '#B9B3D1';
  ctx.font = 'italic 400 32px Fraunces, Georgia, serif';
  ctx.fillText(`Penna Viva · ${indice + 1} di ${totale}`, 130, H - 140);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

export async function immagineDna(dna) {
  await pronto();
  const g = GENRES[dna.genereAffine] || GENRES.memorie;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  sfondo(ctx, '#1A1633', g.color);
  ctx.fillStyle = '#2DD4BF';
  ctx.font = '700 32px Manrope, sans-serif';
  ctx.fillText('IL MIO DNA NARRATIVO', 130, 170);
  ctx.fillStyle = '#F4EFE6';
  const hTitolo = testoAdattato(ctx, dna.titolo, { x: 130, y: 260, maxW: W - 260, maxH: 170, font: (s) => `italic 600 ${s}px Fraunces, Georgia, serif`, da: 76, a: 48, interlinea: 1.1 });
  let y = 260 + hTitolo + 40;
  for (const t of dna.tratti.slice(0, 5)) {
    ctx.fillStyle = '#F4EFE6';
    ctx.font = '700 34px Manrope, sans-serif';
    ctx.fillText(t.nome, 130, y);
    ctx.fillStyle = '#B9B3D1';
    ctx.textAlign = 'right';
    ctx.fillText(String(t.valore), W - 130, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#241F45';
    ctx.beginPath(); ctx.roundRect(130, y + 18, W - 260, 22, 11); ctx.fill();
    ctx.fillStyle = g.color;
    ctx.beginPath(); ctx.roundRect(130, y + 18, Math.max(22, (W - 260) * t.valore / 100), 22, 11); ctx.fill();
    y += 112;
  }
  ctx.fillStyle = '#F4EFE6';
  testoAdattato(ctx, dna.voce, { x: 130, y: y + 30, maxW: W - 260, maxH: H - y - 260, font: (s) => `400 ${s}px Fraunces, Georgia, serif`, da: 40, a: 28 });
  ctx.fillStyle = '#B9B3D1';
  ctx.font = 'italic 400 32px Fraunces, Georgia, serif';
  ctx.fillText(`Genere affine: ${g.label} · Penna Viva`, 130, H - 140);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

// Condivide con il foglio di condivisione del telefono; altrimenti scarica il file.
export async function condividiFile(blobs, nomeBase, testo) {
  const files = blobs.map((b, i) => new File([b], `${nomeBase}${blobs.length > 1 ? `-${i + 1}` : ''}.png`, { type: 'image/png' }));
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, text: testo });
      return 'condiviso';
    } catch (e) {
      if (e?.name === 'AbortError') return 'annullato';
    }
  }
  for (const f of files) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  return 'scaricato';
}

export async function condividiLink(url, testo) {
  if (navigator.share) {
    try { await navigator.share({ url, text: testo }); return 'condiviso'; } catch (e) { if (e?.name === 'AbortError') return 'annullato'; }
  }
  try { await navigator.clipboard.writeText(url); return 'copiato'; } catch { return 'errore'; }
}
