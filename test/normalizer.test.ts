import { describe, it, expect } from 'vitest';
import { normalizeUzbekText, tokenizeUzbekText } from '../src/normalizer.js';
import type { UzbekToken } from '../src/types.js';

describe('Orthographic Normalizer: normalizeUzbekText', () => {
  it('handles empty and whitespace input strings gracefully', () => {
    expect(normalizeUzbekText('')).toBe('');
    expect(normalizeUzbekText('   ')).toBe('   ');
  });

  describe('Apostrophe variant normalization for o‘ and g‘', () => {
    it('normalizes modifier letter turned comma (ʻ / U+02BB) idempotently', () => {
      expect(normalizeUzbekText('o\u02BBzbek')).toBe('o\u02BBzbek');
      expect(normalizeUzbekText('g\u02BBalaba')).toBe('g\u02BBalaba');
      expect(normalizeUzbekText('O\u02BBzbekiston')).toBe('O\u02BBzbekiston');
      expect(normalizeUzbekText('G\u02BBalaba')).toBe('G\u02BBalaba');
    });

    it('normalizes left single quotation mark (‘ / U+2018) into turned comma (ʻ / U+02BB)', () => {
      expect(normalizeUzbekText('o\u2018qituvchi')).toBe('o\u02BBqituvchi');
      expect(normalizeUzbekText('g\u2018isht')).toBe('g\u02BBisht');
      expect(normalizeUzbekText('O\u2018zbekiston')).toBe('O\u02BBzbekiston');
      expect(normalizeUzbekText('G\u2018ayrat')).toBe('G\u02BBayrat');
    });

    it('normalizes right single quotation mark (’ / U+2019) into turned comma (ʻ / U+02BB)', () => {
      expect(normalizeUzbekText('o\u2019quvchi')).toBe('o\u02BBquvchi');
      expect(normalizeUzbekText('g\u2019alaba')).toBe('g\u02BBalaba');
      expect(normalizeUzbekText('O\u2019zbekiston')).toBe('O\u02BBzbekiston');
      expect(normalizeUzbekText('G\u2019olib')).toBe('G\u02BBolib');
    });

    it('normalizes ASCII apostrophe (\' / U+0027) into turned comma (ʻ / U+02BB)', () => {
      expect(normalizeUzbekText("o'quvchi")).toBe('o\u02BBquvchi');
      expect(normalizeUzbekText("g'alaba")).toBe('g\u02BBalaba');
      expect(normalizeUzbekText("O'zbekiston")).toBe('O\u02BBzbekiston');
      expect(normalizeUzbekText("G'alaba")).toBe('G\u02BBalaba');
    });

    it('normalizes grave accent / backtick (` / U+0060) into turned comma (ʻ / U+02BB)', () => {
      expect(normalizeUzbekText('o`quvchi')).toBe('o\u02BBquvchi');
      expect(normalizeUzbekText('g`isht')).toBe('g\u02BBisht');
      expect(normalizeUzbekText('O`zbekiston')).toBe('O\u02BBzbekiston');
      expect(normalizeUzbekText('G`alaba')).toBe('G\u02BBalaba');
    });

    it('normalizes modifier letter apostrophe (ʼ / U+02BC) and acute accent (´ / U+00B4)', () => {
      expect(normalizeUzbekText('o\u02BCquvchi')).toBe('o\u02BBquvchi');
      expect(normalizeUzbekText('g\u02BCalaba')).toBe('g\u02BBalaba');
      expect(normalizeUzbekText('o\u00B4quvchi')).toBe('o\u02BBquvchi');
      expect(normalizeUzbekText('g\u00B4alaba')).toBe('g\u02BBalaba');
    });

    it('normalizes uppercase variants while preserving uppercase base letter', () => {
      expect(normalizeUzbekText("O'QUVCHI")).toBe('O\u02BBQUVCHI');
      expect(normalizeUzbekText("G'ALABA")).toBe('G\u02BBALABA');
      expect(normalizeUzbekText('KO\u2018Z')).toBe('KO\u02BBZ');
      expect(normalizeUzbekText('TOG\u2018')).toBe('TOG\u02BB');
    });
  });

  describe('Preserves surrounding letters and tutuq belgisi without breaking', () => {
    it('does not alter apostrophes on non-o/g letters (tutuq belgisi)', () => {
      expect(normalizeUzbekText("ma'no")).toBe("ma'no");
      expect(normalizeUzbekText("san'at")).toBe("san'at");
      expect(normalizeUzbekText("a'lo")).toBe("a'lo");
      expect(normalizeUzbekText("in'om")).toBe("in'om");
      expect(normalizeUzbekText("sur'at")).toBe("sur'at");
      expect(normalizeUzbekText("Is'hoq")).toBe("Is'hoq");
      expect(normalizeUzbekText("As'hob")).toBe("As'hob");
    });

    it('correctly handles words with multiple occurrences and surrounding context', () => {
      expect(normalizeUzbekText("to'g'ri")).toBe('to\u02BBg\u02BBri');
      expect(normalizeUzbekText('bo\u2018yoq')).toBe('bo\u02BByoq');
      expect(normalizeUzbekText('bog\u2018')).toBe('bog\u02BB');
      expect(normalizeUzbekText('qo\u2018zg\u2018olmoq')).toBe('qo\u02BBzg\u02BBolmoq');
    });

    it('does not touch surrounding punctuation or quotation marks around words', () => {
      expect(normalizeUzbekText("'olma'")).toBe("'olma'");
      expect(normalizeUzbekText('"maktab"')).toBe('"maktab"');
      expect(normalizeUzbekText('«kitob»')).toBe('«kitob»');
    });
  });
});

