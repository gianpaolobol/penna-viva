// Oggi (home), Diario, DNA narrativo, Profilo.

import { useEffect, useState } from 'preact/hooks';
import { GENRES } from '../../../shared/genres.js';
import { chiama, attendiLavoro, chiaveOpenRouter, impostaChiaveOpenRouter, impostaToken } from '../api.js';
import { CampoVoce, Inchiostrino, Icona, Sigillo } from '../componenti.jsx';
import { immagineDna, condividiFile } from '../condividi.js';
import { collegaOpenRouter } from '../openrouter.js';

const DNA_MIN = 200;

export function Oggi({ io, apriGiornata, vai }) {
  const [giornate, setGiornate] = useState(null);
  useEffect(() => { chiama('/api/giornate').then((r) => setGiornate(r.giornate)).catch(() => setGiornate([])); }, []);
  const nome = io?.utente?.nome;
  return (
    <main class="schermo">
      <div class="riga">
        <div class="colonna spazio" style={{ gap: 4 }}>
          <span class="sopratitolo">Penna Viva</span>
          <h1>{nome ? `Ciao ${nome},` : 'Ciao,'}<br /><span class="accento">cosa scriviamo oggi?</span></h1>
        </div>
        <Inchiostrino size={64} />
      </div>

      <button class="carta carta-cliccabile" style={{ background: '#2A1A3E', border: '2px solid #FF7A59' }} onClick={() => apriGiornata(null)}>
        <span class="etichetta" style={{ background: '#FF7A59' }}>Nuovo</span>
        <h2>La tua giornata in 5 generi</h2>
        <p class="attenuato">Racconta un momento di oggi, a voce o per iscritto. Ricevi lo stesso episodio come horror, giallo, fiaba, fantascienza e rosa.</p>
        <span style={{ color: '#FF7A59', fontWeight: 700 }}>Inizia →</span>
      </button>

      <button class="carta carta-cliccabile" onClick={() => vai('dna')}>
        <h3>{io?.dna ? io.dna.titolo : 'Il tuo DNA narrativo'}</h3>
        <p class="attenuato piccolo">
          {io?.dna ? 'Il tuo stile di scrittura, in una card da condividere.'
            : `Racconta qualche giornata nel diario e scopri che scrittore sei (${Math.min(io?.caratteriDiario || 0, DNA_MIN)}/${DNA_MIN} caratteri).`}
        </p>
      </button>

      {giornate?.length > 0 && (
        <section class="colonna">
          <h2>Le tue giornate</h2>
          {giornate.map((g) => (
            <button class="carta carta-cliccabile" key={g.id} onClick={() => apriGiornata(g)}>
              <span class="attenuato piccolo">{new Date(g.creato).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}{g.pubblica ? ' · condivisa' : ''}</span>
              <p style={{ fontFamily: 'var(--titoli)', fontSize: 18 }}>{g.episodi[0]?.titolo}</p>
              <div class="riga" style={{ gap: 6 }} aria-hidden="true">
                {g.episodi.map((ep) => <span key={ep.genere} style={{ width: 14, height: 14, borderRadius: 7, background: GENRES[ep.genere].color }} />)}
              </div>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}

export function Diario({ aggiorna }) {
  const [voci, setVoci] = useState(null);
  const [testo, setTesto] = useState('');
  const [origine, setOrigine] = useState('scritto');
  const [errore, setErrore] = useState('');
  const carica = () => chiama('/api/diario').then((r) => setVoci(r.voci)).catch((e) => setErrore(e.message));
  useEffect(() => { carica(); }, []);

  const salva = async () => {
    setErrore('');
    try {
      await chiama('/api/diario', { metodo: 'POST', corpo: { testo, origine } });
      setTesto('');
      carica();
      aggiorna();
    } catch (e) { setErrore(e.message); }
  };
  const elimina = async (id) => {
    await chiama(`/api/diario/${id}`, { metodo: 'DELETE' });
    carica();
    aggiorna();
  };

  return (
    <main class="schermo">
      <span class="sopratitolo">Diario</span>
      <h1>Il tuo diario <span class="accento">a voce</span></h1>
      <p class="attenuato">Più racconti, più le storie avranno la tua voce. Il diario serve anche a dimostrare che il libro è davvero tuo.</p>
      <CampoVoce valore={testo} onCambia={setTesto} onOrigine={setOrigine} max={5000} etichetta="Nuova pagina di diario" segnaposto="Oggi ho…" />
      {errore && <p class="avviso" role="alert">{errore}</p>}
      <button class="btn btn-primario btn-pieno" disabled={testo.trim().length < 3} onClick={salva}>Salva nel diario</button>
      <section class="colonna">
        {voci?.map((v) => (
          <article class="carta" key={v.id}>
            <div class="riga">
              <span class="attenuato piccolo spazio">
                {new Date(v.creato).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {v.origine === 'voce' ? 'a voce' : 'scritto'}
              </span>
              <button class="btn btn-testo" aria-label="Elimina questa pagina" onClick={() => elimina(v.id)}><Icona.cestino /></button>
            </div>
            <p>{v.testo}</p>
          </article>
        ))}
        {voci?.length === 0 && <p class="attenuato">Ancora nessuna pagina. Inizia da qualcosa di piccolo.</p>}
      </section>
    </main>
  );
}

export function Dna({ io, aggiorna, vai }) {
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState('');
  const dna = io?.dna;
  const caratteri = io?.caratteriDiario || 0;

  const genera = async () => {
    setErrore('');
    setAttesa(true);
    try {
      const { lavoroId } = await chiama('/api/dna', { metodo: 'POST' });
      await attendiLavoro(lavoroId);
      await aggiorna();
    } catch (e) { setErrore(e.message); }
    setAttesa(false);
  };

  if (attesa) return <main class="schermo"><Sigillo testo="Sto leggendo il tuo stile…" /></main>;

  const g = dna ? GENRES[dna.genereAffine] : null;
  return (
    <main class="schermo">
      <span class="sopratitolo">DNA narrativo</span>
      {dna ? (
        <>
          <h1 class="accento">{dna.titolo}</h1>
          <section class="carta" style={{ gap: 16 }}>
            {dna.tratti.map((t) => (
              <div class="colonna" style={{ gap: 6 }} key={t.nome}>
                <div class="riga"><strong class="spazio">{t.nome}</strong><span class="attenuato">{t.valore}</span></div>
                <div class="barra-tratto" role="meter" aria-label={t.nome} aria-valuenow={t.valore} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${t.valore}%`, background: g.color }} />
                </div>
              </div>
            ))}
          </section>
          <p style={{ fontFamily: 'var(--titoli)', fontSize: 20 }}>{dna.voce}</p>
          {dna.temi.length > 0 && <p class="attenuato">Temi: {dna.temi.join(' · ')}</p>}
          <p>Genere affine: <strong style={{ color: g.color }}>{g.label}</strong></p>
          {dna.consiglio && <p class="avviso avviso-info">{dna.consiglio}</p>}
          <button class="btn btn-primario btn-pieno" onClick={async () => condividiFile([await immagineDna(dna)], 'penna-viva-dna', 'Il mio DNA narrativo su Penna Viva')}>
            <Icona.condividi /> Condividi la card
          </button>
          <button class="btn btn-secondario btn-pieno" onClick={genera}>Aggiorna con il diario</button>
        </>
      ) : (
        <>
          <h1>Che scrittore <span class="accento">sei?</span></h1>
          <p class="attenuato">Analizzo come racconti, non chi sei: ritmo, ironia, dettagli, emozione, dialoghi.</p>
          <div class="barra-tratto" role="progressbar" aria-valuenow={Math.min(caratteri, DNA_MIN)} aria-valuemax={DNA_MIN} aria-label="Caratteri nel diario">
            <span style={{ width: `${Math.min(100, (caratteri / DNA_MIN) * 100)}%`, background: 'var(--verde-acqua)' }} />
          </div>
          <p class="piccolo attenuato">{Math.min(caratteri, DNA_MIN)} di {DNA_MIN} caratteri nel diario</p>
          {caratteri >= DNA_MIN
            ? <button class="btn btn-primario btn-pieno" onClick={genera}>Scopri il mio DNA</button>
            : <button class="btn btn-primario btn-pieno" onClick={() => vai('diario')}>Scrivi nel diario</button>}
        </>
      )}
      {errore && <p class="avviso" role="alert">{errore}</p>}
    </main>
  );
}

export function Profilo({ io, esci }) {
  const [chiave, setChiave] = useState(chiaveOpenRouter());
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState('');

  const cancella = async () => {
    try {
      await chiama('/api/account', { metodo: 'DELETE' });
      impostaToken(null);
      impostaChiaveOpenRouter(null);
      esci();
    } catch (e) { setErrore(e.message); }
  };

  return (
    <main class="schermo">
      <span class="sopratitolo">Profilo</span>
      <h1>{io?.utente?.nome || 'Il tuo account'}</h1>
      <p class="attenuato">{io?.utente?.email}</p>

      <section class="carta">
        <h3>Intelligenza artificiale</h3>
        {chiave ? (
          <>
            <p class="attenuato piccolo">Sei collegato a OpenRouter: scrivi senza limiti giornalieri, con i modelli gratuiti o i tuoi crediti. La chiave resta su questo telefono.</p>
            <button class="btn btn-secondario" onClick={() => { impostaChiaveOpenRouter(null); setChiave(null); }}>Scollega OpenRouter</button>
          </>
        ) : (
          <>
            <p class="attenuato piccolo">{io?.gratisRimaste === 1 ? 'Oggi ti resta 1 storia gratuita.' : `Oggi ti restano ${io?.gratisRimaste ?? '…'} storie gratuite.`} Per scrivere di più, collega un account OpenRouter gratuito: un tocco e torni qui.</p>
            <button class="btn btn-primario" onClick={collegaOpenRouter}>Accedi con OpenRouter</button>
          </>
        )}
      </section>

      <section class="carta">
        <h3>I tuoi dati</h3>
        <p class="attenuato piccolo">La voce viene trascritta dal tuo browser: a Penna Viva arriva solo il testo, mai l'audio. Puoi cancellare tutto in qualsiasi momento.</p>
        {!conferma
          ? <button class="btn btn-pericolo" onClick={() => setConferma(true)}>Cancella account e dati</button>
          : (
            <div class="colonna">
              <p class="avviso">Verranno cancellati account, diario, DNA e giornate, anche quelle condivise. Non si può annullare.</p>
              <div class="riga">
                <button class="btn btn-pericolo spazio" onClick={cancella}>Sì, cancella tutto</button>
                <button class="btn btn-secondario spazio" onClick={() => setConferma(false)}>Annulla</button>
              </div>
            </div>
          )}
        {errore && <p class="avviso" role="alert">{errore}</p>}
      </section>

      <button class="btn btn-secondario btn-pieno" onClick={async () => { await chiama('/api/esci', { metodo: 'POST' }).catch(() => {}); impostaToken(null); esci(); }}>Esci</button>
    </main>
  );
}
