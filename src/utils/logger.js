/**
 * Utilit�rio de logging objetivo e seguro (nunca exp�e chaves de API).
 */

const PREFIXES = {
  info: '[INFO]',
  search: '[SEARCH]',
  found: '[FOUND]',
  filter: '[FILTER]',
  details: '[DETAILS]',
  cache: '[CACHE]',
  warn: '[WARN]',
  error: '[ERROR]',
  success: '[SUCCESS]'
};

export const logger = {
  search(message) {
    console.log(`${PREFIXES.search} ${message}`);
  },
  found(message) {
    console.log(`${PREFIXES.found} ${message}`);
  },
  filter(message) {
    console.log(`${PREFIXES.filter} ${message}`);
  },
  details(message) {
    console.log(`${PREFIXES.details} ${message}`);
  },
  cache(message) {
    console.log(`${PREFIXES.cache} ${message}`);
  },
  info(message) {
    console.log(`${PREFIXES.info} ${message}`);
  },
  warn(message) {
    console.warn(`${PREFIXES.warn} ${message}`);
  },
  error(message) {
    console.error(`${PREFIXES.error} ${message}`);
  },
  success(message) {
    console.log(`${PREFIXES.success} ${message}`);
  }
};
