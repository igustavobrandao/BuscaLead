/**
 * Normaliza n�meros de telefone comerciais brasileiros para o formato padr�o internacional:
 * Ex: 5571999999999 (55 + DDD + 9 d�gitos) ou 557133334444 (55 + DDD + 8 d�gitos).
 *
 * Remove pontua��es, par�nteses, espa�os e o prefixo '+'.
 * N�o inventa DDD caso o n�mero n�o o contenha.
 *
 * @param {string|null|undefined} phone
 * @returns {string|null} Telefone normalizado ou null se inv�lido
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove tudo que n�o for d�gito
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  // Caso: J� tem DDI 55 (12 d�gitos para fixo ou 13 d�gitos para celular)
  if (digits.startsWith('55')) {
    if (digits.length === 12 || digits.length === 13) {
      return digits;
    }
  }

  // Caso: Come�a com 0 + DDD (ex: 011987654321 ou 07133334444)
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    const withoutZero = digits.slice(1);
    return `55${withoutZero}`;
  }

  // Caso: 10 d�gitos (DDD 2 d�gitos + Fixo 8 d�gitos)
  if (digits.length === 10) {
    return `55${digits}`;
  }

  // Caso: 11 d�gitos (DDD 2 d�gitos + Celular 9 d�gitos)
  if (digits.length === 11) {
    return `55${digits}`;
  }

  // Caso: 8 ou 9 d�gitos (n�mero sem DDD) - N�o inventamos DDD
  if (digits.length === 8 || digits.length === 9) {
    return digits;
  }

  // Retorna os d�gitos limpos caso fuja dos padr�es acima mas possua valor
  return digits;
}

/**
 * Avalia se o telefone aparenta ser um n�mero de celular brasileiro v�lido (candidato a WhatsApp).
 *
 * Padr�o celular BR:
 * DDI 55 + DDD (2 d�gitos de 11 a 99) + 9 d�gitos (come�ando com 9).
 * Total de 13 d�gitos no formato normalizado: 55[1-9][0-9]9[0-9]{8}
 *
 * @param {string|null|undefined} phone - N�mero de telefone (bruto ou normalizado)
 * @returns {boolean} true se for candidato a WhatsApp comercial, false caso contr�rio
 */
export function isWhatsappCandidate(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return false;
  }

  // Celular BR com 13 d�gitos: 55 + DDD (11-99) + 9 + 8 d�gitos
  const brazilianCellPattern = /^55[1-9][0-9]9[0-9]{8}$/;
  return brazilianCellPattern.test(normalized);
}
