import { describe, expect, it } from './test-utils.js';
import { buildQueries } from '../src/search/buildQueries.js';

describe('buildQueries', () => {
  it('combina termos com cidades e estados corretamente', () => {
    const terms = ['escola de ingl�s', 'curso de ingl�s'];
    const cities = [
      { city: 'Salvador', state: 'BA' },
      { city: 'S�o Paulo', state: 'SP' }
    ];

    const queries = buildQueries(terms, cities);

    expect(queries).toHaveLength(4);
    expect(queries[0]).toEqual({
      query: 'escola de ingl�s em Salvador BA',
      term: 'escola de ingl�s',
      city: 'Salvador',
      state: 'BA'
    });
    expect(queries[1]).toEqual({
      query: 'curso de ingl�s em Salvador BA',
      term: 'curso de ingl�s',
      city: 'Salvador',
      state: 'BA'
    });
    expect(queries[2]).toEqual({
      query: 'escola de ingl�s em S�o Paulo SP',
      term: 'escola de ingl�s',
      city: 'S�o Paulo',
      state: 'SP'
    });
  });

  it('evita queries duplicadas', () => {
    const terms = ['escola de ingl�s', 'escola de ingl�s'];
    const cities = [{ city: 'Curitiba', state: 'PR' }];

    const queries = buildQueries(terms, cities);
    expect(queries).toHaveLength(1);
  });

  it('retorna array vazio quando recebe entradas inv�lidas', () => {
    expect(buildQueries(null, [])).toEqual([]);
    expect(buildQueries([], null)).toEqual([]);
    expect(buildQueries(['termo'], [{ city: '', state: '' }])).toEqual([]);
  });
});
