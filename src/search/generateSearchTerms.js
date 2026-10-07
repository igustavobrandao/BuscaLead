const CATEGORY_EXPANSIONS = [
  {
    matches: (query) => /\b(ingl[eê]s|idioma[s]?|espanhol|franc[eê]s|alem[aã]o)\b/i.test(query),
    generate: (query) => {
      if (/\bingl[eê]s\b/i.test(query)) {
        return [
          'escola de inglês',
          'curso de inglês',
          'escola de idiomas',
          'curso de idiomas',
          'inglês para adultos',
          'inglês profissional',
          'curso de conversação em inglês',
          'centro de idiomas',
          'instituto de idiomas'
        ];
      }

      return [
        query,
        `escola de ${query}`,
        `curso de ${query}`,
        'escola de idiomas',
        'curso de idiomas',
        'centro de idiomas',
        'instituto de idiomas'
      ];
    }
  },
  {
    matches: (query) => /\b(escola[s]?.*particular(es)?|col[eé]gio[s]?|educa[cç][aã]o infantil|ensino m[eé]dio)\b/i.test(query),
    generate: () => [
      'escola particular',
      'colégio particular',
      'escola de educação infantil',
      'colégio de ensino fundamental',
      'colégio de ensino médio',
      'instituição de ensino particular'
    ]
  },
  {
    matches: (query) => /\b(m[uú]sica[s]?|canto|viol[aã]o|piano|bateria)\b/i.test(query),
    generate: () => [
      'escola de música',
      'curso de música',
      'aulas de música',
      'conservatório de música',
      'instituto de música',
      'escola de instrumentos musicais',
      'aulas de canto e música'
    ]
  },
  {
    matches: (query) => /\b(odontol[oó]gic\w*|dentista[s]?|ortodontia|implante[s]?)\b/i.test(query),
    generate: () => ['clínica odontológica', 'consultório odontológico', 'dentista', 'centro odontológico', 'clínica de ortodontia e implantes']
  },
  {
    matches: (query) => /\b(veterin[aá]ri\w*|hospital veterin[aá]rio|pet clinic)\b/i.test(query),
    generate: () => ['clínica veterinária', 'hospital veterinário', 'consultório veterinário', 'centro médico veterinário', 'atendimento veterinário']
  },
  {
    matches: (query) => /\b(academia[s]?|fitness|muscula[cç][aã]o|crossfit|pilates)\b/i.test(query),
    generate: () => ['academia', 'academia de musculação', 'academia fitness', 'centro de treinamento físico', 'estúdio de pilates e fitness']
  },
  {
    matches: (query) => /\b(imobili[aá]ri\w*|corretor\w*|im[oó]vei\w*)\b/i.test(query),
    generate: () => ['imobiliária', 'corretora de imóveis', 'consultoria imobiliária', 'agência imobiliária', 'venda e locação de imóveis']
  }
];

function toSingular(word) {
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function generateGenericVariations(query) {
  const normalized = query.trim().toLowerCase();
  const singular = normalized.split(/\s+/).map(toSingular).join(' ');
  const variations = new Set([normalized]);

  if (singular !== normalized) variations.add(singular);

  const prefixes = ['escola de', 'curso de', 'clínica de', 'centro de', 'instituto de', 'empresa de'];
  const prefix = prefixes.find((item) => normalized.startsWith(item));
  const coreTerm = prefix ? normalized.slice(prefix.length).trim() : normalized;

  if (prefix) {
    ['escola de', 'curso de', 'centro de', 'instituto de'].forEach((item) => variations.add(`${item} ${coreTerm}`));
    variations.add(`${coreTerm} profissional`);
    variations.add(`${coreTerm} para adultos`);
  } else {
    ['curso de', 'escola de', 'centro de', 'serviços de'].forEach((item) => variations.add(`${item} ${normalized}`));
    variations.add(`${normalized} profissional`);
  }

  return [...variations];
}

export function generateSearchTerms(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];

  const normalized = query.trim().toLowerCase();
  const category = CATEGORY_EXPANSIONS.find((item) => item.matches(normalized));
  const terms = category ? category.generate(normalized) : generateGenericVariations(normalized);
  const uniqueTerms = [...new Set(terms.map((term) => term.trim()))];

  return options.maxTerms > 0 ? uniqueTerms.slice(0, options.maxTerms) : uniqueTerms;
}
