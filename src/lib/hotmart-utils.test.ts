import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStatus, normalizePaymentMethod, resolveFunnelStage } from './hotmart-utils';

test('normalizeStatus', () => {
  assert.equal(normalizeStatus('APPROVED'), 'APPROVED');
  assert.equal(normalizeStatus('COMPLETE'), 'APPROVED');
  assert.equal(normalizeStatus('CANCELLED'), 'REFUNDED');
  assert.equal(normalizeStatus('CHARGEBACK'), 'REFUNDED');
  assert.equal(normalizeStatus('PRINTED_BILLET'), 'PENDING');
  assert.equal(normalizeStatus('WAITING_PAYMENT'), 'PENDING');
  assert.equal(normalizeStatus('OVERDUE'), 'EXPIRED');
});

test('normalizePaymentMethod', () => {
  assert.equal(normalizePaymentMethod('CREDIT_CARD'), 'CREDIT_CARD');
  assert.equal(normalizePaymentMethod('PIX'), 'PIX');
  assert.equal(normalizePaymentMethod('BILLET'), 'BOLETO');
  assert.equal(normalizePaymentMethod('FINANCED_BILLET'), 'BOLETO');
});

test('resolveFunnelStage - order bump nativo', () => {
  assert.equal(resolveFunnelStage(true, false, 'Course'), 'ORDER_BUMP');
});

test('resolveFunnelStage - upsell', () => {
  assert.equal(resolveFunnelStage(false, true, 'Course Upsell'), 'UPSELL');
});

test('resolveFunnelStage - frontend', () => {
  assert.equal(resolveFunnelStage(false, false, 'Just the product'), 'FRONTEND');
});
