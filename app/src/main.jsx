import { render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import './stile.css';
import { chiama, token } from './api.js';
import { completaOpenRouter } from './openrouter.js';
import { Icona } from './componenti.jsx';
import { Benvenuto, Accesso } from './schermate/ingresso.jsx';
import { Giornata } from './schermate/giornata.jsx';
import { Oggi, Diario, Dna, Profilo } from './schermate/principali.jsx';

const SCHEDE = [
  { id: 'oggi', label: 'Oggi', icona: Icona.oggi },
  { id: 'diario', label: 'Diario', icona: Icona.diario },
  { id: 'dna', label: 'DNA', icona: Icona.dna },
  { id: 'profilo', label: 'Profilo', icona: Icona.profilo },
];

function App() {
  const [vista, setVista] = useState(token() ? 'oggi' : 'benvenuto');
  const [io, setIo] = useState(null);
  const [giornataAperta, setGiornataAperta] = useState(undefined);
  const [avviso, setAvviso] = useState('');

  const aggiorna = useCallback(async () => {
    if (!token()) return;
    try { setIo(await chiama('/api/io')); } catch (e) { if (e.status === 401) setVista('benvenuto'); }
  }, []);

  useEffect(() => {
    completaOpenRouter()
      .then((k) => k && (setAvviso('OpenRouter collegato: ora puoi scrivere senza limiti giornalieri.'), setVista('profilo')))
      .catch((e) => setAvviso(e.message));
    aggiorna();
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [vista, giornataAperta]);

  const vai = (v) => { setGiornataAperta(undefined); setVista(v); };
  const entrato = () => { aggiorna(); vai('oggi'); };

  if (vista === 'benvenuto') return <Benvenuto vai={vai} />;
  if (vista === 'registrati' || vista === 'accedi') return <Accesso modo={vista} vai={vai} entrato={entrato} />;

  let contenuto;
  if (giornataAperta !== undefined) {
    contenuto = <Giornata io={io} aggiorna={aggiorna} esistente={giornataAperta} indietro={() => setGiornataAperta(undefined)} />;
  } else if (vista === 'diario') contenuto = <Diario aggiorna={aggiorna} />;
  else if (vista === 'dna') contenuto = <Dna io={io} aggiorna={aggiorna} vai={vai} />;
  else if (vista === 'profilo') contenuto = <Profilo io={io} esci={() => { setIo(null); vai('benvenuto'); }} />;
  else contenuto = <Oggi io={io} apriGiornata={setGiornataAperta} vai={vai} />;

  return (
    <>
      {avviso && (
        <div class="avviso avviso-info" role="status" style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 20, maxWidth: 496, margin: '0 auto' }}
          onClick={() => setAvviso('')}>{avviso}</div>
      )}
      {contenuto}
      <nav class="barra" aria-label="Navigazione principale">
        <div class="barra-dentro">
          {SCHEDE.map((s) => (
            <button key={s.id} onClick={() => vai(s.id)} aria-current={vista === s.id && giornataAperta === undefined ? 'page' : undefined}>
              <s.icona />{s.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

render(<App />, document.getElementById('app'));

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
