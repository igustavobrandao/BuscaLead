# School Leads Finder

CLI em Node.js para descobrir, enriquecer e qualificar leads B2B no Google Places API (New). O projeto é backend-only: a chave da API permanece sempre no ambiente local e nunca é exposta a um navegador.

## Recursos

- Expansão de termos de busca e cobertura por cidade;
- Cache local com TTL, limite de custo, timeout e retry;
- Deduplicação, enriquecimento de telefone/site e score comercial;
- Exportação de todos os leads e dos leads qualificados em CSV;
- Testes automatizados com o runner nativo do Node.js.

## Requisitos

- Node.js 20 ou superior;
- Um projeto Google Cloud com a **Places API (New)** ativada;
- Uma chave de API restrita à Places API (New).

## Instalação

```bash
git clone <URL_DO_REPOSITORIO>
cd school-leads-finder
npm install
cp .env.example .env
```

No Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Configure a chave no `.env`:

```env
GOOGLE_PLACES_API_KEY=AIza...
MAX_REQUESTS_PER_RUN=300
```

## Uso

Antes de gastar créditos, valide o plano de busca:

```bash
npm run search -- "escolas de inglês" --preset=test --dry-run
```

Execute uma busca de teste:

```bash
npm run search -- "escolas de inglês" --preset=test
```

Execute nas capitais prioritárias:

```bash
npm run search -- "escolas de inglês" --preset=major-cities
```

Presets disponíveis:

- `test`: São Paulo, Salvador e Belo Horizonte, com duas variações de termo;
- `major-cities`: 14 capitais prioritárias;
- `all`: capitais prioritárias e polos regionais configurados em `src/config/cities.js`.

Os arquivos são criados em `output/all-leads.csv` e `output/qualified-leads.csv`. Se o limite de requisições for atingido, execute o mesmo comando novamente: consultas e detalhes já concluídos serão aproveitados do cache local.

## Qualidade

```bash
npm test
npm run check
```

## Uso responsável

O Google Places API pode gerar custos. Comece sempre com `--dry-run` ou `--preset=test`, defina `MAX_REQUESTS_PER_RUN` e monitore o faturamento no Google Cloud.

Os dados coletados podem incluir dados de contato de empresas. Você é responsável por cumprir os termos do Google Maps Platform, a LGPD e as regras aplicáveis às suas comunicações comerciais. Não versione `.env`, `.cache/` nem `output/`.

## Contribuição e segurança

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) e [SECURITY.md](SECURITY.md). O projeto é distribuído sob a licença [MIT](LICENSE).
