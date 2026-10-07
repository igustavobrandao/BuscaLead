/**
 * Pausa a execu��o pelo n�mero especificado de milissegundos.
 *
 * @param {number} ms - Tempo em milissegundos.
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
