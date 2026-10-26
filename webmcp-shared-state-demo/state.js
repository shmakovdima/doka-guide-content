const ORIGINAL_AMOUNT_CENTS = 120000;
const CORRECTED_AMOUNT_CENTS = 12000;

function event(state, actor, type, message, details = {}) {
  const sequence = state.events.length + 1;
  return {
    ...state,
    events: [...state.events, { sequence, actor, type, message, details }],
  };
}

function assertMode(mode) {
  if (mode !== 'unsafe' && mode !== 'coordinated') {
    throw new Error('Unsupported mode: ' + mode);
  }
}

export function formatMoney(amountCents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function createInitialState(mode = 'unsafe') {
  assertMode(mode);

  return {
    mode,
    pageRevision: 41,
    draft: {
      invoiceId: 'inv-2048',
      vendor: 'Atlas Cloud',
      amountCents: ORIGINAL_AMOUNT_CENTS,
      currency: 'USD',
    },
    capturedIntent: null,
    serverPayment: null,
    operationStatus: 'idle',
    conflict: null,
    completedOperationIds: [],
    events: [
      {
        sequence: 1,
        actor: 'system',
        type: 'ready',
        message: 'Invoice amount is $1,200. Page revision is 41.',
        details: {},
      },
    ],
  };
}

export function setMode(state, mode) {
  assertMode(mode);
  if (state.operationStatus === 'pending') {
    throw new Error('Cannot switch modes while an operation is pending.');
  }

  return createInitialState(mode);
}

export function changeDraftAmount(state, amountCents) {
  if (![ORIGINAL_AMOUNT_CENTS, CORRECTED_AMOUNT_CENTS].includes(amountCents)) {
    throw new Error('Unsupported amount: ' + amountCents);
  }

  if (state.draft.amountCents === amountCents) return state;

  const next = {
    ...state,
    pageRevision: state.pageRevision + 1,
    draft: { ...state.draft, amountCents },
  };

  return event(
    next,
    'human',
    'draft-changed',
    'Human changed the amount to ' + formatMoney(amountCents) + '. Page revision is ' + next.pageRevision + '.',
    { amountCents, pageRevision: next.pageRevision },
  );
}

export function startOperation(state, input) {
  if (state.operationStatus === 'pending') {
    throw new Error('An operation is already pending.');
  }

  const operationId = input.operationId;
  if (!operationId) throw new Error('operationId is required.');

  const capturedIntent = {
    operationId,
    initiator: input.initiator ?? 'agent',
    pageRevision: state.pageRevision,
    invoiceId: input.invoiceId ?? state.draft.invoiceId,
    amountCents: input.amountCents ?? state.draft.amountCents,
    currency: input.currency ?? state.draft.currency,
  };

  const next = {
    ...state,
    capturedIntent,
    operationStatus: 'pending',
    conflict: null,
  };

  return event(
    next,
    capturedIntent.initiator,
    'operation-started',
    'Agent captured ' + formatMoney(capturedIntent.amountCents) + ' for ' + capturedIntent.invoiceId + ', revision ' + capturedIntent.pageRevision + '.',
    capturedIntent,
  );
}

export function commitServerPayment(state) {
  const intent = state.capturedIntent;
  if (!intent) throw new Error('No captured intent to commit.');

  if (state.mode === 'coordinated' && state.pageRevision !== intent.pageRevision) {
    const conflict = {
      type: 'stale-write-blocked',
      capturedRevision: intent.pageRevision,
      currentRevision: state.pageRevision,
      capturedAmountCents: intent.amountCents,
      currentAmountCents: state.draft.amountCents,
    };

    return event(
      { ...state, conflict },
      'server',
      'stale-write-rejected',
      'Revision check rejected the stale $1,200 intent before the processor was called.',
      conflict,
    );
  }

  if (state.completedOperationIds.includes(intent.operationId)) {
    return event(
      state,
      'server',
      'duplicate-ignored',
      'Duplicate operation ' + intent.operationId + ' returned the existing payment.',
      { operationId: intent.operationId },
    );
  }

  const serverPayment = {
    paymentId: 'pay-' + intent.operationId,
    operationId: intent.operationId,
    invoiceId: intent.invoiceId,
    amountCents: intent.amountCents,
    currency: intent.currency,
    status: 'succeeded',
  };

  const next = {
    ...state,
    serverPayment,
    completedOperationIds: [...state.completedOperationIds, intent.operationId],
  };

  return event(
    next,
    'server',
    'server-committed',
    'Processor completed a ' + formatMoney(serverPayment.amountCents) + ' payment.',
    serverPayment,
  );
}

export function receiveOperationResult(state) {
  if (!state.capturedIntent) {
    throw new Error('Cannot receive a result before an operation starts.');
  }

  if (state.conflict?.type === 'stale-write-blocked') {
    return event(
      {
        ...state,
        operationStatus: 'blocked',
      },
      'system',
      'safe-result-applied',
      'No payment was created. The $120 draft remains current.',
      state.conflict,
    );
  }

  if (!state.serverPayment) {
    throw new Error('Cannot receive a result before the processor commits.');
  }

  const revisionChanged = state.pageRevision !== state.capturedIntent.pageRevision;

  if (!revisionChanged) {
    return event(
      {
        ...state,
        operationStatus: 'completed',
        conflict: null,
      },
      'system',
      'result-applied',
      'The payment result matches the current page revision.',
    );
  }

  const conflict = {
    type: 'uncoordinated-result',
    capturedRevision: state.capturedIntent.pageRevision,
    currentRevision: state.pageRevision,
    capturedAmountCents: state.capturedIntent.amountCents,
    currentAmountCents: state.draft.amountCents,
  };

  return event(
    {
      ...state,
      operationStatus: 'completed',
      conflict,
    },
    'system',
    conflict.type,
    'Late payment result arrived without coordinating with the corrected amount.',
    conflict,
  );
}

export function abortOperation(state) {
  if (state.operationStatus !== 'pending') return state;

  if (state.serverPayment) {
    return event(
      {
        ...state,
        operationStatus: 'unknown',
        conflict: {
          type: 'unknown-after-abort',
          operationId: state.capturedIntent?.operationId,
        },
      },
      'human',
      'aborted-after-commit',
      'Local waiting stopped after processor commit. The payment outcome is unknown to the page.',
    );
  }

  return event(
    {
      ...state,
      operationStatus: 'failed',
      conflict: null,
    },
    'human',
    'aborted-before-commit',
    'Operation stopped before processor commit.',
  );
}

export function reconcileServerState(state) {
  if (state.operationStatus !== 'unknown') return state;

  if (!state.serverPayment) {
    return event(
      { ...state, operationStatus: 'failed', conflict: null },
      'system',
      'reconciled-empty',
      'Processor has no payment for this operation.',
    );
  }

  const conflict = {
    type: 'reconciled-after-abort',
    capturedAmountCents: state.serverPayment.amountCents,
    currentAmountCents: state.draft.amountCents,
  };

  return event(
    { ...state, operationStatus: 'completed', conflict },
    'system',
    'reconciled-payment',
    'Reconciliation found succeeded payment ' + state.serverPayment.paymentId + '.',
    conflict,
  );
}

export function resolveConflict(state, resolution) {
  if (!state.serverPayment || !state.conflict) return state;

  if (resolution === 'acknowledge') {
    return event(
      { ...state, conflict: null },
      'human',
      'payment-acknowledged',
      'Human acknowledged the completed payment without changing the corrected draft.',
    );
  }

  if (resolution === 'refund') {
    const next = {
      ...state,
      serverPayment: { ...state.serverPayment, status: 'refunded' },
      conflict: null,
    };
    return event(next, 'human', 'payment-refunded', 'A separate refund operation completed.');
  }

  if (resolution === 'continue') {
    return event(
      { ...state, conflict: null },
      'human',
      'draft-continued',
      'Human kept the $120 draft. The completed $1,200 payment remains visible in processor state.',
    );
  }

  throw new Error('Unsupported resolution: ' + resolution);
}

export function resetState(state) {
  return createInitialState(state.mode);
}

export const DEMO_AMOUNTS = { ORIGINAL_AMOUNT_CENTS, CORRECTED_AMOUNT_CENTS };
