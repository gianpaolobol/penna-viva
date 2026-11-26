// Componenti condivisi: mascotte, icone, microfono, carosello.

import { useEffect, useRef, useState } from 'preact/hooks';
import { GENRES } from '../../shared/genres.js';
import { avviaDettatura, dettaturaDisponibile } from './voce.js';

// Inchiostrino: la goccia d'inchiostro che fa da guida (mascotte originale).
export function Inchiostrino({ size = 96, umore = 'felice' }) {
  const bocca = umore === 'pensa'
    ? <path d="M42 70 h16" stroke="#F4EFE6" stroke-width="3" stroke-linecap="round" />
    : <path d="M40 68 q10 9 20 0" stroke="#F4EFE6" stroke-width="3" fill="none" stroke-linecap="round" />;
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" role="img" aria-label="Inchiostrino, la goccia d'inchiostro di Penna Viva">
      <path d="M50 4 C50 4 12 52 12 78 a38 38 0 0 0 76 0 C88 52 50 4 50 4z" fill="#3B2F8F" />
      <path d="M50 4 C50 4 12 52 12 78 a38 38 0 0 0 76 0 C88 52 50 4 50 4z" fill="none" stroke="#C4B5FD" stroke-width="2.5" />
      <ellipse cx="34" cy="62" rx="6" ry="10" fill="#C4B5FD" opacity=".35" />
      <circle cx="40" cy="58" r="5" fill="#F4EFE6" />
      <circle cx="60" cy="58" r="5" fill="#F4EFE6" />
      <circle cx="41" cy="59" r="2.4" fill="#0E0B1F" />
      <circle cx="61" cy="59" r="2.4" fill="#0E0B1F" />
      {bocca}
      <circle cx="30" cy="70" r="4" fill="#FF7A59" opacity=".55" />
      <circle cx="70" cy="70" r="4" fill="#FF7A59" opacity=".55" />
    </svg>
  );
}

const tratto = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
export const Icona = {
  mic: (p) => <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>,
  stop: (p) => <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>,
  condividi: (p) => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>,
  link: (p) => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  oggi: (p) => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  diario: (p) => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /><path d="M8 9h8M8 13h6" /></svg>,
  dna: (p) => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M7 3c0 6 10 6 10 12s-10 6-10 6" /><path d="M17 3c0 6-10 6-10 12" /><path d="M8 7h8M8 17h8" /></svg>,
  profilo: (p) => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  cestino: (p) => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>,
  indietro: (p) => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...tratto} {...p}><path d="M15 18l-6-6 6-6" /></svg>,
};

// Campo di testo con microfono: dettatura che si aggiunge al testo già scritto.
export function CampoVoce({ valore, onCambia, segnaposto, etichetta, max = 1500, onOrigine }) {
  const [ascolta, setAscolta] = useState(false);
  const [provvisorio, setProvvisorio] = useState('');
  const [errore, setErrore] = useState('');
  const stop = useRef(null);
  const base = useRef('');

  useEffect(() => () => stop.current?.(), []);

  const attiva = () => {
    if (ascolta) { stop.current?.(); return; }
    setErrore('');
    base.current = valore ? `${valore.trim()} ` : '';
    setAscolta(true);
    onOrigine?.('voce');
    stop.current = avviaDettatura({
      onTesto: (def, prov) => { onCambia((base.current + def).slice(0, max)); setProvvisorio(prov); },
      onFine: () => { setAscolta(false); setProvvisorio(''); },
      onErrore: (m) => { setErrore(m); setAscolta(false); },
    });
  };

  return (
    <div class="colonna">
      <label class="campo">
        <span>{etichetta}</span>
        <textarea
          class="area"
          value={valore}
          maxLength={max}
          placeholder={segnaposto}
          onInput={(e) => { onCambia(e.currentTarget.value); onOrigine?.('scritto'); }}
        />
      </label>
      {provvisorio && <p class="attenuato piccolo" aria-live="polite">… {provvisorio}</p>}
      <div class="riga">
        {dettaturaDisponibile() ? (
          <button type="button" class={`mic${ascolta ? ' attivo' : ''}`} onClick={attiva} aria-pressed={ascolta}
            aria-label={ascolta ? 'Ferma la dettatura' : 'Racconta a voce'}>
            {ascolta ? <Icona.stop /> : <Icona.mic />}
          </button>
        ) : null}
        <p class="attenuato piccolo">
          {ascolta ? 'Ti ascolto… tocca di nuovo quando hai finito.'
            : dettaturaDisponibile() ? 'Tocca il microfono e racconta. A noi arriva solo il testo.'
            : 'Puoi usare il microfono della tastiera per dettare.'}
          <br /><span>{valore.length}/{max}</span>
        </p>
      </div>
      {errore && <p class="avviso" role="alert">{errore}</p>}
    </div>
  );
}

export function Carosello({ episodi }) {
  const [attivo, setAttivo] = useState(0);
  const rif = useRef(null);
  const onScroll = () => {
    const el = rif.current;
    if (!el) return;
    const larghezza = el.firstElementChild?.getBoundingClientRect().width || 1;
    setAttivo(Math.max(0, Math.min(episodi.length - 1, Math.round(el.scrollLeft / (larghezza + 14)))));
  };
  const colore = GENRES[episodi[attivo]?.genere]?.color;
  return (
    <div class="colonna">
      <div class="carosello" ref={rif} onScroll={onScroll} role="list" aria-label="La tua giornata in 5 generi">
        {episodi.map((ep, i) => {
          const g = GENRES[ep.genere];
          return (
            <article role="listitem" class={`episodio ${ep.genere}`} style={{ '--c': g.color, '--bg': g.bg }} key={ep.genere}>
              <span class="etichetta" style={{ background: g.color }}>{g.label}</span>
              <h3>{ep.titolo}</h3>
              <p>{ep.testo}</p>
              <span class="piede">Penna Viva · {i + 1} di {episodi.length}</span>
            </article>
          );
        })}
      </div>
      <div class="puntini" aria-hidden="true" style={{ '--c': colore }}>
        {episodi.map((_, i) => <span class={i === attivo ? 'attivo' : ''} key={i} />)}
      </div>
    </div>
  );
}

export function Sigillo({ testo }) {
  return (
    <div class="sigillo" role="status" aria-live="polite">
      <svg width="120" height="140" viewBox="0 0 120 140" aria-hidden="true">
        <rect x="14" y="10" width="92" height="120" rx="10" fill="#241F45" stroke="#4A4373" stroke-width="3" />
        <rect x="24" y="10" width="6" height="120" fill="#3B2F8F" />
        <circle cx="60" cy="72" r="22" fill="#FF7A59" />
        <path d="M60 58 C60 58 50 70 50 76 a10 10 0 0 0 20 0 C70 70 60 58 60 58z" fill="#1B1530" />
      </svg>
      <h2>{testo}</h2>
      <p class="attenuato">Il libro è sigillato finché la penna non ha finito.</p>
    </div>
  );
}
