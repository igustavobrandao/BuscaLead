import 'dotenv/config';
import { SETTINGS } from '../config/settings.js';
import { getCitiesByPreset } from '../config/cities.js';
import { generateSearchTerms } from '../search/generateSearchTerms.js';
import { buildQueries } from '../search/buildQueries.js';
import { PlacesClient } from '../api/placesClient.js';
import { searchPlaces } from '../search/searchPlaces.js';
import { enrichPlaces } from '../enrichment/enrichPlaces.js';
import { deduplicatePlaces } from '../utils/deduplicatePlaces.js';
import { calculateLeadScore } from '../scoring/leadScore.js';
import { qualifyLead } from '../filters/qualifyLead.js';
import { exportToCsv } from '../exporters/csvExporter.js';
import { normalizePhone, isWhatsappCandidate } from '../utils/normalizePhone.js';
import { logger } from '../utils/logger.js';

/**
 * Formata n�meros com separador de milhar brasileiro para o resumo.
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return new Intl.NumberFormat('pt-BR').format(num || 0);
}

/**
 * Imprime o resumo final estilizado no terminal conforme especificado no projeto.
 *
 * @param {object} summaryData
 */
export function printTerminalSummary(summaryData) {
  const {
    category,
    citiesCount,
    termsCount,
    queriesCount,
    rawResultsCount,
    duplicatesRemoved,
    uniqueCount,
    enrichedCount,
    tierCounts,
    withPhoneCount,
    withWebsiteCount,
    withWhatsappCount,
    allLeadsPath,
    qualifiedLeadsPath,
    metrics,
    failedQueries,
    processedQueries,
    pendingQueries
  } = summaryData;

  console.log('\n====================================');
  console.log('School Leads Finder');
  console.log('====================================\n');
  console.log(`Categoria: ${category}\n`);
  console.log(`Cidades pesquisadas: ${formatNumber(citiesCount)}`);
  console.log(`Termos utilizados: ${formatNumber(termsCount)}`);
  console.log(`Consultas planejadas: ${formatNumber(queriesCount)}`);
  console.log(`Consultas processadas: ${formatNumber(processedQueries)}\n`);

  console.log(`Resultados brutos: ${formatNumber(rawResultsCount)}`);
  console.log(`Duplicados removidos: ${formatNumber(duplicatesRemoved)}`);
  console.log(`Empresas únicas: ${formatNumber(uniqueCount)}`);
  console.log(`Empresas enriquecidas: ${formatNumber(enrichedCount)}\n`);

  console.log(`Leads A: ${formatNumber(tierCounts.A)}`);
  console.log(`Leads B: ${formatNumber(tierCounts.B)}`);
  console.log(`Leads C: ${formatNumber(tierCounts.C)}`);
  console.log(`Leads D: ${formatNumber(tierCounts.D)}\n`);

  console.log(`Com telefone: ${formatNumber(withPhoneCount)}`);
  console.log(`Com site: ${formatNumber(withWebsiteCount)}`);
  console.log(`Candidatos a WhatsApp: ${formatNumber(withWhatsappCount)}\n`);

  if (metrics) {
    console.log('Métricas de API e controle de custos:');
    console.log(`- Requisições de busca: ${formatNumber(metrics.searchRequests)}`);
    console.log(`- Requisições de detalhes: ${formatNumber(metrics.detailsRequests)}`);
    console.log(`- Itens recuperados do Cache: ${formatNumber(metrics.cacheHits)}`);
    console.log(`- Requisições evitadas: ${formatNumber(metrics.skippedRequests)}`);
    if (metrics.budgetExceeded) {
      console.log('- Aviso: teto de requisições atingido. Buscas interrompidas preventivamente.');
    }
    console.log('');
  }

  if (failedQueries && failedQueries.length > 0) {
    console.log(`Consultas que falharam (${failedQueries.length}):`);
    failedQueries.slice(0, 5).forEach((q) => console.log(`  - ${q}`));
    if (failedQueries.length > 5) {
      console.log(`  ... e mais ${failedQueries.length - 5} falhas.`);
    }
    console.log('');
  }

  if (pendingQueries && pendingQueries.length > 0) {
    console.log(`Consultas pendentes por limite de orçamento: ${formatNumber(pendingQueries.length)}`);
    console.log('Execute novamente o mesmo comando para continuar usando o cache local.');
    console.log('');
  }

  console.log('Arquivos gerados:\n');
  console.log(allLeadsPath);
  console.log(qualifiedLeadsPath);
  console.log('====================================\n');
}

