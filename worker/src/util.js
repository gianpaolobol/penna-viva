// Utilità comuni dell'intermediario.

export const ora = () => new Date().toISOString();
export const oggi = () => new Date().toISOString().slice(0, 10);

const ALFABETO = 'abcdefghijkmnopqrstuvwxyz23456789';
export function idCasuale(n = 12) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => ALFABETO[x % ALFABETO.length]).join('');
}

export function b64(bytes) {
  let s = '';
  for (const x of new Uint8Array(bytes)) s += String.fromCharCode(x);
  return btoa(s);
}
export function unb64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export async function sha256(testo) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
  return Array.from(new Uint8Array(h), (x) => x.toString(16).padStart(2, '0')).join('');
}

export class ErroreHttp extends Error {
  constructor(status, messaggio) {
    super(messaggio);
    this.status = status;
  }
}

export function json(dati, status = 200, headers = {}) {
  return new Response(JSON.stringify(dati), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export async function leggiJson(req, maxBytes = 64_000) {
  const lungh = Number(req.headers.get('content-length') || 0);
  if (lungh > maxBytes) throw new ErroreHttp(413, 'Richiesta troppo grande');
  const testo = await req.text();
  if (testo.length > maxBytes) throw new ErroreHttp(413, 'Richiesta troppo grande');
  try {
    return testo ? JSON.parse(testo) : {};
  } catch {
    throw new ErroreHttp(400, 'JSON non valido');
  }
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
