export const CITIES = [
  { city: 'São Paulo', state: 'SP', priority: 1 },
  { city: 'Rio de Janeiro', state: 'RJ', priority: 1 },
  { city: 'Belo Horizonte', state: 'MG', priority: 1 },
  { city: 'Brasília', state: 'DF', priority: 1 },
  { city: 'Salvador', state: 'BA', priority: 1 },
  { city: 'Fortaleza', state: 'CE', priority: 1 },
  { city: 'Curitiba', state: 'PR', priority: 1 },
  { city: 'Recife', state: 'PE', priority: 1 },
  { city: 'Porto Alegre', state: 'RS', priority: 1 },
  { city: 'Goiânia', state: 'GO', priority: 1 },
  { city: 'Manaus', state: 'AM', priority: 1 },
  { city: 'Belém', state: 'PA', priority: 1 },
  { city: 'Florianópolis', state: 'SC', priority: 1 },
  { city: 'Vitória', state: 'ES', priority: 1 },
  { city: 'Campinas', state: 'SP', priority: 2 },
  { city: 'Ribeirão Preto', state: 'SP', priority: 2 },
  { city: 'São José dos Campos', state: 'SP', priority: 2 },
  { city: 'Sorocaba', state: 'SP', priority: 2 },
  { city: 'Niterói', state: 'RJ', priority: 2 },
  { city: 'Uberlândia', state: 'MG', priority: 2 },
  { city: 'Joinville', state: 'SC', priority: 2 },
  { city: 'Londrina', state: 'PR', priority: 2 },
  { city: 'Maringá', state: 'PR', priority: 2 },
  { city: 'Feira de Santana', state: 'BA', priority: 2 },
  { city: 'Vitória da Conquista', state: 'BA', priority: 2 }
];

export function getCitiesByPreset(presetName = 'all') {
  const preset = String(presetName).toLowerCase().trim();

  if (preset === 'test') {
    const citiesByName = new Map(CITIES.map((city) => [city.city, city]));
    return ['São Paulo', 'Salvador', 'Belo Horizonte'].map((city) => citiesByName.get(city));
  }

  if (preset === 'major-cities' || preset === 'capitals') {
    return CITIES.filter(({ priority }) => priority === 1);
  }

  return CITIES;
}
