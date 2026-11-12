import test from 'node:test';
import assert from 'node:assert/strict';
import { attenuation, lambert, blinnPhong } from '../src/math/light.js';
test('attenuation decreases with distance', () => {
  const a0 = attenuation(0.1); const a1 = attenuation(2.0);
  assert.ok(a0 > a1); assert.ok(a0 <= 1 && a1 > 0);
});
test('lambert clamps cosine', () => {
  assert.equal(lambert(-0.5), 0);
  assert.ok(Math.abs(lambert(0.5) - 0.5) < 1e-9);
});
test('blinnPhong peaks for aligned vectors', () => {
  const hi = blinnPhong(1, 32); const lo = blinnPhong(0.2, 32);
  assert.ok(hi > lo); assert.ok(hi <= 1);
});
