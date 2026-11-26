# STATO — Penna Viva

_Ultimo aggiornamento: 26/11/2026 · Claude_

**Fase:** 1 (prima versione) · **Sprint:** 1 · **Stato:** codice completo e verificato in locale, non ancora pubblicato online.

## Funziona (verificato in locale con il fornitore IA finto)

- Registrazione con conferma 18+ e consenso, accesso, uscita, freno ai tentativi di accesso
- Diario: pagine scritte o dettate a voce (Web Speech API, it-IT), eliminazione
- **La tua giornata in 5 generi:** racconto → 5 episodi (horror, giallo, fiaba, fantascienza, rosa)
  → carosello → immagini 1080×1350 da condividere → pagina pubblica `/g/:id` con "Racconta la tua giornata"
- **DNA narrativo:** dai testi del diario (min. 200 caratteri) → 5 tratti, voce, temi, genere affine,
  consiglio → card condivisibile
- Quota gratuita (3 al giorno per utente) e tetto globale giornaliero sulla nostra chiave
- "Accedi con OpenRouter" (OAuth PKCE): chiave sul telefono, nessun limite nostro
- Cancellazione completa dell'account e dei dati
- PWA installabile (manifest, icone, service worker)
- Test: 16 test unitari (`worker/`), prova end-to-end nel browser di tutte le schermate

## Da fare per andare online (serve Gian)

1. Creare la repo GitHub `penna-viva` e caricare il codice
2. Account Cloudflare → D1 + Worker + Pages (guida: `docs/PUBBLICAZIONE.md`)
3. Google AI Studio con fatturazione attiva e tetto di spesa basso → segreto `GEMINI_API_KEY`
4. Verificare il nome del modello Gemini più economico disponibile (`GEMINI_MODEL` in `worker/wrangler.toml`)
5. Provare la dettatura su iPhone 13 mini (Safari) e Android

## Prossimi passi (sprint 1 → 2)

- Test con 10–20 persone vere, comprese persone anziane
- Spostare l'esecuzione dei lavori su Cloudflare Queues (oggi `ctx.waitUntil`)
- Recupero password (serve un servizio email)
- Filtri automatici su marchi e personaggi protetti (oggi solo istruzioni nel prompt)
- Pagina privacy e termini (verifica di un professionista prima delle vendite)
- Immagine di anteprima (og:image) per la pagina pubblica
- Tema chiaro "Carta pop" per i momenti di festa e condivisione
- Fase 2: copertine e immagini, libri da colorare, libri per bambini personalizzati, crediti

## Punti aperti

- Nome definitivo (si parte con "Penna Viva")
- In Chrome la Web Speech API usa il servizio di Google per il riconoscimento: l'audio non arriva
  a noi, ma non resta sul telefono. Su Safari iOS recente il riconoscimento avviene sul dispositivo.
  Va detto con chiarezza nella pagina privacy.
