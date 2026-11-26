# Penna Viva

**Il tuo libro, scritto con la tua voce.**

App di scrittura creativa con l'intelligenza artificiale, in italiano. Si parte da te: racconti a voce
o per iscritto, e la penna scrive con il tuo stile.

## Prima versione

- **La tua giornata in 5 generi** — racconti un momento di oggi e lo ricevi come horror, giallo,
  fiaba, fantascienza e rosa. Lo condividi come immagini o come pagina con "Racconta la tua giornata".
- **Diario a voce** — le tue pagine, dettate o scritte. Sono la base del tuo stile e la prova
  che il libro è davvero tuo.
- **DNA narrativo** — che scrittore sei: ironia, ritmo, dettaglio, emozione, dialogo. In una card da condividere.

Prossime fasi: romanzi e racconti, copertine e illustrazioni, libri da colorare, libri per bambini
personalizzati, memorie di famiglia, audiolibri, fumetti, stampa.

## Architettura

```
telefono (PWA)  →  intermediario (Cloudflare Worker)  →  fornitori IA (Gemini, OpenRouter)
                         │
                         └── D1 (SQLite): account, diario, DNA, lavori, giornate
```

- `app/` — PWA in Preact + Vite
- `worker/` — intermediario: account, coda dei lavori IA, tetti di spesa, pagine pubbliche `/g/:id`
- `shared/` — specialisti di genere, prompt e validazione delle risposte

## Sviluppo in locale

```bash
cd worker && npm install && npm run db:locale && npm run dev   # http://localhost:8787, IA finta
cd app && npm install && npm run dev                           # http://localhost:5173
cd worker && npm test
```

Pubblicazione online: [`docs/PUBBLICAZIONE.md`](docs/PUBBLICAZIONE.md).
Stato del progetto: [`STATO.md`](STATO.md). Regole per gli agenti IA: [`AGENTS.md`](AGENTS.md).

---
Progetto di Gian Paolo Franceschini.
