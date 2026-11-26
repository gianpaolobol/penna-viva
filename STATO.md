# STATO — Penna Viva

## Cos'è
App di scrittura creativa con IA: racconti a voce o per iscritto e la penna scrive con il tuo stile.

## Fase
in sviluppo

## Traguardo minimo
Online con 20 persone vere che completano almeno una "giornata in 5 generi" (proposto [Claude], da confermare [Gian]) — raggiunto: no

## Dove è pubblicata
Non ancora pubblicata. Codice completo e verificato in locale con fornitore IA finto.

## Prossimi passi
1. Creare il repository GitHub `penna-viva` — [Gian]; poi push del codice — [Claude]
2. Account Cloudflare, chiave Google AI Studio con tetto di spesa basso — [Gian]; pubblicazione Worker e Pages (`docs/PUBBLICAZIONE.md`) — [Claude]
3. Prova della dettatura su iPhone 13 mini (Safari) e Android — [Gian]
4. Test con 10–20 persone vere, comprese persone anziane — [Gian]
5. Revisione indipendente del codice dell'intermediario — [Codex]

## Blocchi
- Repository non ancora creato su GitHub (da questa sessione la creazione è bloccata) — [Gian]
- Nessuna chiave IA reale configurata — [Gian]

## Componenti condivisi
- Usa: —
- Offre: account e sessioni, coda IA multi-fornitore con tetti di spesa, validazione JSON, dettatura vocale,
  Accedi con OpenRouter, immagini condivisibili, pagina pubblica (vedi `COMPONENTI.md` del registro)

## Linea guida
Versione seguita: 1.0. Deroghe: nessuna. Il backend sta in `worker/` (Cloudflare Worker), come previsto da LINEAGUIDA §4.

## Funziona (verificato in locale)
- Registrazione con conferma 18+ e consenso, accesso, uscita, freno ai tentativi
- Diario scritto o dettato (Web Speech API, it-IT)
- "La tua giornata in 5 generi": carosello, immagini 1080×1350, pagina pubblica `/g/:id`
- DNA narrativo con card condivisibile
- Quota gratuita (3 al giorno) e tetto globale giornaliero; "Accedi con OpenRouter" (PKCE)
- Cancellazione completa dell'account; PWA installabile
- 16 test unitari, prova end-to-end nel browser di tutte le schermate

## Dopo il traguardo minimo
Cloudflare Queues al posto di `ctx.waitUntil`, recupero password, filtri su marchi protetti,
pagina privacy e termini, og:image, tema chiaro "Carta pop", poi fase 2 (copertine, libri da colorare,
libri per bambini, crediti). Nota: in Chrome la dettatura usa il servizio di Google; va scritto nella privacy.

## Registro aggiornamenti
- 2026-11-26 [Claude] Prima versione (fase 1, sprint 1) scritta e verificata in locale.
- 2026-11-26 [Claude] Allineato alla LINEAGUIDA v1.0.
