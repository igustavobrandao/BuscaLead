import { SETTINGS } from '../config/settings.js';

/**
 * Avalia se um estabelecimento descoberto na Fase 1 atende aos crit�rios m�nimos
 * para justificar o custo da chamada de Place Details (Fase 2 - Enriquecimento).
 *
 * @param {object} place
 * @param {object} [customConfig={}]
 * @returns {boolean}
 */
export function shouldEnrich(place, customConfig = {}) {
  if (!place || typeof place !== 'object') {
    return false;
  }

  const minRating =
    customConfig.minRatingForEnrichment ?? SETTINGS.minRatingForEnrichment ?? 4.0;
  const minReviews =
    customConfig.minReviewsForEnrichment ?? SETTINGS.minReviewsForEnrichment ?? 10;

  const rating = typeof place.rating === 'number' ? place.rating : 0;
  const reviewCount =
    typeof place.userRatingCount === 'number'
      ? place.userRatingCount
      : typeof place.reviewCount === 'number'
        ? place.reviewCount
        : 0;

  return rating >= minRating && reviewCount >= minReviews;
}

/**
 * Avalia se um lead atende aos crit�rios para ser inclu�do no arquivo priorit�rio (qualified-leads.csv).
 *
 * Crit�rios padr�o:
 * - rating >= 4.3
 * - reviewCount >= 20
 * - leadScore >= 60
 *
 * @param {object} place - Lead com pontua��o j� calculada (deve possuir leadScore ou score)
 * @param {object} [customConfig={}]
 * @returns {boolean}
 */
export function qualifyLead(place, customConfig = {}) {
  if (!place || typeof place !== 'object') {
    return false;
  }

  const minRating =
    customConfig.minQualifiedRating ?? SETTINGS.minQualifiedRating ?? 4.3;
  const minReviews =
    customConfig.minQualifiedReviews ?? SETTINGS.minQualifiedReviews ?? 20;
  const minScore =
    customConfig.minQualifiedScore ?? SETTINGS.minQualifiedScore ?? 60;

  const rating = typeof place.rating === 'number' ? place.rating : 0;
  const reviewCount =
    typeof place.reviewCount === 'number'
      ? place.reviewCount
      : typeof place.userRatingCount === 'number'
        ? place.userRatingCount
        : 0;

  const score =
    typeof place.leadScore === 'number'
      ? place.leadScore
      : typeof place.score === 'number'
        ? place.score
        : 0;

  return rating >= minRating && reviewCount >= minReviews && score >= minScore;
}
