import { placeDetails } from '../api/placeDetails.js';
import { shouldEnrich } from '../filters/qualifyLead.js';
import { logger } from '../utils/logger.js';

/**
 * Executa a Fase 2 (Enrichment) com rigoroso controle de custos.
 *
 * Apenas estabelecimentos que:
 * 1. Passaram pelos crit�rios m�nimos (ex: rating >= 4.0 e avalia��es >= 10);
 * 2. Ainda n�o possuem telefone E website preenchidos;
 * 3. Possuem um placeId v�lido;
 * receber�o a chamada de Place Details.
 *
 * @param {import('../api/placesClient.js').PlacesClient} client - Cliente HTTP
 * @param {Array<object>} places - Lista desduplicada de estabelecimentos
 * @param {object} [customConfig={}] - Configura��o customizada
 * @returns {Promise<{ places: Array<object>, enrichedCount: number, skippedCount: number }>}
 */
export async function enrichPlaces(client, places, customConfig = {}) {
  let enrichedCount = 0;
  let skippedCount = 0;

  // 1. Filtra quais estabelecimentos s�o eleg�veis para enriquecimento
  const eligiblePlaces = places.filter((p) => shouldEnrich(p, customConfig));
  logger.filter(`${eligiblePlaces.length} estabelecimentos passaram pelo filtro inicial de qualidade`);

  const enrichedPlaceMap = new Map();

  for (const place of places) {
    if (!shouldEnrich(place, customConfig)) {
      skippedCount++;
      continue;
    }

    // Se j� tiver telefone e site, n�o precisa gastar chamada de Details
    const alreadyHasPhone = Boolean(place.phone || place.normalizedPhone);
    const alreadyHasWebsite = Boolean(place.website);

    if (alreadyHasPhone && alreadyHasWebsite) {
      skippedCount++;
      continue;
    }

    if (!place.placeId) {
      skippedCount++;
      continue;
    }

    // Se o mesmo placeId j� foi enriquecido nesta sess�o
    if (enrichedPlaceMap.has(place.placeId)) {
      const cachedEnriched = enrichedPlaceMap.get(place.placeId);
      Object.assign(place, cachedEnriched);
      continue;
    }

    // Interrompe se o or�amento estourou
    if (!client.hasBudget()) {
      logger.warn('Or�amento de requisi��es esgotado durante o enriquecimento. Interrompendo.');
      break;
    }

    try {
      logger.details(`Enriquecendo dados de: "${place.name || place.placeId}" (${place.city || ''})`);
      const details = await placeDetails(client, place.placeId);

      if (details) {
        // Mescla detalhes no objeto original
        if (details.phone) place.phone = details.phone;
        if (details.phoneInternational) place.phoneInternational = details.phoneInternational;
        if (details.normalizedPhone) place.normalizedPhone = details.normalizedPhone;
        if (details.whatsappCandidate !== undefined) place.whatsappCandidate = details.whatsappCandidate;
        if (details.website) place.website = details.website;
        if (details.googleMapsUrl) place.googleMapsUrl = details.googleMapsUrl;
        if (details.address && !place.address) place.address = details.address;
        if (details.rating !== null) place.rating = details.rating;
        if (details.reviewCount) {
          place.reviewCount = details.reviewCount;
          place.userRatingCount = details.reviewCount;
        }

        enrichedPlaceMap.set(place.placeId, details);
        enrichedCount++;
      }
    } catch (err) {
      if (err.message === 'BUDGET_LIMIT_REACHED') {
        break;
      }
      logger.warn(`Falha ao obter detalhes de "${place.placeId}": ${err.message}`);
    }
  }

  return {
    places,
    enrichedCount,
    skippedCount
  };
}
