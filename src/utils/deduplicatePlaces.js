import { normalizePhone } from './normalizePhone.js';

/**
 * Remove acentos e caracteres especiais para compara��o flex�vel.
 * @param {string} str
 * @returns {string}
 */
function cleanString(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mescla dois registros do mesmo estabelecimento mantendo os campos mais ricos/completos.
 *
 * @param {object} target - Registro acumulado
 * @param {object} source - Novo registro duplicado
 * @returns {object} Registro mesclado
 */
function mergePlaceRecords(target, source) {
  return {
    ...target,
    name: target.name || source.name,
    phone: target.phone || source.phone,
    normalizedPhone: target.normalizedPhone || source.normalizedPhone,
    whatsappCandidate: target.whatsappCandidate || source.whatsappCandidate,
    website: target.website || source.website || target.websiteUri || source.websiteUri,
    googleMapsUrl: target.googleMapsUrl || source.googleMapsUrl || target.googleMapsUri || source.googleMapsUri,
    address: target.address || source.address || target.formattedAddress || source.formattedAddress,
    city: target.city || source.city,
    state: target.state || source.state,
    rating: target.rating ?? source.rating,
    userRatingCount: Math.max(target.userRatingCount || 0, source.userRatingCount || 0),
    reviewCount: Math.max(target.reviewCount || 0, source.reviewCount || 0),
    businessStatus: target.businessStatus || source.businessStatus,
    primaryType: target.primaryType || source.primaryType,
    searchTerm: target.searchTerm || source.searchTerm
  };
}

/**
 * Desduplica estabelecimentos garantindo que a mesma escola n�o apare�a repetida.
 *
 * Prioridade:
 * 1. placeId (identificador �nico do Google Places)
 * 2. normalizedPhone (se ambos possu�rem telefone normalizado v�lido com pelo menos 10 d�gitos)
 * 3. Nome + Cidade + Endere�o normalizado (garantindo que franquias em bairros diferentes sejam preservadas)
 *
 * @param {object[]} places - Lista bruta de estabelecimentos
 * @returns {object[]} Lista desduplicada de estabelecimentos
 */
export function deduplicatePlaces(places) {
  if (!Array.isArray(places) || places.length === 0) {
    return [];
  }

  const uniqueList = [];
  const placeIdIndex = new Map();
  const phoneIndex = new Map();
  const addressKeyIndex = new Map();

  for (const place of places) {
    if (!place || typeof place !== 'object') continue;

    const placeId = place.placeId || place.id;
    const phone = place.normalizedPhone || normalizePhone(place.phone || place.nationalPhoneNumber);
    const name = cleanString(place.name || place.displayName?.text || place.displayName || '');
    const city = cleanString(place.city || '');
    const address = cleanString(place.address || place.formattedAddress || '');

    // 1. Verifica��o por placeId
    if (placeId && placeIdIndex.has(placeId)) {
      const existingIdx = placeIdIndex.get(placeId);
      uniqueList[existingIdx] = mergePlaceRecords(uniqueList[existingIdx], place);
      continue;
    }

    // 2. Verifica��o por Telefone Normalizado (m�nimo 10 d�gitos)
    if (phone && phone.length >= 10 && phoneIndex.has(phone)) {
      const existingIdx = phoneIndex.get(phone);
      uniqueList[existingIdx] = mergePlaceRecords(uniqueList[existingIdx], place);
      continue;
    }

    // 3. Verifica��o por Nome + Cidade + Endere�o
    // Gera uma chave composta detalhada para permitir diferentes unidades da mesma franquia
    let compositeKey = null;
    if (name && city && address) {
      compositeKey = `${name}__${city}__${address}`;
      if (addressKeyIndex.has(compositeKey)) {
        const existingIdx = addressKeyIndex.get(compositeKey);
        uniqueList[existingIdx] = mergePlaceRecords(uniqueList[existingIdx], place);
        continue;
      }
    }

    // Se � novo, insere na lista e indexa
    const newIdx = uniqueList.length;
    uniqueList.push({ ...place });

    if (placeId) {
      placeIdIndex.set(placeId, newIdx);
    }
    if (phone && phone.length >= 10) {
      phoneIndex.set(phone, newIdx);
    }
    if (compositeKey) {
      addressKeyIndex.set(compositeKey, newIdx);
    }
  }

  return uniqueList;
}
