import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStatus, normalizePaymentMethod, normalizeFunnelStage } from './hotmart-utils';

test('normalizeStatus', () => {
  assert.equal(normalizeStatus('APPROVED'), 'APPROVED');
  assert.equal(normalizeStatus('COMPLETE'), 'APPROVED');
  assert.equal(normalizeStatus('CANCELED'), 'REFUNDED');
  assert.equal(normalizeStatus('BILLET_PRINTED'), 'PENDING');
  assert.equal(normalizeStatus('UNKNOWN'), 'UNKNOWN');
});

test('normalizePaymentMethod', () => {
  assert.equal(normalizePaymentMethod('CREDIT_CARD'), 'CREDIT_CARD');
  assert.equal(normalizePaymentMethod('HOTMART_PIX'), 'PIX');
  assert.equal(normalizePaymentMethod('BILLET'), 'BOLETO');
});

test('normalizeFunnelStage', () => {
  assert.equal(normalizeFunnelStage('Course - Upsell 1'), 'UPSELL');
  assert.equal(normalizeFunnelStage('Main Product (Order Bump)'), 'ORDER_BUMP');
  assert.equal(normalizeFunnelStage('Just the product'), 'FRONTEND');
});
