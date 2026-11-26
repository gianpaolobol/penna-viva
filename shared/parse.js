// Estrazione e validazione delle risposte JSON dei modelli.
// I modelli a volte aggiungono ```json, testo introduttivo o virgole finali:
// qui li ripuliamo e poi validiamo la forma, così l'app non riceve mai dati rotti.

import { CINQUE, GENRES } from './genres.js';

export function extractJson(text) {
  if (typeof text !== 'string') throw new Error('Risposta vuota dal modello');
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Nessun JSON nella risposta');
  t = t.slice(start, end + 1);
  try {
    return JSON.parse(t);
  } catch {
    // virgole finali prima di } o ]
    return JSON.parse(t.replace(/,\s*([}\]])/g, '$1'));
  }
}

const clean = (s, max) =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

export function validaGiornata(obj) {
  const lista = Array.isArray(obj?.episodi) ? obj.episodi : null;
  if (!lista) throw new Error('Formato episodi non valido');
  const perGenere = new Map();
  for (const e of lista) {
    const k = String(e?.genere || '').toLowerCase().trim();
    if (CINQUE.includes(k) && !perGenere.has(k)) {
      const testo = clean(e.testo, 600);
      if (testo) perGenere.set(k, { genere: k, titolo: clean(e.titolo, 80), testo });
    }
  }
  const mancanti = CINQUE.filter((k) => !perGenere.has(k));
  if (mancanti.length) throw new Error(`Mancano i generi: ${mancanti.join(', ')}`);
  return { episodi: CINQUE.map((k) => perGenere.get(k)) };
}

export function validaDna(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('DNA non valido');
  const tratti = (Array.isArray(obj.tratti) ? obj.tratti : [])
    .slice(0, 6)
    .map((t) => ({
      nome: clean(t?.nome, 24),
      valore: Math.max(0, Math.min(100, Math.round(Number(t?.valore) || 0))),
    }))
    .filter((t) => t.nome);
  if (tratti.length < 3) throw new Error('DNA con troppo pochi tratti');
  const genere = String(obj.genereAffine || '').toLowerCase().trim();
  return {
    titolo: clean(obj.titolo, 48) || 'Penna in erba',
    tratti,
    voce: clean(obj.voce, 240),
    temi: (Array.isArray(obj.temi) ? obj.temi : []).map((x) => clean(x, 30)).filter(Boolean).slice(0, 5),
    genereAffine: GENRES[genere] ? genere : 'memorie',
    consiglio: clean(obj.consiglio, 280),
  };
}
