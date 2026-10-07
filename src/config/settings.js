// L� vari�veis de ambiente de forma isom�rfica (Node.js e browser-safe)
const env = typeof process !== 'undefined' && process.env ? process.env : {};

/**
 * Valida nota do Google Places (escala estrita de 0.0 a 5.0).
 */
function parseRating(val, fallback) {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0 && n <= 5 ? n : fallback;
}

/**
 * Valida inteiros positivos dentro de um teto razo�vel.
 */
function parseIntWithin(val, fallback, max = Infinity) {
  const n = parseInt(val, 10);
  return !isNaN(n) && n >= 0 && n <= max ? n : fallback;
}

/**
 * Configura��es centrais do School Leads Finder.
 * Todos os valores possuem defaults defensivos e podem ser sobrescritos por vari�veis de ambiente.
 */
export const SETTINGS = {
  // Chave Google Places API (New)
  apiKey: env.GOOGLE_PLACES_API_KEY || '',

  // Limite m�ximo de requisi��es por execu��o (prote��o contra custos)
  maxRequestsPerRun: parseIntWithin(env.MAX_REQUESTS_PER_RUN, 300),

  // Concorr�ncia de requisi��es simult�neas
  concurrency: parseIntWithin(env.REQUEST_CONCURRENCY, 4, 20),

  // Cache local em disco (.cache/)
  cacheEnabled: env.CACHE_ENABLED !== 'false',
  cacheTtlHours: parseIntWithin(env.CACHE_TTL_HOURS, 24),
  cacheDir: '.cache',

  // Diret�rio de sa�da para CSVs
  outputDir: 'output',

  // Fase 2 - Crit�rios m�nimos para chamada de Place Details (Enriquecimento)
  // Rating do Google Places varia de 0 a 5.0
  minRatingForEnrichment: parseRating(env.MIN_RATING_ENRICHMENT, 4.0),
  minReviewsForEnrichment: parseIntWithin(env.MIN_REVIEWS_ENRICHMENT, 10, 50),

  // Crit�rios para qualifica��o de leads (output/qualified-leads.csv)
  minQualifiedRating: parseRating(env.MIN_QUALIFIED_RATING, 4.3),
  minQualifiedReviews: parseIntWithin(env.MIN_QUALIFIED_REVIEWS, 20, 30),
  minQualifiedScore: parseIntWithin(env.MIN_QUALIFIED_SCORE, 60, 70),

  // Par�metros de resili�ncia e rede
  maxRetries: 3,
  initialRetryDelayMs: 1000,
  requestTimeoutMs: 12000,

  // Faixas do Lead Score
  scoreTiers: {
    A: 80,
    B: 65,
    C: 50
  }
};

