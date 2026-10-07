import { textSearch } from '../api/textSearch.js';
import { logger } from '../utils/logger.js';

/**
 * Executa as buscas de estabelecimentos (Fase 1 - Discovery) para uma lista de queries geogr�ficas.
 *
 * Tratamento de falhas:
 * Um erro em uma cidade n�o interrompe as demais cidades.
 * Erros s�o acumulados em `failedQueries`.
 *
 * @param {import('../api/placesClient.js').PlacesClient} client - Cliente HTTP
 * @param {Array<{query: string, term: string, city: string, state: string}>} queries - Lista de consultas
 * @returns {Promise<{ places: Array<object>, failedQueries: Array<string>, processedQueries: number, pendingQueries: Array<string> }>}
 */
export async function searchPlaces(client, queries) {
  const allPlaces = [];
  const failedQueries = [];
  let processedQueries = 0;

  for (const [index, queryMeta] of queries.entries()) {
    // Interrompe se o or�amento de requisi��es foi atingido
    if (!client.hasBudget()) {
      logger.warn(`Limite de requisi��es atingido. Interrompendo novas buscas.`);
      return {
        places: allPlaces,
        failedQueries,
        processedQueries,
        pendingQueries: queries.slice(index).map(({ query }) => query)
      };
    }

    try {
      logger.search(queryMeta.query);
      const results = await textSearch(client, queryMeta);
      logger.found(`${results.length} resultados para "${queryMeta.query}"`);
      allPlaces.push(...results);
      processedQueries++;
    } catch (err) {
      if (err.message === 'BUDGET_LIMIT_REACHED') {
        return {
          places: allPlaces,
          failedQueries,
          processedQueries,
          pendingQueries: queries.slice(index).map(({ query }) => query)
        };
      }
      logger.warn(`Falha na consulta "${queryMeta.query}": ${err.message}`);
      failedQueries.push(queryMeta.query);
      processedQueries++;
    }
  }

  return {
    places: allPlaces,
    failedQueries,
    processedQueries,
    pendingQueries: []
  };
}