/**
 * Executa o fluxo de simula��o dry-run sem efetuar chamadas externas ou custos.
 *
 * @param {string} query
 * @param {string[]} terms
 * @param {Array<object>} cities
 * @param {Array<object>} queries
 */
export function handleDryRun(query, terms, cities, queries) {
  console.log('\n====================================');
  console.log('School Leads Finder - MODO DRY-RUN');
  console.log('====================================\n');
  console.log(`Categoria solicitada: "${query}"\n`);

  console.log(`[1] Termos semânticos gerados (${terms.length}):`);
  terms.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log('');

  console.log(`[2] Cidades alvo selecionadas (${cities.length}):`);
  cities.forEach((c) => console.log(`  - ${c.city} (${c.state}) [Prioridade ${c.priority}]`));
  console.log('');

  console.log(`[3] Total de consultas planejadas: ${queries.length} consultas.`);
  console.log('Amostra das 5 primeiras queries:');
  queries.slice(0, 5).forEach((q) => console.log(`  . "${q.query}"`));
  if (queries.length > 5) {
    console.log(`  ... e mais ${queries.length - 5} queries.`);
  }
  console.log('');

  // Estimativa de consumo
  const maxSearchRequests = queries.length;
  const estimatedPlacesFound = queries.length * 15;
  const estimatedEnrichment = Math.round(estimatedPlacesFound * 0.4);
  const maxRequestsTotal = maxSearchRequests + estimatedEnrichment;

  console.log('Estimativa de requisições e custos:');
  console.log(`- Requisições Text Search estimadas: até ${maxSearchRequests}`);
  console.log(`- Estimativa de resultados brutos: ~${estimatedPlacesFound}`);
  console.log(`- Estimativa de enriquecimentos (Fase 2): ~${estimatedEnrichment}`);
  console.log(`- Limite configurado no .env (MAX_REQUESTS_PER_RUN): ${SETTINGS.maxRequestsPerRun}`);
  console.log(`- Projeção de requisições totais: ~${maxRequestsTotal}`);

  if (maxRequestsTotal > SETTINGS.maxRequestsPerRun) {
    console.log(
      `\n[ALERTA DE CUSTO] O volume estimado excede o limite configurado de ${SETTINGS.maxRequestsPerRun} requisições.`
    );
    console.log('A execução parará automaticamente ao atingir o limite para proteção financeira.');
  }

  console.log('\nNenhuma chamada à API foi realizada no modo --dry-run.');
  console.log('Para executar a busca real, execute sem a flag --dry-run.');
  console.log('====================================\n');
}

/**
 * Servi�o orquestrador principal para prospec��o, enriquecimento e qualifica��o de leads.
 *
 * @param {object} options
 * @param {string} options.query - Termo principal (ex: "escolas de ingl�s")
 * @param {string} [options.preset='major-cities'] - Preset de cidades ('test'|'major-cities'|'all')
 * @param {boolean} [options.dryRun=false] - Modo dry-run sem chamadas externas
 * @param {object} [options.customConfig={}] - Sobrescritas de configura��o
 * @returns {Promise<object>} Resumo completo da execu��o
 */
