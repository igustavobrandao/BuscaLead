import fs from 'node:fs';
import path from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { SETTINGS } from '../config/settings.js';

const CSV_COLUMNS = [
  'name',
  'phone',
  'normalizedPhone',
  'whatsappCandidate',
  'city',
  'state',
  'address',
  'website',
  'rating',
  'reviewCount',
  'leadScore',
  'leadTier',
  'businessStatus',
  'googleMapsUrl',
  'placeId',
  'searchTerm',
  'collectedAt'
];

/**
 * Garante a exist�ncia do diret�rio de sa�da.
 * @param {string} dirPath
 */
function ensureOutputDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Mapeia um objeto de lead para o formato estrito das colunas do CSV.
 * Se determinado campo n�o existir, define como null / string vazia.
 *
 * @param {object} lead
 * @returns {object}
 */
function mapLeadToCsvRow(lead) {
  return {
    name: lead.name || null,
    phone: lead.phone || null,
    normalizedPhone: lead.normalizedPhone || null,
    whatsappCandidate: Boolean(lead.whatsappCandidate),
    city: lead.city || null,
    state: lead.state || null,
    address: lead.address || null,
    website: lead.website || null,
    rating: typeof lead.rating === 'number' ? lead.rating : null,
    reviewCount: typeof lead.reviewCount === 'number' ? lead.reviewCount : 0,
    leadScore: typeof lead.leadScore === 'number' ? lead.leadScore : 0,
    leadTier: lead.leadTier || 'D',
    businessStatus: lead.businessStatus || null,
    googleMapsUrl: lead.googleMapsUrl || null,
    placeId: lead.placeId || null,
    searchTerm: lead.searchTerm || null,
    collectedAt: lead.collectedAt || new Date().toISOString()
  };
}

/**
 * Ordena os leads prioritariamente por:
 * 1. leadScore DESC
 * 2. reviewCount DESC
 * 3. rating DESC
 *
 * @param {Array<object>} leads
 * @returns {Array<object>}
 */
export function sortLeads(leads) {
  return [...leads].sort((a, b) => {
    const scoreDiff = (b.leadScore || 0) - (a.leadScore || 0);
    if (scoreDiff !== 0) return scoreDiff;

    const reviewDiff = (b.reviewCount || 0) - (a.reviewCount || 0);
    if (reviewDiff !== 0) return reviewDiff;

    const ratingA = typeof a.rating === 'number' ? a.rating : 0;
    const ratingB = typeof b.rating === 'number' ? b.rating : 0;
    return ratingB - ratingA;
  });
}

/**
 * Exporta os leads para arquivos CSV (todos os leads e leads qualificados).
 *
 * @param {Array<object>} allLeads - Todos os leads �nicos coletados
 * @param {Array<object>} qualifiedLeads - Apenas leads que atenderam aos crit�rios m�nimos
 * @param {object} [options={}] - Op��es customizadas de caminho
 * @returns {{ allLeadsPath: string, qualifiedLeadsPath: string, allCount: number, qualifiedCount: number }}
 */
export function exportToCsv(allLeads, qualifiedLeads, options = {}) {
  const outputDir = options.outputDir || SETTINGS.outputDir || 'output';
  ensureOutputDir(outputDir);

  const sortedAll = sortLeads(allLeads);
  const sortedQualified = sortLeads(qualifiedLeads);

  const allRows = sortedAll.map(mapLeadToCsvRow);
  const qualifiedRows = sortedQualified.map(mapLeadToCsvRow);

  const csvOptions = {
    header: true,
    columns: CSV_COLUMNS,
    cast: {
      boolean: (value) => (value ? 'true' : 'false')
    }
  };

  const allCsvString = stringify(allRows, csvOptions);
  const qualifiedCsvString = stringify(qualifiedRows, csvOptions);

  const allLeadsPath = path.join(outputDir, 'all-leads.csv');
  const qualifiedLeadsPath = path.join(outputDir, 'qualified-leads.csv');

  fs.writeFileSync(allLeadsPath, allCsvString, 'utf-8');
  fs.writeFileSync(qualifiedLeadsPath, qualifiedCsvString, 'utf-8');

  return {
    allLeadsPath,
    qualifiedLeadsPath,
    allCount: allRows.length,
    qualifiedCount: qualifiedRows.length
  };
}
