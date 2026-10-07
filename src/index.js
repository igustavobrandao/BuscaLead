#!/usr/bin/env node
import 'dotenv/config';
import { runLeadGeneration } from './services/leadGenerationService.js';

function parseCliArgs(args = process.argv.slice(2)) {
  const options = { query: '', preset: 'major-cities', dryRun: false, showHelp: false };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.showHelp = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--preset=')) options.preset = arg.slice('--preset='.length).trim();
    else if (!arg.startsWith('-') && !options.query) options.query = arg.trim();
  }

  return options;
}

function printHelp() {
  console.log(`
School Leads Finder — prospecção B2B com Google Places API

USO:
  npm run search -- "<categoria>" [opções]

EXEMPLOS:
  npm run search -- "escolas de inglês" --preset=test
  npm run search -- "escolas de inglês" --preset=major-cities
  npm run search -- "escolas de inglês" --dry-run

OPÇÕES:
  --preset=<test|major-cities|all>
  --dry-run
  --help, -h
`);
}

async function main() {
  const { query, preset, dryRun, showHelp } = parseCliArgs();

  if (showHelp) {
    printHelp();
    return;
  }

  await runLeadGeneration({
    query: query || 'escolas de inglês',
    preset,
    dryRun
  });
}

main().catch((error) => {
  console.error(`\n[ERRO] ${error.message}`);
  process.exitCode = 1;
});