describe('Orthographic Tokenizer: tokenizeUzbekText', () => {
  it('handles empty string gracefully', () => {
    expect(tokenizeUzbekText('')).toEqual([]);
  });

  describe('Conforms to UzbekToken interface', () => {
    it('emits tokens matching the required interface', () => {
      const tokens = tokenizeUzbekText('a');
      expect(tokens).toHaveLength(1);
      const token = tokens[0] as UzbekToken;
      expect(token).toEqual({
        type: 'letter',
        raw: 'a',
        normalized: 'a',
        isUppercase: false,
      });
    });

    it('flags uppercase letters correctly', () => {
      const tokens = tokenizeUzbekText('A');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: 'letter',
        raw: 'A',
        normalized: 'a',
        isUppercase: true,
      });
    });
  });

  describe('Digraph identification: sh, ch, ng (case-insensitive)', () => {
    it('identifies lowercase digraphs', () => {
      const shTokens = tokenizeUzbekText('shahar');
      expect(shTokens[0]).toEqual({
        type: 'digraph',
        raw: 'sh',
        normalized: 'sh',
        isUppercase: false,
      });

      const chTokens = tokenizeUzbekText('choy');
      expect(chTokens[0]).toEqual({
        type: 'digraph',
        raw: 'ch',
        normalized: 'ch',
        isUppercase: false,
      });

      const ngTokens = tokenizeUzbekText('tong');
      expect(ngTokens[2]).toEqual({
        type: 'digraph',
        raw: 'ng',
        normalized: 'ng',
        isUppercase: false,
      });
    });

    it('identifies titlecase digraphs and sets isUppercase to true', () => {
      const shTokens = tokenizeUzbekText('Shahar');
      expect(shTokens[0]).toEqual({
        type: 'digraph',
        raw: 'Sh',
        normalized: 'sh',
        isUppercase: true,
      });

      const chTokens = tokenizeUzbekText('Choy');
      expect(chTokens[0]).toEqual({
        type: 'digraph',
        raw: 'Ch',
        normalized: 'ch',
        isUppercase: true,
      });

      const ngTokens = tokenizeUzbekText('Nga');
      expect(ngTokens[0]).toEqual({
        type: 'digraph',
        raw: 'Ng',
        normalized: 'ng',
        isUppercase: true,
      });
    });

    it('identifies uppercase digraphs and sets isUppercase to true', () => {
      const shTokens = tokenizeUzbekText('SH');
      expect(shTokens[0]).toEqual({
        type: 'digraph',
        raw: 'SH',
        normalized: 'sh',
        isUppercase: true,
      });

      const chTokens = tokenizeUzbekText('CH');
      expect(chTokens[0]).toEqual({
        type: 'digraph',
        raw: 'CH',
        normalized: 'ch',
        isUppercase: true,
      });

      const ngTokens = tokenizeUzbekText('NG');
      expect(ngTokens[0]).toEqual({
        type: 'digraph',
        raw: 'NG',
        normalized: 'ng',
        isUppercase: true,
      });
    });

    it('detects medial and final digraphs within words', () => {
      const quyosh = tokenizeUzbekText('quyosh');
      expect(quyosh[4]).toEqual({
        type: 'digraph',
        raw: 'sh',
        normalized: 'sh',
        isUppercase: false,
      });

      const ruchka = tokenizeUzbekText('ruchka');
      expect(ruchka[2]).toEqual({
        type: 'digraph',
        raw: 'ch',
        normalized: 'ch',
        isUppercase: false,
      });

      const singil = tokenizeUzbekText('singil');
      expect(singil[2]).toEqual({
        type: 'digraph',
        raw: 'ng',
        normalized: 'ng',
        isUppercase: false,
      });
    });
  });

  describe('Disambiguates digraphs vs independent letters when escaped or distinct', () => {
    it('disambiguates digraph when escaped with preceding backslash (\\sh, \\ch, \\ng)', () => {
      const tokensSh = tokenizeUzbekText('\\sh');
      expect(tokensSh).toHaveLength(3);
      expect(tokensSh[0]).toEqual({
        type: 'punctuation',
        raw: '\\',
        normalized: '\\',
        isUppercase: false,
      });
      expect(tokensSh[1]).toEqual({
        type: 'letter',
        raw: 's',
        normalized: 's',
        isUppercase: false,
      });
      expect(tokensSh[2]).toEqual({
        type: 'letter',
        raw: 'h',
        normalized: 'h',
        isUppercase: false,
      });

      const tokensCh = tokenizeUzbekText('\\ch');
      expect(tokensCh).toHaveLength(3);
      expect(tokensCh[1]?.type).toBe('letter');
      expect(tokensCh[2]?.type).toBe('letter');

      const tokensNg = tokenizeUzbekText('\\ng');
      expect(tokensNg).toHaveLength(3);
      expect(tokensNg[1]?.type).toBe('letter');
      expect(tokensNg[2]?.type).toBe('letter');
    });

    it('handles uppercase escaped digraphs (\\Sh, \\CH, \\NG)', () => {
      const tokens = tokenizeUzbekText('\\Sh');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe('punctuation');
      expect(tokens[1]).toEqual({
        type: 'letter',
        raw: 'S',
        normalized: 's',
        isUppercase: true,
      });
      expect(tokens[2]).toEqual({
        type: 'letter',
        raw: 'h',
        normalized: 'h',
        isUppercase: false,
      });
    });

    it('disambiguates letters separated by backslash (s\\h, c\\h, n\\g)', () => {
      const tokens = tokenizeUzbekText('s\\h');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        type: 'letter',
        raw: 's',
        normalized: 's',
        isUppercase: false,
      });
      expect(tokens[1]).toEqual({
        type: 'punctuation',
        raw: '\\',
        normalized: '\\',
        isUppercase: false,
      });
      expect(tokens[2]).toEqual({
        type: 'letter',
        raw: 'h',
        normalized: 'h',
        isUppercase: false,
      });
    });

    it('disambiguates letters separated by tutuq belgisi (apostrophe) in authentic Uzbek words', () => {
      // In Uzbek words like Is'hoq or As'hob, s and h are distinct sounds separated by tutuq belgisi
      const tokens = tokenizeUzbekText("Is'hoq");
      expect(tokens).toHaveLength(6);
      expect(tokens[0]).toEqual({
        type: 'letter',
        raw: 'I',
        normalized: 'i',
        isUppercase: true,
      });
      expect(tokens[1]).toEqual({
        type: 'letter',
        raw: 's',
        normalized: 's',
        isUppercase: false,
      });
      expect(tokens[2]).toEqual({
        type: 'punctuation',
        raw: "'",
        normalized: "'",
        isUppercase: false,
      });
      expect(tokens[3]).toEqual({
        type: 'letter',
        raw: 'h',
        normalized: 'h',
        isUppercase: false,
      });
      expect(tokens[4]).toEqual({
        type: 'letter',
        raw: 'o',
        normalized: 'o',
        isUppercase: false,
      });
      expect(tokens[5]).toEqual({
        type: 'letter',
        raw: 'q',
        normalized: 'q',
        isUppercase: false,
      });
    });

    it('disambiguates letters separated by hyphen (ton-g, s-h)', () => {
      const tokens = tokenizeUzbekText('ton-g');
      expect(tokens).toHaveLength(5);
      expect(tokens[2]).toEqual({
        type: 'letter',
        raw: 'n',
        normalized: 'n',
        isUppercase: false,
      });
      expect(tokens[3]).toEqual({
        type: 'punctuation',
        raw: '-',
        normalized: '-',
        isUppercase: false,
      });
      expect(tokens[4]).toEqual({
        type: 'letter',
        raw: 'g',
        normalized: 'g',
        isUppercase: false,
      });
    });

    it('disambiguates letters separated by Unicode Zero-Width Non-Joiner (U+200C)', () => {
      const tokens = tokenizeUzbekText('s\u200Ch');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe('letter');
      expect(tokens[1]?.type).toBe('unknown');
      expect(tokens[2]?.type).toBe('letter');
    });
  });

  describe('Modified letters: oʻ and gʻ tokenization across apostrophe variants', () => {
    it('tokenizes o‘ and g‘ with U+02BB, U+2018, U+2019, U+0027, U+0060 into single letter tokens', () => {
      const variants = [
        { raw: 'o\u02BB', norm: 'o\u02BB' },
        { raw: 'o\u2018', norm: 'o\u02BB' },
        { raw: 'o\u2019', norm: 'o\u02BB' },
        { raw: "o'", norm: 'o\u02BB' },
        { raw: 'o`', norm: 'o\u02BB' },
        { raw: 'g\u02BB', norm: 'g\u02BB' },
        { raw: 'g\u2018', norm: 'g\u02BB' },
        { raw: 'g\u2019', norm: 'g\u02BB' },
        { raw: "g'", norm: 'g\u02BB' },
        { raw: 'g`', norm: 'g\u02BB' },
      ];

      for (const { raw, norm } of variants) {
        const tokens = tokenizeUzbekText(raw);
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({
          type: 'letter',
          raw,
          normalized: norm,
          isUppercase: false,
        });
      }
    });

    it('preserves uppercase flag for capital Oʻ and Gʻ', () => {
      const variants = [
        { raw: 'O\u02BB', norm: 'o\u02BB' },
        { raw: 'O\u2018', norm: 'o\u02BB' },
        { raw: 'O\u2019', norm: 'o\u02BB' },
        { raw: "O'", norm: 'o\u02BB' },
        { raw: 'O`', norm: 'o\u02BB' },
        { raw: 'G\u02BB', norm: 'g\u02BB' },
        { raw: 'G\u2018', norm: 'g\u02BB' },
        { raw: 'G\u2019', norm: 'g\u02BB' },
        { raw: "G'", norm: 'g\u02BB' },
        { raw: 'G`', norm: 'g\u02BB' },
      ];

      for (const { raw, norm } of variants) {
        const tokens = tokenizeUzbekText(raw);
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({
          type: 'letter',
          raw,
          normalized: norm,
          isUppercase: true,
        });
      }
    });
  });

  describe('Verbatim whitespace and line break preservation', () => {
    it('preserves spaces, tabs, and newlines exactly', () => {
      const inputs = [
        ' ',
        '   ',
        '\t',
        '\n',
        '\r\n',
        'Salom dunyo',
        'Birinchi qator\nIkkinchi qator',
        '   Old va orqa bo‘shliqlar   \n\t',
      ];

      for (const input of inputs) {
        const tokens = tokenizeUzbekText(input);
        const reconstructed = tokens.map((t) => t.raw).join('');
        expect(reconstructed).toBe(input);
      }
    });

    it('classifies whitespace characters with type whitespace', () => {
      const tokens = tokenizeUzbekText(' \t\n');
      expect(tokens).toHaveLength(3);
      for (const token of tokens) {
        expect(token.type).toBe('whitespace');
        expect(token.isUppercase).toBe(false);
      }
    });
  });

  describe('Numbers and punctuation tokenization', () => {
    it('classifies digits 0-9 with type number', () => {
      const tokens = tokenizeUzbekText('1991');
      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toEqual({
        type: 'number',
        raw: '1',
        normalized: '1',
        isUppercase: false,
      });
      expect(tokens[1]).toEqual({
        type: 'number',
        raw: '9',
        normalized: '9',
        isUppercase: false,
      });
    });

    it('classifies standard punctuation characters with type punctuation', () => {
      const tokens = tokenizeUzbekText('.,!?:;-');
      expect(tokens).toHaveLength(7);
      for (const token of tokens) {
        expect(token.type).toBe('punctuation');
      }
    });
  });

  describe('Tokenization of 25 official Uzbek vocabulary reference words', () => {
    const VOCABULARY = [
      'kitob',
      'maktab',
      'o\u2018qituvchi',
      'o\u2018quvchi',
      'g\u2018alaba',
      'g\u2018isht',
      'shahar',
      'quyosh',
      'choy',
      'ruchka',
      'yomg\u2018ir',
      'tong',
      'singil',
      'ko\u2018z',
      'qo\u2018l',
      'yulduz',
      'vatan',
      'inson',
      'ilm',
      'dunyo',
      'bahor',
      'daryo',
      'tog\u2018',
      'qalam',
      'O\u2018zbekiston',
    ];

    it('tokenizes each reference word and reconstructs raw string verbatim', () => {
      for (const word of VOCABULARY) {
        const tokens = tokenizeUzbekText(word);
        expect(tokens.length).toBeGreaterThan(0);
        const reconstructed = tokens.map((t) => t.raw).join('');
        expect(reconstructed).toBe(word);
      }
    });

    it('correctly extracts specialized tokens for representative words', () => {
      // 1. o‘qituvchi -> o‘ (letter), q (letter), i (letter), t (letter), u (letter), v (letter), ch (digraph), i (letter)
      const oqituvchi = tokenizeUzbekText('o\u2018qituvchi');
      expect(oqituvchi[0]).toEqual({
        type: 'letter',
        raw: 'o\u2018',
        normalized: 'o\u02BB',
        isUppercase: false,
      });
      expect(oqituvchi[6]).toEqual({
        type: 'digraph',
        raw: 'ch',
        normalized: 'ch',
        isUppercase: false,
      });

      // 2. g‘isht -> g‘ (letter), i (letter), sh (digraph), t (letter)
      const gisht = tokenizeUzbekText('g\u2018isht');
      expect(gisht).toHaveLength(4);
      expect(gisht[0]?.type).toBe('letter');
      expect(gisht[0]?.normalized).toBe('g\u02BB');
      expect(gisht[2]?.type).toBe('digraph');
      expect(gisht[2]?.normalized).toBe('sh');

      // 3. O‘zbekiston -> O‘ (letter, isUppercase: true), z, b, e, k, i, s, t, o, n
      const ozbekiston = tokenizeUzbekText('O\u2018zbekiston');
      expect(ozbekiston[0]).toEqual({
        type: 'letter',
        raw: 'O\u2018',
        normalized: 'o\u02BB',
        isUppercase: true,
      });
      expect(ozbekiston).toHaveLength(10);
    });
  });
});
