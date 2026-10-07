const DEFAULT_TIERS = {
  A: 80,
  B: 65,
  C: 50
};

/**
 * Calcula o Lead Score comercial (0 a 100) e a classifica��o em tiers (A, B, C, D)
 * com base na maturidade da opera��o, reputa��o, presen�a digital e canais de contato.
 *
 * Pontua��o:
 * - Avalia��o m�dia (rating): at� 30 pontos
 * - Quantidade de avalia��es (reviewCount): at� 40 pontos
 * - Presen�a de website: +10 pontos
 * - Presen�a de telefone comercial: +10 pontos
 * - Status operacional (OPERATIONAL): +10 pontos
 *
 * Tiers:
 * - A: 80 - 100
 * - B: 65 - 79
 * - C: 50 - 64
 * - D: 0 - 49
 *
 * @param {object} place - Objeto do estabelecimento comercial
 * @param {object} [customTiers=null] - Faixas customizadas de pontua��o
 * @returns {{ score: number, tier: 'A'|'B'|'C'|'D', breakdown: object }}
 */
export function calculateLeadScore(place = {}, customTiers = null) {
  if (!place || typeof place !== 'object') {
    return { score: 0, tier: 'D', breakdown: { rating: 0, reviews: 0, website: 0, phone: 0, operational: 0 } };
  }

  const rating = typeof place.rating === 'number' ? place.rating : 0;
  const reviewCount =
    typeof place.userRatingCount === 'number'
      ? place.userRatingCount
      : typeof place.reviewCount === 'number'
        ? place.reviewCount
        : 0;

  const hasWebsite = Boolean(place.website || place.websiteUri);
  const hasPhone = Boolean(
    place.phone ||
    place.normalizedPhone ||
    place.nationalPhoneNumber ||
    place.internationalPhoneNumber
  );
  const isOperational = place.businessStatus === 'OPERATIONAL';

  // 1. Avalia��o m�dia (At� 30 pontos)
  let ratingPoints = 0;
  if (rating >= 4.8) {
    ratingPoints = 30;
  } else if (rating >= 4.6) {
    ratingPoints = 27;
  } else if (rating >= 4.4) {
    ratingPoints = 23;
  } else if (rating >= 4.2) {
    ratingPoints = 18;
  } else if (rating >= 4.0) {
    ratingPoints = 12;
  }

  // 2. Quantidade de avalia��es (At� 40 pontos)
  let reviewPoints = 0;
  if (reviewCount >= 500) {
    reviewPoints = 40;
  } else if (reviewCount >= 250) {
    reviewPoints = 36;
  } else if (reviewCount >= 100) {
    reviewPoints = 30;
  } else if (reviewCount >= 50) {
    reviewPoints = 24;
  } else if (reviewCount >= 20) {
    reviewPoints = 16;
  } else if (reviewCount >= 10) {
    reviewPoints = 10;
  }

  // 3. Canais e opera��o
  const websitePoints = hasWebsite ? 10 : 0;
  const phonePoints = hasPhone ? 10 : 0;
  const operationalPoints = isOperational ? 10 : 0;

  const rawScore = ratingPoints + reviewPoints + websitePoints + phonePoints + operationalPoints;
  const score = Math.min(100, Math.max(0, rawScore));

  // Determina��o do Tier
  const tiers = customTiers || DEFAULT_TIERS;
  let tier = 'D';

  if (score >= tiers.A) {
    tier = 'A';
  } else if (score >= tiers.B) {
    tier = 'B';
  } else if (score >= tiers.C) {
    tier = 'C';
  } else {
    tier = 'D';
  }

  return {
    score,
    tier,
    breakdown: {
      rating: ratingPoints,
      reviews: reviewPoints,
      website: websitePoints,
      phone: phonePoints,
      operational: operationalPoints
    }
  };
}
