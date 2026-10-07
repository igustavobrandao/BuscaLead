import assert from 'node:assert/strict';
export { afterEach, beforeEach, describe, it } from 'node:test';

export function expect(actual) {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },
    toBeGreaterThan(expected) {
      assert.ok(actual > expected);
    },
    toBeNull() {
      assert.strictEqual(actual, null);
    },
    toContain(expected) {
      assert.ok(actual.includes(expected));
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected);
    },
    toHaveLength(expected) {
      assert.strictEqual(actual.length, expected);
    }
  };
}
