# Pubblicare Penna Viva online

Tutto rientra nei piani gratuiti di Cloudflare. Si paga solo l'IA delle storie gratuite,
con un tetto giornaliero (`TETTO_GIORNALIERO`).

## 1. Intermediario (Cloudflare Worker + D1)

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create penna-viva          # copia il database_id in wrangler.toml
npm run db:remoto                          # crea le tabelle
npx wrangler secret put GEMINI_API_KEY     # chiave di Google AI Studio (fatturazione attiva, tetto basso)
npx wrangler secret put OPENROUTER_API_KEY # facoltativo: riserva automatica
```

In `wrangler.toml` imposta:
- `ALLOWED_ORIGIN` e `APP_URL` = indirizzo dell'app (es. `https://penna-viva.pages.dev`)
- `MOCK_AI = "0"`
- `GEMINI_MODEL`: il modello Gemini più economico disponibile al momento

```bash
npm run deploy     # → https://penna-viva-api.<tuo-account>.workers.dev
```

## 2. App (Cloudflare Pages)

Collega la repo GitHub a Cloudflare Pages con queste impostazioni:

| Voce | Valore |
| --- | --- |
| Directory principale | `app` |
| Comando di build | `npm install && npm run build` |
| Directory di output | `dist` |
| Variabile d'ambiente | `VITE_API_URL` = indirizzo del Worker |

Ogni push su `main` ripubblica l'app da sola.

## 3. Controlli dopo la pubblicazione

- `https://<worker>/api/salute` risponde `{"ok":true}`
- Registrazione, una giornata in 5 generi, pagina pubblica `/g/...`
- Dettatura su iPhone (Safari) e Android (Chrome)
- Installazione sulla schermata Home ("Aggiungi a Home")
- "Accedi con OpenRouter" torna all'app con la chiave collegata

## Dominio

Quando il nome è deciso, si collega un dominio a Pages (app) e un sottodominio `api.` al Worker,
poi si aggiornano `ALLOWED_ORIGIN`, `APP_URL` e `VITE_API_URL`.
