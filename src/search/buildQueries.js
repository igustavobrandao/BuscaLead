/**
 * Combina termos de busca com cidades e estados brasileiros para compor queries de busca completas.
 *
 * Formato padr�o:
 * `${termo} em ${cidade} ${estado}`
 *
 * Exemplo:
 * "escola de ingl�s em Salvador BA"
 *
 * @param {string[]} terms - Lista de termos sem�nticos gerados
 * @param {Array<{city: string, state: string}>} cities - Lista de cidades alvo
 * @returns {Array<{query: string, term: string, city: string, state: string}>}
 */
export function buildQueries(terms, cities) {
  if (!Array.isArray(terms) || !Array.isArray(cities)) {
    return [];
  }

  const queries = [];
  const seenQueryStrings = new Set();

  for (const cityObj of cities) {
    if (!cityObj || !cityObj.city || !cityObj.state) continue;

    const city = cityObj.city.trim();
    const state = cityObj.state.trim().toUpperCase();

    for (const term of terms) {
      if (!term || typeof term !== 'string') continue;
      const cleanTerm = term.trim();
      if (!cleanTerm) continue;

      const queryString = `${cleanTerm} em ${city} ${state}`;
      const normalizedKey = queryString.toLowerCase();

      if (!seenQueryStrings.has(normalizedKey)) {
        seenQueryStrings.add(normalizedKey);
        queries.push({
          query: queryString,
          term: cleanTerm,
          city,
          state
        });
      }
    }
  }

  return queries;
}
