import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SETTINGS } from '../config/settings.js';

/**
 * Cria o diret�rio de cache se ainda n�o existir.
 */
function ensureCacheDir() {
  if (!fs.existsSync(SETTINGS.cacheDir)) {
    try {
      fs.mkdirSync(SETTINGS.cacheDir, { recursive: true });
    } catch {
      // Ignora erro se j� existir por corrida
    }
  }
}

/**
 * Gera um hash SHA-256 seguro para a chave de cache.
 * @param {string} key
 * @returns {string}
 */
function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Utilit�rio de cache local em arquivo (.cache/) com TTL configur�vel.
 */
export const fileCache = {
  /**
   * Obt�m um item do cache se existir e n�o tiver expirado.
   *
   * @param {string} key - Chave �nica (ex: 'search:escola de ingles em sp')
   * @returns {any|null}
   */
  get(key) {
    if (!SETTINGS.cacheEnabled) return null;

    try {
      ensureCacheDir();
      const filePath = path.join(SETTINGS.cacheDir, `${hashKey(key)}.json`);
      if (!fs.existsSync(filePath)) return null;

      const raw = fs.readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(raw);

      const now = Date.now();
      const ttlMs = SETTINGS.cacheTtlHours * 60 * 60 * 1000;

      if (now - entry.timestamp > ttlMs) {
        // Expirado
        try {
          fs.unlinkSync(filePath);
        } catch {}
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Salva um item no cache local com timestamp atual.
   *
   * @param {string} key - Chave �nica
   * @param {any} data - Dados a armazenar
   */
  set(key, data) {
    if (!SETTINGS.cacheEnabled) return;

    try {
      ensureCacheDir();
      const filePath = path.join(SETTINGS.cacheDir, `${hashKey(key)}.json`);
      const payload = {
        key,
        timestamp: Date.now(),
        data
      };
      fs.writeFileSync(filePath, JSON.stringify(payload), 'utf-8');
    } catch {
      // Silencioso se falhar escrita de cache
    }
  }
};
