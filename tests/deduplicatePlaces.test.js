import { describe, expect, it } from './test-utils.js';
import { deduplicatePlaces } from '../src/utils/deduplicatePlaces.js';

describe('deduplicatePlaces', () => {
  it('remove duplicatas com o mesmo placeId vindas de buscas diferentes', () => {
    const places = [
      {
        placeId: 'ChIJ123',
        name: 'Wizard Idiomas',
        city: 'Salvador',
        searchTerm: 'escola de ingl�s'
      },
      {
        placeId: 'ChIJ123',
        name: 'Wizard Idiomas',
        city: 'Salvador',
        searchTerm: 'curso de ingl�s',
        phone: '(71) 99999-1111'
      }
    ];

    const result = deduplicatePlaces(places);

    expect(result).toHaveLength(1);
    expect(result[0].placeId).toBe('ChIJ123');
    // Verifica mesclagem preservando telefone
    expect(result[0].phone).toBe('(71) 99999-1111');
  });

  it('remove duplicatas com o mesmo telefone normalizado', () => {
    const places = [
      {
        placeId: 'ChIJ_AAA',
        name: 'CNA Idiomas Central',
        city: 'S�o Paulo',
        phone: '(11) 98888-7777',
        normalizedPhone: '5511988887777'
      },
      {
        placeId: 'ChIJ_BBB',
        name: 'CNA Idiomas',
        city: 'S�o Paulo',
        phone: '+55 11 98888-7777',
        normalizedPhone: '5511988887777'
      }
    ];

    const result = deduplicatePlaces(places);
    expect(result).toHaveLength(1);
  });

  it('PRESERVA duas unidades diferentes da mesma franquia com endere�os/bairros diferentes', () => {
    const places = [
      {
        placeId: 'ChIJ_BARRA',
        name: 'Wizard - Barra',
        city: 'Salvador',
        address: 'Av. Oce�nica, 500 - Barra, Salvador - BA',
        phone: '(71) 3264-1111'
      },
      {
        placeId: 'ChIJ_PITUBA',
        name: 'Wizard - Pituba',
        city: 'Salvador',
        address: 'Av. Manoel Dias da Silva, 1200 - Pituba, Salvador - BA',
        phone: '(71) 3358-2222'
      }
    ];

    const result = deduplicatePlaces(places);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(['Wizard - Barra', 'Wizard - Pituba']);
  });

  it('retorna array vazio para entradas vazias ou inv�lidas', () => {
    expect(deduplicatePlaces([])).toEqual([]);
    expect(deduplicatePlaces(null)).toEqual([]);
    expect(deduplicatePlaces(undefined)).toEqual([]);
  });
});
