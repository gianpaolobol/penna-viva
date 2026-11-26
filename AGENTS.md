# AGENTS.md — Penna Viva

> **Leggi prima `LINEAGUIDA.md`** (in questa cartella). È la linea guida comune a tutti i progetti
> di Gian e prevale su questo file. Poi leggi `STATO.md`.

## [Gian] Protocollo comune

Questo repository segue la linea guida di `gianpaolobol/registro-delle-idee`.
Si aggiunge, non si riscrive: ogni agente scrive in una sezione firmata, con data.
Questa sezione è fissa: non spostarla e non modificarla.

## [Claude] Mappa del progetto — 2026-11-26

| Cartella | Cosa contiene |
| --- | --- |
| `shared/` | Logica condivisa: specialisti di genere, prompt, validazione delle risposte IA |
| `worker/` | Intermediario su Cloudflare Workers + D1: account, coda dei lavori IA, tetti di spesa, pagine pubbliche |
| `app/` | PWA in Preact + Vite: l'app che l'utente installa sul telefono |
| `docs/` | Guide (pubblicazione, decisioni) |

Documenti di progetto (fuori repo):
- Planning: https://claude.ai/artifact/5eQZp1c3fnrBqEzUwGqsGp
- Concept grafico: https://claude.ai/artifact/8Q2dLKDEjfvpRzW3CrLP53

## [Claude] Decisioni da rispettare — 2026-11-26

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

## [Claude] Come si lavora — 2026-11-26

```bash
# intermediario (fornitore IA finto, nessuna chiamata reale)
cd worker && npm install && npm run db:locale && npm run dev
# app
cd app && npm install && npm run dev      # http://localhost:5173
# test
cd worker && npm test
```

## [Claude] Rettifica: Decisioni da rispettare, punto "Voce" — 2026-11-26

La dettatura usa la Web Speech API del browser: su Safari iOS recente lavora sul dispositivo,
su Chrome passa dal servizio di Google. Vale quindi: **a Penna Viva arriva solo il testo, mai l'audio**
(non "trascrizione sempre sul dispositivo"). I testi dell'app sono già scritti così.

## Registro degli interventi

- 2026-11-26 [Claude] Prima versione (sprint 1): struttura della repo, specialisti
  di genere, intermediario Worker + D1 (account, sessioni, coda lavori, tetti di spesa, catena di
  fornitori Gemini → OpenRouter, fornitore finto), PWA con benvenuto 18+, accesso, diario vocale,
  DNA narrativo con card condivisibile, "La tua giornata in 5 generi" con carosello, immagini e
  pagina pubblica, "Accedi con OpenRouter" (PKCE), cancellazione account. 16 test unitari.
- 2026-11-26 [Claude] Allineato alla LINEAGUIDA v1.0: file cartello per Claude, Gemini, Copilot,
  controllo della linea guida in CI, `STATO.md` nel formato comune.
- 2026-11-26 [Claude] Codice caricato sul repository creato da Gian; rettifica sul punto "Voce".
