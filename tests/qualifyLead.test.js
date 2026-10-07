import { describe, expect, it } from './test-utils.js';
import { shouldEnrich, qualifyLead } from '../src/filters/qualifyLead.js';

describe('shouldEnrich (Fase 1 -> Fase 2)', () => {
  it('aprova estabelecimentos com rating >= 4.0 e avalia��es >= 10', () => {
    const place = { rating: 4.5, userRatingCount: 15 };
    expect(shouldEnrich(place)).toBe(true);
  });

  it('reprova estabelecimentos com nota inferior a 4.0', () => {
    const place = { rating: 3.9, userRatingCount: 50 };
    expect(shouldEnrich(place)).toBe(false);
  });

  it('reprova estabelecimentos com menos de 10 avalia��es', () => {
    const place = { rating: 5.0, userRatingCount: 8 };
    expect(shouldEnrich(place)).toBe(false);
  });

  it('retorna false para objetos nulos ou indefinidos', () => {
    expect(shouldEnrich(null)).toBe(false);
    expect(shouldEnrich(undefined)).toBe(false);
    expect(shouldEnrich({})).toBe(false);
  });
});

describe('qualifyLead (Qualified Leads Filter)', () => {
  it('aprova lead que atende aos crit�rios m�nimos de qualifica��o', () => {
    const lead = {
      rating: 4.5,
      reviewCount: 35,
      leadScore: 75
    };
    expect(qualifyLead(lead)).toBe(true);
  });

  it('reprova lead com rating abaixo do m�nimo (4.3)', () => {
    const lead = {
      rating: 4.1,
      reviewCount: 150,
      leadScore: 80
    };
    expect(qualifyLead(lead)).toBe(false);
  });

  it('reprova lead com poucas avalia��es (< 20)', () => {
    const lead = {
      rating: 4.8,
      reviewCount: 12,
      leadScore: 70
    };
    expect(qualifyLead(lead)).toBe(false);
  });

  it('reprova lead com score comercial insuficiente (< 60)', () => {
    const lead = {
      rating: 4.4,
      reviewCount: 25,
      leadScore: 55
    };
    expect(qualifyLead(lead)).toBe(false);
  });

  it('retorna false para valores nulos ou vazios', () => {
    expect(qualifyLead(null)).toBe(false);
    expect(qualifyLead({})).toBe(false);
  });
});
