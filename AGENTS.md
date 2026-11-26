# AGENTS.md — Penna Viva

Protocollo comune per gli agenti IA che lavorano su questa repo (Claude, ChatGPT/Codex e altri),
secondo le regole della super piattaforma di Gian (repo `registro-delle-idee`).

## Regole di collaborazione

1. **Leggi prima di scrivere.** All'inizio di ogni sessione leggi questo file e `STATO.md`.
2. **Non riscrivere ciò che ha scritto un altro agente.** Si aggiunge, si commenta, si propone.
   Una modifica a una sezione altrui va motivata nel registro qui sotto.
3. **Firma ogni intervento** nel registro con data, agente e cosa hai fatto.
4. **Aggiorna `STATO.md`** alla fine di ogni sessione: cosa funziona, cosa manca, prossimi passi.
5. **Niente segreti nella repo.** Le chiavi vanno nei segreti di Cloudflare (`wrangler secret put`).
6. **Lingua:** codice, commenti e documenti in italiano.
7. **Revisione incrociata:** chi non ha scritto un pezzo può fare da revisore indipendente
   (come RV-01 in Forgia); le osservazioni vanno in una Issue o nella PR.

## Mappa del progetto

| Cartella | Cosa contiene |
| --- | --- |
| `shared/` | Logica condivisa: specialisti di genere, prompt, validazione delle risposte IA |
| `worker/` | Intermediario su Cloudflare Workers + D1: account, coda dei lavori IA, tetti di spesa, pagine pubbliche |
| `app/` | PWA in Preact + Vite: l'app che l'utente installa sul telefono |
| `docs/` | Guide (pubblicazione, decisioni) |

Documenti di progetto (fuori repo):
- Planning: https://claude.ai/artifact/5eQZp1c3fnrBqEzUwGqsGp
- Concept grafico: https://claude.ai/artifact/8Q2dLKDEjfvpRzW3CrLP53

## Decisioni da rispettare

- **Un motore, tante sezioni:** ogni sezione (narrativa, libri da colorare, fumetti…) è una
  configurazione, non codice nuovo. Gli specialisti di genere stanno in `shared/genres.js`.
- **Il telefono non parla mai direttamente con l'IA:** passa dall'intermediario.
- **Niente chiavi Gemini degli utenti** (termini Gemini: niente uso consumer gratuito nel SEE).
  Accesso all'IA: quota gratuita sulla nostra chiave a pagamento, "Accedi con OpenRouter", poi crediti.
- **App solo per maggiorenni** (termini dei fornitori IA). I libri per bambini li crea un adulto.
- **Voce:** trascrizione sul dispositivo; al server arriva solo testo. Cancellazione con un tocco.
- **Diritto d'autore (L. 132/2025):** il flusso deve far contribuire l'utente (voce, scelte,
  correzioni) e conservarne traccia (`voci_diario`).
- **Niente marchi o personaggi protetti** nei prompt e nelle uscite.
- **Compatibile con il tono di voce:** si dà del tu, frasi brevi, ironia leggera, mai tecnico.

## Come si lavora

```bash
# intermediario (fornitore IA finto, nessuna chiamata reale)
cd worker && npm install && npm run db:locale && npm run dev
# app
cd app && npm install && npm run dev      # http://localhost:5173
# test
cd worker && npm test
```

## Registro degli interventi

- **2026-11-26 · Claude (Opus)** — Prima versione (sprint 1): struttura della repo, specialisti
  di genere, intermediario Worker + D1 (account, sessioni, coda lavori, tetti di spesa, catena di
  fornitori Gemini → OpenRouter, fornitore finto), PWA con benvenuto 18+, accesso, diario vocale,
  DNA narrativo con card condivisibile, "La tua giornata in 5 generi" con carosello, immagini e
  pagina pubblica, "Accedi con OpenRouter" (PKCE), cancellazione account. 16 test unitari.
