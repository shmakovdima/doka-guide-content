import test from 'node:test';
import assert from 'node:assert/strict';

import {
  abortOperation,
  changeDraftAmount,
  commitServerPayment,
  createInitialState,
  receiveOperationResult,
  reconcileServerState,
  resetState,
  resolveConflict,
  startOperation,
} from './state.js';

const input = {
  operationId: 'op-1',
  invoiceId: 'inv-2048',
  amountCents: 120000,
  currency: 'USD',
};

function committedRace(mode) {
  let state = createInitialState(mode);
  state = startOperation(state, input);
  state = changeDraftAmount(state, 12000);
  state = commitServerPayment(state);
  return state;
}

test('changing the human draft increments the page revision', () => {
  const initial = createInitialState('coordinated');
  const changed = changeDraftAmount(initial, 12000);
  assert.equal(changed.pageRevision, 42);
  assert.equal(changed.draft.amountCents, 12000);
});

test('unsafe late response exposes $120 draft and $1,200 payment', () => {
  const state = receiveOperationResult(committedRace('unsafe'));
  assert.equal(state.draft.amountCents, 12000);
  assert.equal(state.serverPayment.amountCents, 120000);
  assert.equal(state.conflict.type, 'uncoordinated-result');
});

test('coordinated late response preserves the draft and opens reconciliation', () => {
  const state = receiveOperationResult(committedRace('coordinated'));
  assert.equal(state.draft.amountCents, 12000);
  assert.equal(state.serverPayment.amountCents, 120000);
  assert.equal(state.conflict.type, 'revision-conflict');
});

test('unchanged revision completes without conflict', () => {
  let state = createInitialState('coordinated');
  state = startOperation(state, input);
  state = commitServerPayment(state);
  state = receiveOperationResult(state);
  assert.equal(state.operationStatus, 'completed');
  assert.equal(state.conflict, null);
});

test('abort before commit leaves no server payment', () => {
  let state = createInitialState('coordinated');
  state = startOperation(state, input);
  state = abortOperation(state);
  assert.equal(state.operationStatus, 'failed');
  assert.equal(state.serverPayment, null);
});

test('abort after commit becomes unknown and reconciliation finds payment', () => {
  let state = createInitialState('coordinated');
  state = startOperation(state, input);
  state = commitServerPayment(state);
  state = abortOperation(state);
  assert.equal(state.operationStatus, 'unknown');
  state = reconcileServerState(state);
  assert.equal(state.operationStatus, 'completed');
  assert.equal(state.conflict.type, 'reconciled-after-abort');
});

test('reusing an operation ID does not create a second payment', () => {
  let state = createInitialState('coordinated');
  state = startOperation(state, input);
  state = commitServerPayment(state);
  const paymentId = state.serverPayment.paymentId;
  state = commitServerPayment(state);
  assert.equal(state.serverPayment.paymentId, paymentId);
  assert.equal(state.completedOperationIds.length, 1);
});

test('refund is a separate state transition after payment succeeds', () => {
  let state = receiveOperationResult(committedRace('coordinated'));
  state = resolveConflict(state, 'refund');
  assert.equal(state.serverPayment.status, 'refunded');
  assert.equal(state.events.at(-1).type, 'payment-refunded');
});

test('reset restores initial state without changing the selected mode', () => {
  const raced = receiveOperationResult(committedRace('coordinated'));
  const state = resetState(raced);
  assert.equal(state.mode, 'coordinated');
  assert.equal(state.pageRevision, 41);
  assert.equal(state.serverPayment, null);
  assert.equal(state.operationStatus, 'idle');
});
