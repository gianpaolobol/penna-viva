import { useState } from 'preact/hooks';
import { chiama, impostaToken } from '../api.js';
import { Inchiostrino } from '../componenti.jsx';

export function Benvenuto({ vai }) {
  return (
    <main class="schermo senza-barra" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ alignSelf: 'center' }}><Inchiostrino size={110} /></div>
      <span class="sopratitolo">Penna Viva</span>
      <h1>Il tuo libro,<br /><span class="accento">scritto con la tua voce</span></h1>
      <p class="attenuato">Raccontami com'è andata oggi. Te la restituisco in cinque generi: horror, giallo, fiaba, fantascienza e rosa.</p>
      <div class="colonna" style={{ marginTop: 12 }}>
        <button class="btn btn-primario btn-pieno" onClick={() => vai('registrati')}>Inizia, è gratis</button>
        <button class="btn btn-secondario btn-pieno" onClick={() => vai('accedi')}>Ho già un account</button>
      </div>
    </main>
  );
}

export function Accesso({ modo, vai, entrato }) {
  const registrazione = modo === 'registrati';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [maggiorenne, setMaggiorenne] = useState(false);
  const [consenso, setConsenso] = useState(false);
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    setErrore('');
    setInvio(true);
    try {
      const corpo = registrazione ? { email, password, nome, maggiorenne, consenso } : { email, password };
      const r = await chiama(registrazione ? '/api/registrati' : '/api/accedi', { metodo: 'POST', corpo });
      impostaToken(r.token);
      entrato();
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInvio(false);
    }
  };

  return (
    <main class="schermo senza-barra">
      <button class="btn btn-testo" style={{ alignSelf: 'flex-start' }} onClick={() => vai('benvenuto')}>← Indietro</button>
      <h1>{registrazione ? 'Crea il tuo account' : 'Bentornato'}</h1>
      <form class="colonna" onSubmit={invia} style={{ gap: 16 }}>
        {registrazione && (
          <label class="campo">Come ti chiami? <span class="attenuato piccolo">(facoltativo)</span>
            <input class="input" value={nome} onInput={(e) => setNome(e.currentTarget.value)} autocomplete="given-name" maxLength={60} />
          </label>
        )}
        <label class="campo">Email
          <input class="input" type="email" required value={email} onInput={(e) => setEmail(e.currentTarget.value)} autocomplete="email" />
        </label>
        <label class="campo">Password
          <input class="input" type="password" required minLength={8} value={password} onInput={(e) => setPassword(e.currentTarget.value)}
            autocomplete={registrazione ? 'new-password' : 'current-password'} />
          {registrazione && <span class="attenuato piccolo">Almeno 8 caratteri.</span>}
        </label>
        {registrazione && (
          <>
            <label class="spunta">
              <input type="checkbox" checked={maggiorenne} onChange={(e) => setMaggiorenne(e.currentTarget.checked)} required />
              <span>Confermo di avere almeno 18 anni. I libri per bambini li crea un adulto.</span>
            </label>
            <label class="spunta">
              <input type="checkbox" checked={consenso} onChange={(e) => setConsenso(e.currentTarget.checked)} required />
              <span>Acconsento al trattamento dei miei testi per creare le storie. A Penna Viva arriva solo il testo, mai l'audio; posso cancellare tutto quando voglio.</span>
            </label>
          </>
        )}
        {errore && <p class="avviso" role="alert">{errore}</p>}
        <button class="btn btn-primario btn-pieno" type="submit" disabled={invio}>
          {invio ? 'Un attimo…' : registrazione ? 'Crea account' : 'Entra'}
        </button>
      </form>
      <button class="btn btn-testo" onClick={() => vai(registrazione ? 'accedi' : 'registrati')}>
        {registrazione ? 'Hai già un account? Entra' : 'Non hai un account? Registrati'}
      </button>
    </main>
  );
}
