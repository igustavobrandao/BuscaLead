import { fileCache } from '../utils/fileCache.js';
import { normalizePhone, isWhatsappCandidate } from '../utils/normalizePhone.js';
import { logger } from '../utils/logger.js';

const DETAILS_ENDPOINT = 'https://places.googleapis.com/v1/places';

/**
 * M�scara estrita para a Fase 2 (Enrichment).
 * Apenas os campos comerciais essenciais (telefone, site, mapa, endere�o completo).
 */
const PLACE_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'businessStatus',
  'primaryType'
].join(',');

/**
 * Obt�m detalhes enriquecidos de um estabelecimento espec�fico.
 *
 * @param {import('./placesClient.js').PlacesClient} client - Cliente HTTP
 * @param {string} placeId - ID do estabelecimento
 * @returns {Promise<object|null>} Detalhes enriquecidos
 */
export async function placeDetails(client, placeId) {
  if (!placeId) return null;

  const cacheKey = `details:${placeId}`;

  // 1. Tenta recuperar do cache local
  const cached = fileCache.get(cacheKey);
  if (cached) {
    client.metrics.cacheHits++;
    logger.cache(`Cache hit para placeDetails: ${placeId}`);
    return cached;
  }

  // 2. Monta requisi��o
  const url = `${DETAILS_ENDPOINT}/${encodeURIComponent(placeId)}?languageCode=pt-BR`;
  const options = {
    method: 'GET',
    headers: {
      'X-Goog-FieldMask': PLACE_DETAILS_FIELD_MASK
    }
  };

  const response = await client.withConcurrency(() =>
    client.fetchWithRetry(url, options, 'details')
  );

  const phone = response.nationalPhoneNumber || response.internationalPhoneNumber || null;
  const normalized = normalizePhone(phone);

  const enrichedData = {
    placeId: response.id || placeId,
    name: response.displayName?.text || null,
    phone,
    phoneInternational: response.internationalPhoneNumber || null,
    normalizedPhone: normalized,
    whatsappCandidate: isWhatsappCandidate(normalized || phone),
    address: response.formattedAddress || null,
    website: response.websiteUri || null,
    googleMapsUrl: response.googleMapsUri || null,
    rating: typeof response.rating === 'number' ? response.rating : null,
    userRatingCount: typeof response.userRatingCount === 'number' ? response.userRatingCount : 0,
    reviewCount: typeof response.userRatingCount === 'number' ? response.userRatingCount : 0,
    businessStatus: response.businessStatus || null,
    primaryType: response.primaryType || null
  };

  fileCache.set(cacheKey, enrichedData);

  return enrichedData;
}
