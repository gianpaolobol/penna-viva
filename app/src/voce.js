// Dettatura vocale con la Web Speech API del browser.
// L'audio non arriva mai ai server di Penna Viva: al server va solo il testo.
// Nota: alcuni browser (es. Chrome) usano il servizio di riconoscimento del
// proprio produttore; Safari su iOS recenti lavora sul dispositivo.
// Se l'API manca, resta sempre la dettatura della tastiera del telefono.

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export const dettaturaDisponibile = () => !!SR;

export function avviaDettatura({ onTesto, onFine, onErrore }) {
  if (!SR) { onErrore?.('Dettatura non disponibile su questo browser: usa il microfono della tastiera.'); return () => {}; }
  const r = new SR();
  r.lang = 'it-IT';
  r.continuous = true;
  r.interimResults = true;
  let definitivo = '';
  r.onresult = (ev) => {
    let provvisorio = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) definitivo += (definitivo ? ' ' : '') + t.trim();
      else provvisorio += t;
    }
    onTesto?.(definitivo, provvisorio.trim());
  };
  r.onerror = (ev) => {
    const msg = ev.error === 'not-allowed'
      ? 'Serve il permesso del microfono. Puoi anche scrivere o usare la dettatura della tastiera.'
      : ev.error === 'no-speech' ? 'Non ho sentito nulla. Riprova avvicinando il telefono.' : 'La dettatura si è interrotta.';
    onErrore?.(msg);
  };
  r.onend = () => onFine?.(definitivo);
  r.start();
  return () => r.stop();
}