export async function runLeadGeneration(options) {
  const { query, preset = 'major-cities', dryRun = false, customConfig = {} } = options;

  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Informe uma categoria ou termo de busca válido (ex.: "escolas de inglês").');
  }

  const cleanQuery = query.trim();

  // 1. Termos sem�nticos (se preset for 'test', usa apenas 2 varia��es principais)
  const maxTerms = preset === 'test' ? 2 : undefined;
  const terms = generateSearchTerms(cleanQuery, { maxTerms });

  // 2. Cidades alvo
  const cities = getCitiesByPreset(preset);

  // 3. Montagem das queries
  const queries = buildQueries(terms, cities);

  // 4. Verifica��o de Dry Run
  if (dryRun) {
    handleDryRun(cleanQuery, terms, cities, queries);
    return {
      dryRun: true,
      category: cleanQuery,
      terms,
      cities,
      queriesCount: queries.length
    };
  }

  // 5. Inicializa��o do Cliente API
  const client = new PlacesClient(customConfig);

  if (!client.apiKey) {
    logger.warn(
      'GOOGLE_PLACES_API_KEY não configurada no arquivo .env. As requisições à API do Google Places falharão. ' +
        'Configure sua chave no .env ou use --dry-run para simular a execução sem custo.'
    );
  }

  logger.info(`Iniciando busca para "${cleanQuery}" com preset "${preset}" (${cities.length} cidades, ${terms.length} termos, ${queries.length} queries)`);

  // 6. Fase 1: Discovery
  const { places: rawPlaces, failedQueries, processedQueries, pendingQueries } = await searchPlaces(client, queries);

  // 7. Deduplica��o
  const uniquePlaces = deduplicatePlaces(rawPlaces);
  const duplicatesRemoved = rawPlaces.length - uniquePlaces.length;

  logger.info(`Resultados brutos: ${rawPlaces.length} | Removidos duplicados: ${duplicatesRemoved} | Estabelecimentos únicos: ${uniquePlaces.length}`);

  // 8. Fase 2: Enriquecimento
  const { places: enrichedPlaces, enrichedCount, skippedCount } = await enrichPlaces(
    client,
    uniquePlaces,
    customConfig
  );

  // 9. Pontua��o (Lead Score) e Normaliza��o final
  const nowIso = new Date().toISOString();
  const tierCounts = { A: 0, B: 0, C: 0, D: 0 };
  let withPhoneCount = 0;
  let withWebsiteCount = 0;
  let withWhatsappCount = 0;

  const processedLeads = enrichedPlaces.map((place) => {
    // Normaliza telefone se presente
    const phone = place.phone || place.nationalPhoneNumber || null;
    const normalizedPhone = normalizePhone(phone);
    const whatsappCandidate = isWhatsappCandidate(normalizedPhone || phone);

    const leadWithContact = {
      ...place,
      phone,
      normalizedPhone,
      whatsappCandidate
    };

    const { score, tier } = calculateLeadScore(leadWithContact);

    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    if (phone) withPhoneCount++;
    if (leadWithContact.website) withWebsiteCount++;
    if (whatsappCandidate) withWhatsappCount++;

    return {
      ...leadWithContact,
      leadScore: score,
      leadTier: tier,
      collectedAt: nowIso
    };
  });

  // 10. Filtragem de Leads Qualificados
  const qualifiedLeads = processedLeads.filter((lead) => qualifyLead(lead, customConfig));

  // 11. Exporta��o para CSV
  const { allLeadsPath, qualifiedLeadsPath } = exportToCsv(
    processedLeads,
    qualifiedLeads,
    customConfig
  );

  // 12. M�tricas finais
  const metrics = client.getMetrics();
  metrics.skippedRequests += skippedCount;

  const summary = {
    category: cleanQuery,
    citiesCount: cities.length,
    termsCount: terms.length,
    queriesCount: queries.length,
    rawResultsCount: rawPlaces.length,
    duplicatesRemoved,
    uniqueCount: processedLeads.length,
    enrichedCount,
    tierCounts,
    withPhoneCount,
    withWebsiteCount,
    withWhatsappCount,
    qualifiedCount: qualifiedLeads.length,
    allLeadsPath,
    qualifiedLeadsPath,
    metrics,
    failedQueries,
    processedQueries,
    pendingQueries
  };

  // 13. Exibe resumo no terminal
  printTerminalSummary(summary);

  return summary;
}
