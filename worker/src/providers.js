// Livello "fornitori": stessa interfaccia per tutti.
//   genera({ system, user }) -> testo della risposta
// Cambiare fornitore o modello = cambiare una variabile in wrangler.toml.
//
// Scelta del fornitore (vedi planning, "Tre livelli di accesso all'IA"):
//  1. l'utente ha collegato OpenRouter -> sua chiave, nessun limite nostro
//  2. altrimenti quota gratuita sulla NOSTRA chiave Gemini a pagamento
//     (i termini Gemini non consentono chiavi gratuite di utenti consumer nel SEE)
//  3. riserva automatica: OpenRouter con la nostra chiave, se configurata

import { CINQUE, GENRES } from '../../shared/genres.js';

const TIMEOUT_MS = 25_000;

async function conTimeout(url, opzioni) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opzioni, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export function gemini(apiKey, modello) {
  return {
    nome: `gemini:${modello}`,
    async genera({ system, user }) {
      const res = await conTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modello)}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { temperature: 0.95, responseMimeType: 'application/json', maxOutputTokens: 2048 },
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const d = await res.json();
      const testo = d?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
      if (!testo) throw new Error('Gemini: risposta vuota o bloccata');
      return testo;
    },
  };
}

export function openrouter(apiKey, modello, appUrl) {
  return {
    nome: `openrouter:${modello}`,
    async genera({ system, user }) {
      const res = await conTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': appUrl || 'https://pennaviva.app',
          'X-Title': 'Penna Viva',
        },
        body: JSON.stringify({
          model: modello,
          temperature: 0.95,
          max_tokens: 2048,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
      const d = await res.json();
      const testo = d?.choices?.[0]?.message?.content;
      if (!testo) throw new Error('OpenRouter: risposta vuota');
      return testo;
    },
  };
}

// Fornitore finto: per sviluppo locale e test, nessuna chiamata di rete.
export function finto() {
  return {
    nome: 'finto',
    async genera({ user }) {
      if (user.includes('"episodi"')) {
        const brano = (user.split('"""')[1] || '').trim().slice(0, 60);
        return JSON.stringify({
          episodi: CINQUE.map((k) => ({
            genere: k,
            titolo: `${GENRES[k].label} di prova`,
            testo: `[${GENRES[k].label}] ${brano}… e la giornata prese una piega inattesa.`,
          })),
        });
      }
      return JSON.stringify({
        titolo: 'La cronista ironica',
        tratti: [
          { nome: 'Ironia', valore: 72 },
          { nome: 'Ritmo', valore: 64 },
          { nome: 'Dettaglio', valore: 81 },
          { nome: 'Emozione', valore: 55 },
          { nome: 'Dialogo', valore: 30 },
        ],
        voce: 'Racconti le piccole cose con uno sguardo divertito e preciso.',
        temi: ['città', 'lavoro', 'imprevisti'],
        genereAffine: 'umoristico',
        consiglio: 'Prova a far parlare di più le persone che incontri.',
      });
    },
  };
}

// Restituisce la catena di fornitori da provare in ordine.
export function sceltaFornitori(env, { chiaveUtente }) {
  if (env.MOCK_AI === '1') return { accesso: chiaveUtente ? 'personale' : 'gratuito', catena: [finto()] };
  if (chiaveUtente) {
    return { accesso: 'personale', catena: [openrouter(chiaveUtente, env.OPENROUTER_MODEL, env.APP_URL)] };
  }
  const catena = [];
  if (env.GEMINI_API_KEY) catena.push(gemini(env.GEMINI_API_KEY, env.GEMINI_MODEL));
  if (env.OPENROUTER_API_KEY) catena.push(openrouter(env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL, env.APP_URL));
  return { accesso: 'gratuito', catena };
}
