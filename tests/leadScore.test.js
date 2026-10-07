import { describe, expect, it } from './test-utils.js';
import { calculateLeadScore } from '../src/scoring/leadScore.js';

describe('calculateLeadScore', () => {
  it('concede 100 pontos para perfil m�ximo com opera��o consolidada', () => {
    const perfectLead = {
      rating: 4.9,
      reviewCount: 650,
      website: 'https://exemplo.com.br',
      phone: '(11) 99999-9999',
      businessStatus: 'OPERATIONAL'
    };

    const { score, tier } = calculateLeadScore(perfectLead);

    expect(score).toBe(100);
    expect(tier).toBe('A');
  });

  it('empresa com 4.7 estrelas e 340 avalia��es supera empresa com 5.0 estrelas e 4 avalia��es', () => {
    const establishedSchool = {
      rating: 4.7,
      reviewCount: 340,
      website: 'https://escola-grande.com.br',
      phone: '(71) 3333-1111',
      businessStatus: 'OPERATIONAL'
    };

    const tinyNewSchool = {
      rating: 5.0,
      reviewCount: 4,
      website: 'https://pequena.com.br',
      phone: '(71) 99999-0000',
      businessStatus: 'OPERATIONAL'
    };

    const scoreEstablished = calculateLeadScore(establishedSchool);
    const scoreTiny = calculateLeadScore(tinyNewSchool);

    // 4.7 (27 pts) + 340 (36 pts) + site (10) + fone (10) + oper (10) = 93
    expect(scoreEstablished.score).toBe(93);
    expect(scoreEstablished.tier).toBe('A');

    // 5.0 (30 pts) + 4 reviews (0 pts) + site (10) + fone (10) + oper (10) = 60
    expect(scoreTiny.score).toBe(60);
    expect(scoreTiny.tier).toBe('C');

    expect(scoreEstablished.score).toBeGreaterThan(scoreTiny.score);
  });

  it('classifica corretamente nos tiers A, B, C e D', () => {
    // Lead A (>= 80)
    expect(
      calculateLeadScore({
        rating: 4.8,
        reviewCount: 260,
        website: 'sim',
        phone: 'sim',
        businessStatus: 'OPERATIONAL'
      }).tier
    ).toBe('A'); // 30 + 36 + 10 + 10 + 10 = 96

    // Lead B (65 - 79)
    expect(
      calculateLeadScore({
        rating: 4.4, // 23
        reviewCount: 60, // 24
        website: 'sim', // 10
        phone: 'sim', // 10
        businessStatus: 'CLOSED_TEMPORARILY' // 0
      }).tier
    ).toBe('B'); // 67 pts

    // Lead C (50 - 64)
    expect(
      calculateLeadScore({
        rating: 4.0, // 12
        reviewCount: 25, // 16
        website: 'sim', // 10
        phone: 'sim', // 10
        businessStatus: 'OPERATIONAL' // 10
      }).tier
    ).toBe('C'); // 58 pts

    // Lead D (< 50)
    expect(
      calculateLeadScore({
        rating: 3.5, // 0
        reviewCount: 5, // 0
        website: null,
        phone: null,
        businessStatus: 'OPERATIONAL' // 10
      }).tier
    ).toBe('D'); // 10 pts
  });

  it('trata graciosamente edge cases com valores ausentes ou indefinidos', () => {
    const emptyLead = {};
    const result = calculateLeadScore(emptyLead);

    expect(result.score).toBe(0);
    expect(result.tier).toBe('D');
    expect(result.breakdown.rating).toBe(0);
    expect(result.breakdown.reviews).toBe(0);

    const nullResult = calculateLeadScore(null);
    expect(nullResult.score).toBe(0);
    expect(nullResult.tier).toBe('D');
  });
});
