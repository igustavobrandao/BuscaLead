import { afterEach, beforeEach, describe, expect, it } from './test-utils.js';
import fs from 'node:fs';
import path from 'node:path';
import { exportToCsv, sortLeads } from '../src/exporters/csvExporter.js';

describe('csvExporter', () => {
  const testOutputDir = path.join(process.cwd(), '.test-output');

  beforeEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('ordena os leads prioritariamente por leadScore DESC, reviewCount DESC e rating DESC', () => {
    const leads = [
      { name: 'Lead Baixo', leadScore: 50, reviewCount: 100, rating: 4.5 },
      { name: 'Lead Alto Empate Reviews Menores', leadScore: 90, reviewCount: 50, rating: 4.9 },
      { name: 'Lead Alto Empate Reviews Maiores', leadScore: 90, reviewCount: 200, rating: 4.8 }
    ];

    const sorted = sortLeads(leads);

    expect(sorted[0].name).toBe('Lead Alto Empate Reviews Maiores');
    expect(sorted[1].name).toBe('Lead Alto Empate Reviews Menores');
    expect(sorted[2].name).toBe('Lead Baixo');
  });

  it('exporta arquivos all-leads.csv e qualified-leads.csv com o cabe�alho correto', () => {
    const allLeads = [
      {
        name: 'Escola ABC',
        phone: '(11) 3222-1111',
        normalizedPhone: '551132221111',
        whatsappCandidate: false,
        city: 'S�o Paulo',
        state: 'SP',
        address: 'Rua Exemplo, 123',
        website: 'https://escolaabc.com.br',
        rating: 4.8,
        reviewCount: 150,
        leadScore: 90,
        leadTier: 'A',
        businessStatus: 'OPERATIONAL',
        googleMapsUrl: 'https://maps.google.com/?cid=123',
        placeId: 'ChIJ123',
        searchTerm: 'escola de ingl�s'
      }
    ];

    const qualifiedLeads = [...allLeads];

    const result = exportToCsv(allLeads, qualifiedLeads, { outputDir: testOutputDir });

    expect(fs.existsSync(result.allLeadsPath)).toBe(true);
    expect(fs.existsSync(result.qualifiedLeadsPath)).toBe(true);

    const allCsv = fs.readFileSync(result.allLeadsPath, 'utf-8');
    expect(allCsv).toContain('name,phone,normalizedPhone,whatsappCandidate,city,state');
    expect(allCsv).toContain('Escola ABC');
    expect(allCsv).toContain('551132221111');
    expect(allCsv).toContain('OPERATIONAL');
  });
});
