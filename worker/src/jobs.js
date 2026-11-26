// Coda dei lavori IA.
// Fase 1: il lavoro viene registrato in D1 ed eseguito subito in background
// (ctx.waitUntil); l'app legge lo stato con GET /api/lavori/:id.
// Quando servirà più robustezza si sposta l'esecuzione su Cloudflare Queues
// senza cambiare l'API vista dall'app.

import { promptGiornata, promptDna, LIMITI } from '../../shared/prompts.js';
import { extractJson, validaGiornata, validaDna } from '../../shared/parse.js';
import { sceltaFornitori } from './providers.js';
import { ora, oggi, idCasuale, ErroreHttp } from './util.js';

async function controllaQuote(env, utente) {
  const tetto = Number(env.TETTO_GIORNALIERO || 500);
  const perUtente = Number(env.GRATIS_PER_UTENTE || 3);
  const g = oggi();
  const globale = await env.DB.prepare('SELECT chiamate FROM uso WHERE giorno = ?').bind(g).first();
  if ((globale?.chiamate || 0) >= tetto) {
    throw new ErroreHttp(429, 'Per oggi le storie gratuite sono finite. Collega OpenRouter per continuare subito, oppure riprova domani.');
  }
  const mio = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM lavori WHERE utente_id = ? AND accesso = 'gratuito' AND stato != 'errore' AND creato >= ?`
  ).bind(utente.id, `${g}T00:00:00.000Z`).first();
  if ((mio?.n || 0) >= perUtente) {
    throw new ErroreHttp(429, `Hai usato le ${perUtente} storie gratuite di oggi. Collega OpenRouter per continuare gratis con la tua chiave.`);
  }
}

async function contaUso(env) {
  await env.DB.prepare(
    'INSERT INTO uso (giorno, chiamate) VALUES (?, 1) ON CONFLICT(giorno) DO UPDATE SET chiamate = chiamate + 1'
  ).bind(oggi()).run();
}

// Esegue il prompt sulla catena di fornitori: se uno fallisce si passa al successivo.
// Un tentativo in più sullo stesso fornitore se il JSON non è valido.
export async function eseguiPrompt(catena, prompt, valida) {
  const errori = [];
  for (const f of catena) {
    for (let tentativo = 0; tentativo < 2; tentativo++) {
      try {
        const testo = await f.genera(prompt);
        return { fornitore: f.nome, dati: valida(extractJson(testo)) };
      } catch (e) {
        errori.push(`${f.nome}: ${e.message}`);
        if (/^(Gemini|OpenRouter) (4\d\d)/.test(e.message)) break; // errore di chiave/richiesta: inutile riprovare
      }
    }
  }
  throw new Error(errori.join(' | ') || 'Nessun fornitore IA configurato');
}

async function creaLavoro(env, ctx, utente, tipo, chiaveUtente, prompt, valida, dopo, prima) {
  const { accesso, catena } = sceltaFornitori(env, { chiaveUtente });
  if (!catena.length) throw new ErroreHttp(503, 'Il servizio IA non è ancora configurato');
  if (accesso === 'gratuito') await controllaQuote(env, utente);

  const id = idCasuale(16);
  const t = ora();
  await env.DB.prepare(
    `INSERT INTO lavori (id, utente_id, tipo, stato, accesso, creato, aggiornato) VALUES (?, ?, ?, 'in_coda', ?, ?, ?)`
  ).bind(id, utente.id, tipo, accesso, t, t).run();
  await prima?.(id);

  const esegui = async () => {
    await env.DB.prepare(`UPDATE lavori SET stato = 'in_corso', aggiornato = ? WHERE id = ?`).bind(ora(), id).run();
    try {
      if (accesso === 'gratuito') await contaUso(env);
      const { fornitore, dati } = await eseguiPrompt(catena, prompt, valida);
      await dopo?.(dati);
      await env.DB.prepare(`UPDATE lavori SET stato = 'pronto', fornitore = ?, risultato = ?, aggiornato = ? WHERE id = ?`)
        .bind(fornitore, JSON.stringify(dati), ora(), id).run();
    } catch (e) {
      console.error('lavoro', id, e.message);
      await env.DB.prepare(`UPDATE lavori SET stato = 'errore', errore = ?, aggiornato = ? WHERE id = ?`)
        .bind('La penna si è inceppata. Riprova tra poco.', ora(), id).run();
    }
  };
  ctx.waitUntil(esegui());
  return id;
}

export async function nuovaGiornata(env, ctx, utente, body, chiaveUtente) {
  const racconto = String(body.racconto || '').trim();
  if (racconto.length < LIMITI.giornataMinChars) throw new ErroreHttp(400, 'Raccontami qualcosa in più della tua giornata');
  if (racconto.length > LIMITI.giornataMaxChars) throw new ErroreHttp(400, `Massimo ${LIMITI.giornataMaxChars} caratteri`);
  const dnaRiga = await env.DB.prepare('SELECT dati FROM dna WHERE utente_id = ?').bind(utente.id).first();
  const dna = dnaRiga ? JSON.parse(dnaRiga.dati) : null;
  const giornataId = idCasuale(10);

  const lavoroId = await creaLavoro(env, ctx, utente, 'giornata', chiaveUtente, promptGiornata(racconto, dna), validaGiornata,
    async (dati) => {
      await env.DB.prepare('UPDATE giornate SET episodi = ? WHERE id = ?').bind(JSON.stringify(dati.episodi), giornataId).run();
    },
    async (lavoroId) => {
      await env.DB.prepare('INSERT INTO giornate (id, utente_id, lavoro_id, racconto, creato) VALUES (?, ?, ?, ?, ?)')
        .bind(giornataId, utente.id, lavoroId, racconto, ora()).run();
    });
  // Il racconto originale finisce anche nel diario: è contributo dell'autore.
  if (body.origine === 'voce' || body.origine === 'scritto') {
    await env.DB.prepare('INSERT INTO voci_diario (id, utente_id, testo, origine, creato) VALUES (?, ?, ?, ?, ?)')
      .bind(idCasuale(16), utente.id, racconto, body.origine, ora()).run();
  }
  return { lavoroId, giornataId };
}

export async function nuovoDna(env, ctx, utente, chiaveUtente) {
  const righe = await env.DB.prepare(
    'SELECT testo FROM voci_diario WHERE utente_id = ? ORDER BY creato DESC LIMIT 60'
  ).bind(utente.id).all();
  let testi = (righe.results || []).map((r) => r.testo).join('\n---\n');
  if (testi.length < LIMITI.dnaMinChars) {
    throw new ErroreHttp(400, `Per il DNA narrativo servono almeno ${LIMITI.dnaMinChars} caratteri nel diario (ora ${testi.length}). Racconta ancora un po'.`);
  }
  testi = testi.slice(0, LIMITI.dnaMaxChars);
  const lavoroId = await creaLavoro(env, ctx, utente, 'dna', chiaveUtente, promptDna(testi), validaDna, async (dati) => {
    await env.DB.prepare(
      'INSERT INTO dna (utente_id, dati, aggiornato) VALUES (?, ?, ?) ON CONFLICT(utente_id) DO UPDATE SET dati = excluded.dati, aggiornato = excluded.aggiornato'
    ).bind(utente.id, JSON.stringify(dati), ora()).run();
  });
  return { lavoroId };
}

export async function statoLavoro(env, utente, id) {
  const r = await env.DB.prepare(
    'SELECT id, tipo, stato, risultato, errore FROM lavori WHERE id = ? AND utente_id = ?'
  ).bind(id, utente.id).first();
  if (!r) throw new ErroreHttp(404, 'Lavoro non trovato');
  return { id: r.id, tipo: r.tipo, stato: r.stato, risultato: r.risultato ? JSON.parse(r.risultato) : null, errore: r.errore };
}
