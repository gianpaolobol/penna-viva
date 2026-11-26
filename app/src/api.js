// Client dell'intermediario. Il token di sessione e l'eventuale chiave
// OpenRouter restano sul dispositivo (localStorage).

export const API = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/$/, '');

const K_TOKEN = 'pv_token';
export const K_OPENROUTER = 'pv_openrouter_key';

const leggi = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const scrivi = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* modalità privata */ } };

export const token = () => leggi(K_TOKEN);
export const impostaToken = (t) => scrivi(K_TOKEN, t);
export const chiaveOpenRouter = () => leggi(K_OPENROUTER);
export const impostaChiaveOpenRouter = (k) => scrivi(K_OPENROUTER, k);

export class ErroreApi extends Error {
  constructor(status, messaggio) { super(messaggio); this.status = status; }
}

export async function chiama(percorso, { metodo = 'GET', corpo } = {}) {
  const headers = {};
  if (corpo) headers['content-type'] = 'application/json';
  const t = token();
  if (t) headers.authorization = `Bearer ${t}`;
  const k = chiaveOpenRouter();
  if (k) headers['x-openrouter-key'] = k;
  let res;
  try {
    res = await fetch(`${API}${percorso}`, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch {
    throw new ErroreApi(0, 'Connessione assente. Controlla la rete e riprova.');
  }
  const dati = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && t) impostaToken(null);
    throw new ErroreApi(res.status, dati.errore || 'Qualcosa è andato storto');
  }
  return dati;
}

// Attende la fine di un lavoro IA leggendone lo stato.
export async function attendiLavoro(id, { ogniMs = 1500, maxMs = 90_000 } = {}) {
  const inizio = Date.now();
  while (Date.now() - inizio < maxMs) {
    const l = await chiama(`/api/lavori/${id}`);
    if (l.stato === 'pronto') return l.risultato;
    if (l.stato === 'errore') throw new ErroreApi(500, l.errore || 'La penna si è inceppata');
    await new Promise((r) => setTimeout(r, ogniMs));
  }
  throw new ErroreApi(504, 'Ci sta mettendo troppo. Riprova tra poco.');
}
