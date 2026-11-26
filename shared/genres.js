// Specialisti di genere (fase 1).
// Ogni specialista è una configurazione: regole, struttura tipica, ritmo,
// cose da evitare e un esempio di tono. Non si addestra nessun modello:
// si migliora modificando questo file.
// Colori: concept grafico "Inchiostro notturno" (canvas Penna Viva).

export const GENRES = {
  horror: {
    label: 'Horror',
    color: '#FF4D4D',
    bg: '#1A0A0F',
    regole: [
      'la paura nasce dal dettaglio quotidiano che si incrina',
      'mostra poco, suggerisci molto',
      'chiudi con un\'immagine inquietante, non con una spiegazione',
    ],
    ritmo: 'frasi brevi, tensione crescente',
    evitare: ['splatter gratuito', 'violenza esplicita', 'cliché da film di serie B'],
    esempio: 'Il 27 non arrivò. Al suo posto, solo nebbia.',
  },
  giallo: {
    label: 'Giallo',
    color: '#FFD23F',
    bg: '#1C1808',
    regole: [
      'c\'è un piccolo mistero e un indizio',
      'il narratore osserva come un investigatore',
      'tono asciutto, con un filo di ironia',
    ],
    ritmo: 'deduttivo, a scatti',
    evitare: ['delitti cruenti', 'soluzioni campate in aria'],
    esempio: 'Alle 7:42 il bus era sparito. Nessun testimone, tranne un piccione dall\'aria colpevole.',
  },
  fiaba: {
    label: 'Fiaba',
    color: '#FF9ECD',
    bg: '#22101C',
    regole: [
      'apertura da fiaba ("C\'era una volta" o simile)',
      'oggetti e animali possono parlare o avere desideri',
      'una piccola morale, mai predicatoria',
    ],
    ritmo: 'cantilenante, semplice',
    evitare: ['ironia cinica', 'contenuti spaventosi'],
    esempio: 'C\'era una volta un bus che, stanco di aspettare, decise di partire senza di te.',
  },
  fantascienza: {
    label: 'Fantascienza',
    color: '#5CE1FF',
    bg: '#08181E',
    regole: [
      'una sola idea tecnologica o scientifica, spinta al limite',
      'trattata come se fosse normale',
      'gioca con tempo, spazio o identità',
    ],
    ritmo: 'lucido, un po\' straniante',
    evitare: ['infodump tecnico', 'gergo inventato incomprensibile'],
    esempio: 'Il bus quantistico era partito e non partito. Io, purtroppo, solo non partito.',
  },
  rosa: {
    label: 'Rosa',
    color: '#FF7A9A',
    bg: '#220C14',
    regole: [
      'un incontro o una scintilla inattesa',
      'emozione concreta, legata a un oggetto o a un gesto',
      'finale aperto e luminoso',
    ],
    ritmo: 'morbido, sensoriale',
    evitare: ['contenuti espliciti', 'stereotipi di genere'],
    esempio: 'Persi il bus. Ma sotto la pensilina c\'era lui, con il mio stesso ombrello giallo.',
  },
  fantasy: {
    label: 'Fantasy',
    color: '#B8F55A',
    bg: '#121A08',
    regole: ['un elemento magico entra nella giornata', 'tono epico applicato al quotidiano'],
    ritmo: 'ampio, evocativo',
    evitare: ['nomi impronunciabili', 'mondi spiegati per filo e per segno'],
    esempio: 'La pensilina era un antico portale, e io avevo dimenticato la parola d\'ordine.',
  },
  thriller: {
    label: 'Thriller',
    color: '#FF9F43',
    bg: '#1E1208',
    regole: ['conto alla rovescia o minaccia incombente', 'scelte rapide'],
    ritmo: 'serrato, presente indicativo',
    evitare: ['violenza esplicita'],
    esempio: 'Mancano tre minuti. Il bus è già all\'incrocio. Corro.',
  },
  avventura: {
    label: 'Avventura',
    color: '#2DD4BF',
    bg: '#07191A',
    regole: ['la giornata diventa un viaggio con un ostacolo da superare'],
    ritmo: 'dinamico, pieno di azioni',
    evitare: ['descrizioni statiche lunghe'],
    esempio: 'Zaino in spalla, attraversai la piazza come fosse un deserto.',
  },
  umoristico: {
    label: 'Umoristico',
    color: '#C4B5FD',
    bg: '#16122B',
    regole: ['esagera le piccole sfortune', 'una battuta finale'],
    ritmo: 'veloce, con tempi comici',
    evitare: ['umorismo offensivo o basato su stereotipi'],
    esempio: 'Persi il bus con la grazia di un pinguino sul ghiaccio.',
  },
  memorie: {
    label: 'Memorie',
    color: '#E8C9A0',
    bg: '#1A140E',
    regole: ['prima persona, sguardo retrospettivo', 'dettagli sensoriali veri'],
    ritmo: 'pacato, riflessivo',
    evitare: ['inventare fatti che l\'utente non ha detto'],
    esempio: 'Anni dopo, ricordo ancora l\'odore di pioggia di quella pensilina.',
  },
};

// I cinque generi della "Giornata in 5 generi", nell'ordine del carosello.
export const CINQUE = ['horror', 'giallo', 'fiaba', 'fantascienza', 'rosa'];

export function genreBrief(key) {
  const g = GENRES[key];
  if (!g) throw new Error(`Genere sconosciuto: ${key}`);
  return [
    `GENERE: ${g.label}`,
    `Regole: ${g.regole.join('; ')}.`,
    `Ritmo: ${g.ritmo}.`,
    `Evita: ${g.evitare.join('; ')}.`,
    `Tono di esempio (non copiarlo): "${g.esempio}"`,
  ].join('\n');
}
