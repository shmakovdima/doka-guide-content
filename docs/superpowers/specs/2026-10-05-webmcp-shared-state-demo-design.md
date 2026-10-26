# WebMCP payment-race demo design

Date: 2026-10-06

## Purpose

The demo supports the HackerNoon article "WebMCP Gives Your Web App a Second Operator. Who Owns the State?"

It demonstrates a narrow concurrency failure:

1. A WebMCP tool captures an invoice payment for $1,200 at page revision 41.
2. The human corrects the visible draft to $120, creating revision 42.
3. A fake payment processor completes the captured $1,200 operation.
4. The result returns to a page that now displays $120.

The page must preserve both facts. The $120 draft is the latest human intent. The $1,200 payment is processor truth.

## Non-goals

- No real payment provider, bank account, card data, API key, or funds.
- No claim that WebMCP provides transaction isolation.
- No LLM dependency.
- No production Stripe integration.
- No attempt to model a complete accounting ledger.

## Layout

The desktop layout has three panels:

1. Human UI
   - synthetic invoice `inv-2048` from Atlas Cloud;
   - original amount $1,200;
   - corrected amount $120;
   - visible draft and page revision;
   - manual payment trigger.
2. Shared state
   - immutable captured intent;
   - processor truth;
   - operation status;
   - conflict or unknown-outcome resolution.
3. Agent activity
   - registered WebMCP tool `payInvoice`;
   - agent trigger and Stop;
   - deterministic event timeline.

The layout stacks without horizontal overflow at 390px.

## Modes

### Unsafe: no coordination

The tool captures $1,200. The human changes the draft to $120. When the old payment succeeds, the page exposes an unresolved mismatch.

Expected state:

```text
visible draft:   $120
page revision:   42
processor truth: $1,200 succeeded
conflict:        uncoordinated result
```

### Coordinated: revision + reconciliation

The same interleaving occurs, but the result is compared with the captured revision. The corrected draft is preserved, the succeeded payment remains visible, and the user receives explicit choices:

- acknowledge the $1,200 payment;
- start a separate $1,200 refund;
- continue editing the $120 draft.

The refund is a new state transition. It is not represented as rollback.

## Abort-after-commit scenario

1. The fake processor commits $1,200.
2. The page has not received the result yet.
3. The user presses Stop.
4. Local waiting ends and status becomes `unknown`.
5. `Check payment status` reconciles by operation ID.
6. The UI discovers the succeeded payment.

## WebMCP descriptor

```js
{
  name: 'payInvoice',
  description: 'Pay a reviewed invoice for an exact amount.',
  inputSchema: {
    type: 'object',
    properties: {
      invoiceId: { type: 'string' },
      amountCents: { type: 'integer', minimum: 1 },
      currency: { type: 'string', enum: ['USD'] },
    },
    required: ['invoiceId', 'amountCents', 'currency'],
  },
  annotations: {
    consequentialHint: true,
  },
  execute: executePayInvoice,
}
```

The page registers this descriptor through the current `document.modelContext.registerTool()` API when available. The public controls invoke the same descriptor through a deterministic simulator when it is unavailable.

## State model

```text
mode
pageRevision
draft {
  invoiceId
  vendor
  amountCents
  currency
}
capturedIntent {
  operationId
  initiator
  pageRevision
  invoiceId
  amountCents
  currency
}
serverPayment {
  paymentId
  operationId
  invoiceId
  amountCents
  currency
  status
}
operationStatus
conflict
completedOperationIds
events
```

## Publication sequence

The 11-second recording shows:

1. unsafe mode;
2. agent captures $1,200;
3. human corrects the amount to $120;
4. fake processor succeeds with $1,200;
5. reset;
6. coordinated mode;
7. the same race;
8. revision conflict with explicit resolution.

## Acceptance criteria

- Native and simulator paths share one tool descriptor and execute function.
- Unit tests cover revision changes, stale results, duplicate operation IDs, abort timing, reconciliation, and refund.
- Browser tests cover both modes, refund, abort after commit, and mobile overflow.
- The screenshot, WebM, MP4, and GIF all show the payment scenario.
- The demo is self-contained in `webmcp-shared-state-demo/` for later extraction to a standalone repository.
