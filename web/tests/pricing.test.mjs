import test from 'node:test';
import assert from 'node:assert/strict';
import { getPricing, formatServicePrice } from '../src/lib/data/pricing.ts';

test('change of use is quoted above 25000 rather than a fixed 10900', () => {
  const price = getPricing('bruksendring');
  assert.equal(price.mittbygg, 25000);
  assert.equal(price.priceKind, 'above');
  assert.match(formatServicePrice(price).replace(/\s/g, ' '), /^Over 25 000 kr$/);
});
