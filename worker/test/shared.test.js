import { describe, it, expect } from 'vitest';
import { extractJson, validaGiornata, validaDna } from '../../shared/parse.js';
import { promptGiornata, promptDna } from '../../shared/prompts.js';
import { CINQUE, GENRES } from '../../shared/genres.js';
import { eseguiPrompt } from '../src/jobs.js';
import { hashPassword, validaCredenziali } from '../src/auth.js';
import { paginaGiornata } from '../src/pagina.js';

const episodiOk = CINQUE.map((g) => ({ genere: g, titolo: 'T', testo: `testo ${g}` }));

describe('extractJson', () => {
  it('toglie i blocchi di codice e il testo intorno', () => {
    expect(extractJson('Ecco:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('tollera le virgole finali', () => {
    expect(extractJson('{"a":[1,2,],}')).toEqual({ a: [1, 2] });
  });
  it('fallisce senza JSON', () => {
    expect(() => extractJson('niente')).toThrow();
  });
});

describe('validaGiornata', () => {
  it('rimette i generi nell\'ordine del carosello', () => {
    const r = validaGiornata({ episodi: [...episodiOk].reverse() });
    expect(r.episodi.map((e) => e.genere)).toEqual(CINQUE);
  });
  it('segnala i generi mancanti', () => {
    expect(() => validaGiornata({ episodi: episodiOk.slice(1) })).toThrow(/horror/);
  });
  it('accetta maiuscole e taglia i testi troppo lunghi', () => {
    const r = validaGiornata({ episodi: episodiOk.map((e) => ({ ...e, genere: e.genere.toUpperCase(), testo: 'x'.repeat(2000) })) });
    expect(r.episodi[0].testo.length).toBe(600);
  });
});

describe('validaDna', () => {
  it('limita i valori tra 0 e 100 e corregge il genere sconosciuto', () => {
    const r = validaDna({
      titolo: 'X',
      tratti: [{ nome: 'A', valore: 150 }, { nome: 'B', valore: -3 }, { nome: 'C', valore: '40' }],
      genereAffine: 'western',
    });
    expect(r.tratti.map((t) => t.valore)).toEqual([100, 0, 40]);
    expect(r.genereAffine).toBe('memorie');
  });
  it('rifiuta un DNA con meno di 3 tratti', () => {
    expect(() => validaDna({ tratti: [{ nome: 'A', valore: 1 }] })).toThrow();
  });
});

describe('prompt', () => {
  it('la giornata contiene i 5 generi e il racconto tra delimitatori', () => {
    const p = promptGiornata('Ho perso il bus stamattina', null);
    for (const g of CINQUE) expect(p.user).toContain(GENRES[g].label);
    expect(p.user).toContain('"""\nHo perso il bus stamattina\n"""');
  });
  it('il DNA chiede di non trattare dati sensibili', () => {
    expect(promptDna('testo').user).toMatch(/niente giudizi psicologici/);
  });
});

describe('eseguiPrompt', () => {
  const finto = (nome, risposte) => ({
    nome,
    async genera() {
      const r = risposte.shift();
      if (r instanceof Error) throw r;
      return r;
    },
  });
  it('riprova se il JSON non è valido', async () => {
    const f = finto('a', ['non json', JSON.stringify({ episodi: episodiOk })]);
    const r = await eseguiPrompt([f], {}, validaGiornata);
    expect(r.fornitore).toBe('a');
  });
  it('passa al fornitore di riserva', async () => {
    const a = finto('a', [new Error('Gemini 500'), new Error('Gemini 500')]);
    const b = finto('b', [JSON.stringify({ episodi: episodiOk })]);
    expect((await eseguiPrompt([a, b], {}, validaGiornata)).fornitore).toBe('b');
  });
  it('con un errore 4xx non riprova lo stesso fornitore', async () => {
    let chiamate = 0;
    const a = { nome: 'a', async genera() { chiamate++; throw new Error('Gemini 401'); } };
    await expect(eseguiPrompt([a], {}, validaGiornata)).rejects.toThrow();
    expect(chiamate).toBe(1);
  });
});

describe('auth', () => {
  it('lo stesso salt dà lo stesso hash, salt diversi hash diversi', async () => {
    const a = await hashPassword('passwordlunga');
    const b = await hashPassword('passwordlunga', a.salt);
    const c = await hashPassword('passwordlunga');
    expect(b.hash).toBe(a.hash);
    expect(c.hash).not.toBe(a.hash);
  });
  it('valida email e lunghezza password', () => {
    expect(() => validaCredenziali({ email: 'no', password: '12345678' })).toThrow();
    expect(() => validaCredenziali({ email: 'a@b.it', password: 'corta' })).toThrow();
    expect(validaCredenziali({ email: ' A@B.it ', password: '12345678' }).email).toBe('a@b.it');
  });
});

describe('pagina pubblica', () => {
  it('esegue l\'escape dell\'HTML', () => {
    const html = paginaGiornata({
      episodi: episodiOk.map((e) => ({ ...e, testo: '<script>alert(1)</script>' })),
      appUrl: 'https://app.test',
      urlPagina: 'https://api.test/g/abc',
    });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
