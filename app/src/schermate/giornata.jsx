// "La tua giornata in 5 generi": il primo esperimento virale.

import { useState } from 'preact/hooks';
import { chiama, attendiLavoro, chiaveOpenRouter } from '../api.js';
import { CampoVoce, Carosello, Sigillo, Icona } from '../componenti.jsx';
import { immagineEpisodio, condividiFile, condividiLink } from '../condividi.js';

const MIN = 15;

export function Giornata({ io, aggiorna, esistente, indietro }) {
  const [racconto, setRacconto] = useState('');
  const [origine, setOrigine] = useState('scritto');
  const [fase, setFase] = useState(esistente ? 'pronta' : 'racconta');
  const [giornata, setGiornata] = useState(esistente || null);
  const [errore, setErrore] = useState('');
  const [nota, setNota] = useState('');

  const scrivi = async () => {
    setErrore('');
    setFase('attesa');
    try {
      const { lavoroId, giornataId } = await chiama('/api/giornate', { metodo: 'POST', corpo: { racconto, origine } });
      const ris = await attendiLavoro(lavoroId);
      setGiornata({ id: giornataId, episodi: ris.episodi, pubblica: false });
      setFase('pronta');
      aggiorna();
    } catch (e) {
      setErrore(e.message);
      setFase('racconta');
    }
  };

  const condividiImmagini = async () => {
    setNota('Preparo le immagini…');
    const blobs = await Promise.all(giornata.episodi.map((ep, i) => immagineEpisodio(ep, i, giornata.episodi.length)));
    const r = await condividiFile(blobs, 'penna-viva-giornata', 'La mia giornata in 5 generi, scritta con Penna Viva');
    setNota(r === 'scaricato' ? 'Immagini salvate sul dispositivo.' : '');
  };

  const condividiPagina = async () => {
    setNota('');
    try {
      const r = await chiama(`/api/giornate/${giornata.id}`, { metodo: 'PATCH', corpo: { pubblica: true } });
      setGiornata({ ...giornata, pubblica: true, url: r.url });
      const esito = await condividiLink(r.url, 'Guarda la mia giornata in 5 generi');
      if (esito === 'copiato') setNota('Link copiato. Incollalo dove vuoi.');
    } catch (e) {
      setErrore(e.message);
    }
  };

  const nascondi = async () => {
    await chiama(`/api/giornate/${giornata.id}`, { metodo: 'PATCH', corpo: { pubblica: false } });
    setGiornata({ ...giornata, pubblica: false });
    setNota('La pagina non è più visibile.');
  };

  if (fase === 'attesa') {
    return <main class="schermo"><Sigillo testo="La penna sta scrivendo…" /></main>;
  }

  if (fase === 'pronta' && giornata) {
    return (
      <main class="schermo">
        <button class="btn btn-testo" style={{ alignSelf: 'flex-start' }} onClick={indietro}><Icona.indietro /> Indietro</button>
        <div class="colonna" style={{ gap: 6 }}>
          <span class="sopratitolo">Pronta</span>
          <h1>La tua giornata<br /><span class="accento">in 5 generi</span></h1>
          <p class="attenuato piccolo">Scorri le carte →</p>
        </div>
        <Carosello episodi={giornata.episodi} />
        <div class="colonna">
          <button class="btn btn-primario btn-pieno" onClick={condividiImmagini}><Icona.condividi /> Condividi le immagini</button>
          <button class="btn btn-secondario btn-pieno" onClick={condividiPagina}><Icona.link /> {giornata.pubblica ? 'Condividi di nuovo il link' : 'Crea un link da condividere'}</button>
          {giornata.pubblica && <button class="btn btn-testo" onClick={nascondi}>Rendi privata la pagina</button>}
          {nota && <p class="avviso avviso-info" role="status">{nota}</p>}
          {errore && <p class="avviso" role="alert">{errore}</p>}
          <button class="btn btn-testo" onClick={() => { setRacconto(''); setGiornata(null); setFase('racconta'); }}>Racconta un altro momento</button>
        </div>
      </main>
    );
  }

  return (
    <main class="schermo">
      <button class="btn btn-testo" style={{ alignSelf: 'flex-start' }} onClick={indietro}><Icona.indietro /> Indietro</button>
      <div class="colonna" style={{ gap: 6 }}>
        <span class="sopratitolo">Gratis, ogni giorno</span>
        <h1>Raccontami<br /><span class="accento">com'è andata oggi</span></h1>
      </div>
      <CampoVoce
        valore={racconto}
        onCambia={setRacconto}
        onOrigine={setOrigine}
        etichetta="Un momento della tua giornata"
        segnaposto="Stamattina ho perso il bus e sono arrivato tardi al lavoro…"
      />
      {errore && <p class="avviso" role="alert">{errore}</p>}
      <button class="btn btn-primario btn-pieno" disabled={racconto.trim().length < MIN} onClick={scrivi}>
        Scrivila in 5 generi
      </button>
      <p class="attenuato piccolo" style={{ textAlign: 'center' }}>
        {io?.gratisRimaste != null && !chiaveOpenRouter()
          ? `Storie gratuite rimaste oggi: ${io.gratisRimaste}`
          : 'Stai usando il tuo account OpenRouter'}
      </p>
    </main>
  );
}
