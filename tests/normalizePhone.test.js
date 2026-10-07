import { describe, expect, it } from './test-utils.js';
import { normalizePhone, isWhatsappCandidate } from '../src/utils/normalizePhone.js';

describe('normalizePhone', () => {
  it('normaliza n�mero brasileiro com par�nteses e tra�o', () => {
    expect(normalizePhone('(71) 99999-9999')).toBe('5571999999999');
    expect(normalizePhone('(11) 3222-3333')).toBe('551132223333');
  });

  it('normaliza n�mero j� iniciado com +55', () => {
    expect(normalizePhone('+55 (71) 98888-7777')).toBe('5571988887777');
    expect(normalizePhone('+55 11 3344-5566')).toBe('551133445566');
  });

  it('trata n�mero iniciado com 0 antes do DDD', () => {
    expect(normalizePhone('071 99999-8888')).toBe('5571999998888');
    expect(normalizePhone('011 3333-2222')).toBe('551133332222');
  });

  it('n�o inventa DDD para n�meros locais com apenas 8 ou 9 d�gitos', () => {
    expect(normalizePhone('99999-9999')).toBe('999999999');
    expect(normalizePhone('3333-4444')).toBe('33334444');
  });

  it('retorna null para valores vazios, inv�lidos ou sem d�gitos', () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('---')).toBeNull();
  });
});

describe('isWhatsappCandidate', () => {
  it('identifica celular brasileiro com DDD como candidato a WhatsApp', () => {
    expect(isWhatsappCandidate('(71) 99999-9999')).toBe(true);
    expect(isWhatsappCandidate('5511987654321')).toBe(true);
    expect(isWhatsappCandidate('+55 21 98888-1234')).toBe(true);
  });

  it('rejeita telefone fixo como candidato a WhatsApp', () => {
    expect(isWhatsappCandidate('(71) 3333-4444')).toBe(false);
    expect(isWhatsappCandidate('551132223333')).toBe(false);
  });

  it('rejeita n�meros incompletos ou nulos', () => {
    expect(isWhatsappCandidate(null)).toBe(false);
    expect(isWhatsappCandidate('')).toBe(false);
    expect(isWhatsappCandidate('99999-9999')).toBe(false); // sem DDD
  });
});
