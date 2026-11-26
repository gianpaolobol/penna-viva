// "Accedi con OpenRouter" (OAuth PKCE).
// L'utente collega il proprio account con un tocco e ottiene una chiave
// che resta sul suo telefono: può usare i modelli gratuiti o i propri crediti.
// Documentazione: https://openrouter.ai/docs/use-cases/oauth-pkce

import { impostaChiaveOpenRouter } from './api.js';

const K_VERIFIER = 'pv_or_verifier';

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function collegaOpenRouter() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  sessionStorage.setItem(K_VERIFIER, verifier);
  const ritorno = `${location.origin}${location.pathname}`;
  location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(ritorno)}&code_challenge=${challenge}&code_challenge_method=S256`;
}

// Da chiamare all'avvio: se l'URL contiene ?code=, completa il collegamento.
export async function completaOpenRouter() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const verifier = sessionStorage.getItem(K_VERIFIER);
  if (!code || !verifier) return null;
  url.searchParams.delete('code');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  sessionStorage.removeItem(K_VERIFIER);
  const res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  });
  if (!res.ok) throw new Error('Collegamento a OpenRouter non riuscito');
  const { key } = await res.json();
  if (!key) throw new Error('OpenRouter non ha restituito la chiave');
  impostaChiaveOpenRouter(key);
  return key;
}
