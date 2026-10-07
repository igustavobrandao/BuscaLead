import { fileCache } from '../utils/fileCache.js';
import { logger } from '../utils/logger.js';

const TEXT_SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

/**
 * M�scara estrita de campos para a Fase 1 (Discovery).
 * NUNCA usamos '*' em produ��o para manter o custo baixo e a lat�ncia m�nima.
 */
const TEXT_SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.primaryType'
].join(',');

/**
 * Realiza a busca de estabelecimentos via Text Search (New) da Google Places API.
 * Utiliza cache local e controle de concorr�ncia.
 *
 * @param {import('./placesClient.js').PlacesClient} client - Inst�ncia configurada do cliente
 * @param {{ query: string, term?: string, city?: string, state?: string }} queryMeta - Metadados da busca
 * @returns {Promise<Array<object>>} Lista de estabelecimentos normalizados
 */
export async function textSearch(client, queryMeta) {
  const { query, term, city, state } = queryMeta;
  const cacheKey = `search:${query.toLowerCase().trim()}`;

  // 1. Tenta recuperar do cache local
  const cached = fileCache.get(cacheKey);
  if (cached) {
    client.metrics.cacheHits++;
    logger.cache(`Cache hit para busca: "${query}"`);
    return cached;
  }

  // 2. Executa requisi��o com controle de concorr�ncia e retry
  const payload = {
    textQuery: query,
    languageCode: 'pt-BR',
    maxResultCount: 20
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': TEXT_SEARCH_FIELD_MASK
    },
    body: JSON.stringify(payload)
  };

  const response = await client.withConcurrency(() =>
    client.fetchWithRetry(TEXT_SEARCH_ENDPOINT, options, 'search')
  );

  const rawPlaces = response.places || [];

  // 3. Mapeamento padronizado de campos (Discovery)
  const mappedPlaces = rawPlaces.map((p) => {
    const rating = typeof p.rating === 'number' ? p.rating : null;
    const reviewCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : 0;

    return {
      placeId: p.id || null,
      name: p.displayName?.text || null,
      phone: null,
      phoneInternational: null,
      normalizedPhone: null,
      whatsappCandidate: false,
      address: p.formattedAddress || null,
      city: city || null,
      state: state || null,
      website: null,
      googleMapsUrl: null,
      rating,
      userRatingCount: reviewCount,
      reviewCount,
      businessStatus: p.businessStatus || null,
      primaryType: p.primaryType || null,
      searchTerm: term || query
    };
  });

  // Salva no cache
  fileCache.set(cacheKey, mappedPlaces);

  return mappedPlaces;
}
