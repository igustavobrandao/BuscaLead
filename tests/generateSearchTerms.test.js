import { describe, expect, it } from './test-utils.js';
import { generateSearchTerms } from '../src/search/generateSearchTerms.js';

describe('generateSearchTerms', () => {
  it('gera variações esperadas para escolas de inglês', () => {
    const terms = generateSearchTerms('escolas de inglês');

    [
      'escola de inglês',
      'curso de inglês',
      'escola de idiomas',
      'curso de idiomas',
      'inglês para adultos',
      'inglês profissional',
      'curso de conversação em inglês',
      'centro de idiomas',
      'instituto de idiomas'
    ].forEach((term) => expect(terms).toContain(term));
  });

  it('respeita o limite de termos', () => {
    const terms = generateSearchTerms('escolas de inglês', { maxTerms: 2 });
    expect(terms).toHaveLength(2);
    expect(terms[0]).toBe('escola de inglês');
  });

  it('cobre categorias conhecidas', () => {
    expect(generateSearchTerms('escolas de música')).toContain('curso de música');
    expect(generateSearchTerms('clínicas odontológicas')).toContain('dentista');
    expect(generateSearchTerms('clínicas veterinárias')).toContain('hospital veterinário');
    expect(generateSearchTerms('academias')).toContain('academia de musculação');
  });

  it('gera variações para categorias genéricas', () => {
    const terms = generateSearchTerms('empresas de contabilidade');
    expect(terms.length).toBeGreaterThan(1);
    expect(terms.some((term) => term.includes('contabilidade'))).toBe(true);
  });

  it('retorna vazio para entradas inválidas', () => {
    [null, undefined, '', '   '].forEach((value) => expect(generateSearchTerms(value)).toEqual([]));
  });
});
