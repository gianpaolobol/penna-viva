-- Penna Viva — database D1 (SQLite) dell'intermediario.
-- Applicare con: npx wrangler d1 execute penna-viva --file=schema.sql [--local|--remote]

CREATE TABLE IF NOT EXISTS utenti (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  pw_hash TEXT NOT NULL,
  pw_salt TEXT NOT NULL,
  maggiorenne_il TEXT NOT NULL,      -- conferma 18+ (requisito dei termini dei fornitori IA)
  consenso_il TEXT NOT NULL,         -- consenso privacy
  creato TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessioni (
  token_hash TEXT PRIMARY KEY,       -- SHA-256 del token: il token in chiaro non viene salvato
  utente_id TEXT NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  scade TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessioni_utente ON sessioni(utente_id);

-- Diario vocale e scritto: solo testo. L'audio non arriva mai al server.
-- È anche la traccia del contributo umano (legge 132/2025 sul diritto d'autore).
CREATE TABLE IF NOT EXISTS voci_diario (
  id TEXT PRIMARY KEY,
  utente_id TEXT NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  testo TEXT NOT NULL,
  origine TEXT NOT NULL CHECK (origine IN ('voce', 'scritto')),
  creato TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diario_utente ON voci_diario(utente_id, creato);

CREATE TABLE IF NOT EXISTS dna (
  utente_id TEXT PRIMARY KEY REFERENCES utenti(id) ON DELETE CASCADE,
  dati TEXT NOT NULL,                -- JSON validato da shared/parse.js
  aggiornato TEXT NOT NULL
);

-- Coda dei lavori IA: l'app crea un lavoro e ne legge lo stato.
CREATE TABLE IF NOT EXISTS lavori (
  id TEXT PRIMARY KEY,
  utente_id TEXT NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('giornata', 'dna')),
  stato TEXT NOT NULL CHECK (stato IN ('in_coda', 'in_corso', 'pronto', 'errore')),
  accesso TEXT NOT NULL CHECK (accesso IN ('gratuito', 'personale')),
  fornitore TEXT,
  risultato TEXT,
  errore TEXT,
  creato TEXT NOT NULL,
  aggiornato TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lavori_utente ON lavori(utente_id, creato);

CREATE TABLE IF NOT EXISTS giornate (
  id TEXT PRIMARY KEY,               -- slug pubblico della pagina /g/:id
  utente_id TEXT NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  lavoro_id TEXT NOT NULL,
  racconto TEXT NOT NULL,            -- privato: non compare mai nella pagina pubblica
  episodi TEXT,                      -- JSON
  pubblica INTEGER NOT NULL DEFAULT 0,
  creato TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_giornate_utente ON giornate(utente_id, creato);

-- Tetto di spesa: chiamate sulla nostra chiave per giorno (UTC).
CREATE TABLE IF NOT EXISTS uso (
  giorno TEXT PRIMARY KEY,
  chiamate INTEGER NOT NULL DEFAULT 0
);

-- Freno ai tentativi di accesso.
CREATE TABLE IF NOT EXISTS tentativi (
  chiave TEXT PRIMARY KEY,
  conteggio INTEGER NOT NULL,
  finestra TEXT NOT NULL
);
