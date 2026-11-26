// Account e sessioni.
// Password: PBKDF2-SHA256 (100.000 iterazioni, il massimo consentito dai Workers).
// Sessione: token casuale dato all'app; nel database c'è solo il suo hash.

import { b64, unb64, sha256, ora, idCasuale, ErroreHttp } from './util.js';

const ITERAZIONI = 100_000;
const DURATA_SESSIONE_GIORNI = 60;

export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const chiave = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERAZIONI }, chiave, 256);
  return { hash: b64(bits), salt: b64(salt) };
}

function uguali(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function validaCredenziali({ email, password }) {
  const e = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throw new ErroreHttp(400, 'Email non valida');
  const p = String(password || '');
  if (p.length < 8 || p.length > 200) throw new ErroreHttp(400, 'La password deve avere almeno 8 caratteri');
  return { email: e, password: p };
}

async function frenaTentativi(env, chiave) {
  const finestra = new Date(Date.now() - 15 * 60_000).toISOString();
  const r = await env.DB.prepare('SELECT conteggio, finestra FROM tentativi WHERE chiave = ?').bind(chiave).first();
  if (r && r.finestra > finestra && r.conteggio >= 8) {
    throw new ErroreHttp(429, 'Troppi tentativi. Riprova tra qualche minuto.');
  }
}
async function registraTentativo(env, chiave) {
  const finestra = new Date(Date.now() - 15 * 60_000).toISOString();
  await env.DB.prepare(
    `INSERT INTO tentativi (chiave, conteggio, finestra) VALUES (?1, 1, ?2)
     ON CONFLICT(chiave) DO UPDATE SET
       conteggio = CASE WHEN tentativi.finestra > ?3 THEN tentativi.conteggio + 1 ELSE 1 END,
       finestra = CASE WHEN tentativi.finestra > ?3 THEN tentativi.finestra ELSE ?2 END`
  ).bind(chiave, ora(), finestra).run();
}

async function creaSessione(env, utenteId) {
  const token = idCasuale(32);
  const scade = new Date(Date.now() + DURATA_SESSIONE_GIORNI * 86_400_000).toISOString();
  await env.DB.prepare('INSERT INTO sessioni (token_hash, utente_id, scade) VALUES (?, ?, ?)')
    .bind(await sha256(token), utenteId, scade).run();
  return token;
}

export async function registra(env, body) {
  const { email, password } = validaCredenziali(body);
  if (body.maggiorenne !== true) throw new ErroreHttp(400, 'Penna Viva è riservata ai maggiorenni');
  if (body.consenso !== true) throw new ErroreHttp(400, 'Serve il consenso al trattamento dei dati');
  const nome = String(body.nome || '').trim().slice(0, 60) || null;
  const esiste = await env.DB.prepare('SELECT 1 FROM utenti WHERE email = ?').bind(email).first();
  if (esiste) throw new ErroreHttp(409, 'Esiste già un account con questa email');
  const { hash, salt } = await hashPassword(password);
  const id = idCasuale(16);
  const t = ora();
  await env.DB.prepare(
    'INSERT INTO utenti (id, email, nome, pw_hash, pw_salt, maggiorenne_il, consenso_il, creato) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email, nome, hash, salt, t, t, t).run();
  return { token: await creaSessione(env, id), utente: { id, email, nome } };
}

export async function accedi(env, body) {
  const { email, password } = validaCredenziali(body);
  const chiave = `login:${email}`;
  await frenaTentativi(env, chiave);
  const u = await env.DB.prepare('SELECT id, email, nome, pw_hash, pw_salt FROM utenti WHERE email = ?').bind(email).first();
  // Si calcola comunque un hash per non rivelare, dai tempi, se l'email esiste.
  const { hash } = await hashPassword(password, u?.pw_salt || 'AAAAAAAAAAAAAAAAAAAAAA==');
  if (!u || !uguali(hash, u.pw_hash)) {
    await registraTentativo(env, chiave);
    throw new ErroreHttp(401, 'Email o password non corretti');
  }
  return { token: await creaSessione(env, u.id), utente: { id: u.id, email: u.email, nome: u.nome } };
}

export async function utenteDaRichiesta(env, req) {
  const m = /^Bearer ([a-z0-9]{20,64})$/i.exec(req.headers.get('authorization') || '');
  if (!m) throw new ErroreHttp(401, 'Accesso richiesto');
  const r = await env.DB.prepare(
    `SELECT u.id, u.email, u.nome, s.scade FROM sessioni s JOIN utenti u ON u.id = s.utente_id WHERE s.token_hash = ?`
  ).bind(await sha256(m[1])).first();
  if (!r || r.scade < ora()) throw new ErroreHttp(401, 'Sessione scaduta, accedi di nuovo');
  return { id: r.id, email: r.email, nome: r.nome, tokenHash: await sha256(m[1]) };
}

export async function esci(env, utente) {
  await env.DB.prepare('DELETE FROM sessioni WHERE token_hash = ?').bind(utente.tokenHash).run();
}

// Cancellazione completa con un tocco (GDPR): tutte le tabelle dell'utente.
export async function cancellaAccount(env, utente) {
  const tabelle = ['sessioni', 'voci_diario', 'dna', 'lavori', 'giornate'];
  await env.DB.batch([
    ...tabelle.map((t) => env.DB.prepare(`DELETE FROM ${t} WHERE utente_id = ?`).bind(utente.id)),
    env.DB.prepare('DELETE FROM utenti WHERE id = ?').bind(utente.id),
  ]);
}
