import { SETTINGS } from '../config/settings.js';
import { fileCache } from '../utils/fileCache.js';
import { sleep } from '../utils/sleep.js';
import { logger } from '../utils/logger.js';

/**
 * Cliente HTTP para a Google Places API (New) com controle estrito de custos,
 * concorr�ncia controlada, limita��o de or�amento, cache local e retry exponencial.
 */
export class PlacesClient {
  constructor(customConfig = {}) {
    this.apiKey = customConfig.apiKey || SETTINGS.apiKey;
    this.maxRequests = customConfig.maxRequestsPerRun || SETTINGS.maxRequestsPerRun;
    this.concurrency = customConfig.concurrency || SETTINGS.concurrency;
    this.maxRetries = customConfig.maxRetries || SETTINGS.maxRetries;
    this.initialRetryDelay = customConfig.initialRetryDelayMs || SETTINGS.initialRetryDelayMs;
    this.timeoutMs = customConfig.requestTimeoutMs || SETTINGS.requestTimeoutMs;

    // M�tricas de execu��o
    this.metrics = {
      searchRequests: 0,
      detailsRequests: 0,
      cacheHits: 0,
      skippedRequests: 0,
      failedRequests: 0,
      budgetExceeded: false
    };

    // Controle de concorr�ncia simples com sem�foro
    this._activeRequests = 0;
    this._queue = [];
  }

  /**
   * Executa uma tarefa ass�ncrona respeitando o limite de concorr�ncia configurado.
   *
   * @template T
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  async withConcurrency(task) {
    if (this._activeRequests >= this.concurrency) {
      await new Promise((resolve) => this._queue.push(resolve));
    }
    this._activeRequests++;
    try {
      return await task();
    } finally {
      this._activeRequests--;
      if (this._queue.length > 0) {
        const next = this._queue.shift();
        next();
      }
    }
  }

  /**
   * Verifica se o limite m�ximo de requisi��es foi atingido.
   * @returns {boolean}
   */
  hasBudget() {
    const totalRequests = this.metrics.searchRequests + this.metrics.detailsRequests;
    return totalRequests < this.maxRequests;
  }

  /**
   * Executa uma requisi��o HTTP com timeout e retry exponencial em 429 e 5xx.
   *
   * @param {string} url
   * @param {object} options
   * @param {'search'|'details'} requestType
   * @returns {Promise<any>}
   */
  async fetchWithRetry(url, options, requestType) {
    if (!this.apiKey) {
      throw new Error(
        'GOOGLE_PLACES_API_KEY n�o informada. Configure a vari�vel no arquivo .env ou passe como par�metro.'
      );
    }

    if (!this.hasBudget()) {
      this.metrics.budgetExceeded = true;
      this.metrics.skippedRequests++;
      logger.warn(`Limite de requisi��es atingido (${this.maxRequests}). Abortando novas buscas para proteger or�amento.`);
      throw new Error('BUDGET_LIMIT_REACHED');
    }

    let attempt = 0;
    let delay = this.initialRetryDelay;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers = {
          ...options.headers,
          'X-Goog-Api-Key': this.apiKey
        };

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timer);

        // Se sucesso (2xx)
        if (response.ok) {
          if (requestType === 'search') this.metrics.searchRequests++;
          if (requestType === 'details') this.metrics.detailsRequests++;
          return await response.json();
        }

        // Se rate limit (429) ou erro tempor�rio de servidor (5xx)
        if (response.status === 429 || response.status >= 500) {
          attempt++;
          if (attempt > this.maxRetries) {
            this.metrics.failedRequests++;
            const errText = await response.text().catch(() => '');
            throw new Error(`API retornou HTTP ${response.status} ap�s ${this.maxRetries} tentativas: ${errText}`);
          }
          logger.warn(`HTTP ${response.status} na requisi��o. Tentativa ${attempt}/${this.maxRetries} em ${delay}ms...`);
          await sleep(delay);
          delay *= 2; // Exponential backoff
          continue;
        }

        // Outros erros (ex: 400, 403)
        this.metrics.failedRequests++;
        const errorText = await response.text().catch(() => '');
        throw new Error(`Erro na API (${response.status}): ${errorText}`);
      } catch (err) {
        clearTimeout(timer);

        if (err.name === 'AbortError') {
          attempt++;
          if (attempt > this.maxRetries) {
            this.metrics.failedRequests++;
            throw new Error(`Timeout na requisi��o ap�s ${this.timeoutMs}ms.`);
          }
          logger.warn(`Timeout. Nova tentativa ${attempt}/${this.maxRetries} em ${delay}ms...`);
          await sleep(delay);
          delay *= 2;
          continue;
        }

        if (err.message === 'BUDGET_LIMIT_REACHED') {
          throw err;
        }

        if (attempt >= this.maxRetries) {
          this.metrics.failedRequests++;
          throw err;
        }

        attempt++;
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  /**
   * Retorna as m�tricas acumuladas da execu��o.
   */
  getMetrics() {
    return { ...this.metrics };
  }
}
