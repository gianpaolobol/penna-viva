// Penna Viva — intermediario (Cloudflare Worker).
// Il telefono non parla mai direttamente con l'IA: passa da qui,
// che custodisce la nostra chiave, applica i tetti di spesa e salva i risultati.

import { registra, accedi, esci, utenteDaRichiesta, cancellaAccount } from './auth.js';
import { nuovaGiornata, nuovoDna, statoLavoro } from './jobs.js';
import { paginaGiornata, paginaNonTrovata } from './pagina.js';
import { json, leggiJson, ErroreHttp, idCasuale, ora, oggi } from './util.js';

function cors(env, req) {
  const origine = req.headers.get('origin');
  const ammesse = String(env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim());
  if (!origine || !ammesse.includes(origine)) return {};
  return {
    'access-control-allow-origin': origine,
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-openrouter-key',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

// Chiave OpenRouter dell'utente: resta sul suo telefono e viaggia solo con la richiesta.
// Non viene mai salvata né scritta nei log.
function chiaveUtente(req) {
  const k = (req.headers.get('x-openrouter-key') || '').trim();
  if (!k) return null;
  if (!/^sk-or-[A-Za-z0-9_-]{10,200}$/.test(k)) throw new ErroreHttp(400, 'Chiave OpenRouter non valida');
  return k;
}

async function io(env, utente) {
  const dna = await env.DB.prepare('SELECT dati FROM dna WHERE utente_id = ?').bind(utente.id).first();
  const diario = await env.DB.prepare('SELECT COALESCE(SUM(LENGTH(testo)), 0) AS c FROM voci_diario WHERE utente_id = ?')
    .bind(utente.id).first();
  const usate = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM lavori WHERE utente_id = ? AND accesso = 'gratuito' AND stato != 'errore' AND creato >= ?`
  ).bind(utente.id, `${oggi()}T00:00:00.000Z`).first();
  return {
    utente: { id: utente.id, email: utente.email, nome: utente.nome },
    dna: dna ? JSON.parse(dna.dati) : null,
    caratteriDiario: diario?.c || 0,
    gratisRimaste: Math.max(0, Number(env.GRATIS_PER_UTENTE || 3) - (usate?.n || 0)),
  };
}

async function gestisci(req, env, ctx) {
  const url = new URL(req.url);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;

  // Pagina pubblica condivisibile
  const pg = /^\/g\/([a-z0-9]{6,20})$/.exec(p);
  if (pg && m === 'GET') {
    const r = await env.DB.prepare('SELECT episodi FROM giornate WHERE id = ? AND pubblica = 1 AND episodi IS NOT NULL')
      .bind(pg[1]).first();
    const html = r ? paginaGiornata({ episodi: JSON.parse(r.episodi), appUrl: env.APP_URL, urlPagina: url.origin + p }) : paginaNonTrovata(env.APP_URL);
    return new Response(html, {
      status: r ? 200 : 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-security-policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'",
        'cache-control': 'public, max-age=300',
      },
    });
  }

  if (p === '/api/salute') return json({ ok: true, ora: ora() });
  if (p === '/api/registrati' && m === 'POST') return json(await registra(env, await leggiJson(req)), 201);
  if (p === '/api/accedi' && m === 'POST') return json(await accedi(env, await leggiJson(req)));

  // Da qui in poi serve l'accesso
  if (!p.startsWith('/api/')) throw new ErroreHttp(404, 'Non trovato');
  const utente = await utenteDaRichiesta(env, req);

  if (p === '/api/esci' && m === 'POST') {
    await esci(env, utente);
    return json({ ok: true });
  }
  if (p === '/api/io' && m === 'GET') return json(await io(env, utente));
  if (p === '/api/account' && m === 'DELETE') {
    await cancellaAccount(env, utente);
    return json({ ok: true });
  }

  // Diario
  if (p === '/api/diario' && m === 'GET') {
    const r = await env.DB.prepare('SELECT id, testo, origine, creato FROM voci_diario WHERE utente_id = ? ORDER BY creato DESC LIMIT 100')
      .bind(utente.id).all();
    return json({ voci: r.results || [] });
  }
  if (p === '/api/diario' && m === 'POST') {
    const b = await leggiJson(req);
    const testo = String(b.testo || '').trim();
    if (testo.length < 3 || testo.length > 5000) throw new ErroreHttp(400, 'Testo tra 3 e 5000 caratteri');
    const origine = b.origine === 'voce' ? 'voce' : 'scritto';
    const id = idCasuale(16);
    await env.DB.prepare('INSERT INTO voci_diario (id, utente_id, testo, origine, creato) VALUES (?, ?, ?, ?, ?)')
      .bind(id, utente.id, testo, origine, ora()).run();
    return json({ id }, 201);
  }
  const dv = /^\/api\/diario\/([a-z0-9]+)$/.exec(p);
  if (dv && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM voci_diario WHERE id = ? AND utente_id = ?').bind(dv[1], utente.id).run();
    return json({ ok: true });
  }

  // DNA narrativo
  if (p === '/api/dna' && m === 'POST') return json(await nuovoDna(env, ctx, utente, chiaveUtente(req)), 202);

  // La tua giornata in 5 generi
  if (p === '/api/giornate' && m === 'POST') {
    return json(await nuovaGiornata(env, ctx, utente, await leggiJson(req), chiaveUtente(req)), 202);
  }
  if (p === '/api/giornate' && m === 'GET') {
    const r = await env.DB.prepare(
      'SELECT id, racconto, episodi, pubblica, creato FROM giornate WHERE utente_id = ? AND episodi IS NOT NULL ORDER BY creato DESC LIMIT 50'
    ).bind(utente.id).all();
    return json({
      giornate: (r.results || []).map((g) => ({ ...g, episodi: JSON.parse(g.episodi), pubblica: !!g.pubblica })),
    });
  }
  const gg = /^\/api\/giornate\/([a-z0-9]+)$/.exec(p);
  if (gg && m === 'PATCH') {
    const b = await leggiJson(req);
    const r = await env.DB.prepare('UPDATE giornate SET pubblica = ? WHERE id = ? AND utente_id = ? AND episodi IS NOT NULL')
      .bind(b.pubblica ? 1 : 0, gg[1], utente.id).run();
    if (!r.meta?.changes) throw new ErroreHttp(404, 'Giornata non trovata');
    return json({ ok: true, url: `${new URL(req.url).origin}/g/${gg[1]}` });
  }
  if (gg && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM giornate WHERE id = ? AND utente_id = ?').bind(gg[1], utente.id).run();
    return json({ ok: true });
  }

  const lv = /^\/api\/lavori\/([a-z0-9]+)$/.exec(p);
  if (lv && m === 'GET') return json(await statoLavoro(env, utente, lv[1]));

  throw new ErroreHttp(404, 'Non trovato');
}

export default {
  async fetch(req, env, ctx) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    try {
      const res = await gestisci(req, env, ctx);
      for (const [k, v] of Object.entries(h)) res.headers.set(k, v);
      return res;
    } catch (e) {
      const status = e instanceof ErroreHttp ? e.status : 500;
      if (status === 500) console.error(e);
      return json({ errore: status === 500 ? 'Errore interno' : e.message }, status, h);
    }
  },
};
