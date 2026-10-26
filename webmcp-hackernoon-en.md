---
title: "WebMCP Gives Your Web App a Second Operator. Who Owns the State?"
subtitle: "A $1,200 payment race shows why agent-ready frontends need revisions, idempotency, reconciliation, and honest rollback semantics."
description: "What happens when a WebMCP agent pays $1,200 while the user corrects the invoice to $120? The hard part is no longer tool discovery. It is shared state."
tldr: "WebMCP tools run inside a live page while the person can still edit it. Treat every state-changing tool as a concurrent operation: freeze intent, version state, make retries idempotent, distinguish cancellation from reversal, and reconcile unknown outcomes."
slug: "webmcp-gives-your-web-app-a-second-operator"
tags:
  - webmcp
  - ai-agents
  - frontend-development
  - fintech
  - distributed-systems
  - web-development
  - software-architecture
  - user-experience
cover_alt: "A human corrects an invoice to $120 while an AI agent completes the earlier $1,200 payment, creating a conflict between page state and processor truth."
demo_url: "https://shmakovdima.github.io/webmcp-browser-benchmark/"
---

# WebMCP Gives Your Web App a Second Operator. Who Owns the State?

A user asks a browser agent to pay a $1,200 invoice. The agent calls a payment tool. While the request is in flight, the user spots an extra zero and corrects the amount to $120.

Too late. The processor has already accepted $1,200.

The screen now says $120. The real payment says $1,200. Both values are honest in their own way: one is the person's current intent; the other is money that has already moved.

Which one should the interface display?

That question matters more than whether the agent can find the Pay button. WebMCP removes much of that visual work in the first place. Instead of spending tokens and time on screenshots, element detection, clicks, and repeated checks, an agent receives a compact structured contract. Good. But a fast, precise function call creates a less obvious problem: the page now has two operators.

## WebMCP in 40 seconds

[WebMCP](https://developer.chrome.com/docs/ai/webmcp/imperative-api) is an experimental browser API through which an open page can publish tools for an AI agent. A tool has a name, a description, a JSON Schema for its arguments, and a JavaScript execution function.

An invoice page might register `payInvoice`:

```js
await document.modelContext.registerTool({
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
  execute: payInvoice,
});
```

A compatible agent can invoke that tool directly. It does not have to infer what each button means or whether the latest render moved it. The tool still runs inside the live page, with access to the current session and application state, and it can update the same UI the person has open.

`consequentialHint` tells a client that an action carries serious consequences. It is not a security boundary. [Chrome's security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) describes annotations as hints, which leaves authorization, confirmation, amount validation, and duplicate protection with the application and its backend.

WebMCP is not a widely available web standard yet. Its architectural consequence is already clear, though: the person can keep editing while the agent's tool call is running.

## The form no longer has one author

Most frontend flows quietly assume a single author of intent. A user changes an amount, presses Pay, and receives a result. Promises, caches, and optimistic updates may run underneath, but the meaningful sequence still comes from one person.

WebMCP breaks that sequence. An agent can begin an action while the person edits the same field, navigates away, signs out, or manually launches the same operation.

The frontend has become a concurrent system. The second author is not in another browser or an isolated headless session. It is operating in the same tab, under the same session, against the same business objects.

Calling this a race condition is accurate but incomplete. Two callbacks are not merely racing. Two intentions are.

## The first four races

### 1. Stale intent

The agent reads $1,200 and begins the payment. The user corrects the amount to $120 before the call finishes. The result is valid for revision 41 and wrong for the current revision 42.

Apply the late result blindly and the interface rolls backward. Ignore it and the page hides a payment that actually happened.

### 2. A late response creates a false picture

The UI shows the corrected $120 draft. One second later, success arrives for the old $1,200 payment. A component may render a green "Paid" badge beside the current amount even though processor truth belongs to a different version.

The bug is not simply that one response was slow. The application lost the link between a result and the intent that produced it.

### 3. One effect happens twice

The person clicks Pay while the agent invokes `payInvoice`. Both requests are valid. Disabling the button after a click does not help because the agent never has to touch it.

The backend needs to recognize that both requests refer to one operation. That requires a stable operation ID or idempotency key. Stripe, for example, returns the stored result for a repeated request carrying the same idempotency key rather than performing the effect again. This prevents duplication. It does not detect that the amount is stale.

### 4. Stop arrives after commit

The user stops the agent. `AbortSignal` ends the JavaScript wait or aborts `fetch`, but the processor has already accepted the payment. The local operation looks stopped; the server-side operation is complete.

Stopping a wait does not return money. Once a payment succeeds, reversing it is usually a separate refund with its own status and failure modes.

All four races point to the same missing fact: which version of human intent does this effect belong to?

## Watch the truth split

![A user corrects an invoice to $120 while a WebMCP tool completes the earlier $1,200 payment](webmcp-shared-state-demo/assets/webmcp-shared-state-demo.gif)

The demo is synthetic. It sends no money and talks to no payment provider. It shows one controlled interleaving: `payInvoice` captures $1,200, the person changes the draft to $120, and a fake processor completes the older payment.

> [Try the interactive WebMCP payment-race demo](https://shmakovdima.github.io/webmcp-browser-benchmark/): change the amount while `payInvoice` is running, then compare an uncoordinated result with revision-aware reconciliation.

The timeline is short:

```text
T0  Agent reads: $1,200, revision 41
T1  Agent starts payInvoice($1,200)
T2  Human corrects the draft: $120, revision 42
T3  Processor commits: $1,200 succeeded
T4  Result reaches a page that now shows $120
```

At T4, "show the latest value" and "show the server value" are both wrong policies. The application must preserve two facts: the current draft is $120, and a $1,200 payment has succeeded.

## Capture intent before the first await

A tool should not keep reading mutable UI state while it runs. The amount might come from one store revision, the invoice ID from another, and the selected invoice may change before the request leaves the page.

Capture an immutable intent before the first `await`:

```js
const intent = {
  operationId: crypto.randomUUID(),
  pageRevision: paymentStore.revision,
  invoiceId: paymentStore.invoiceId,
  amountCents: paymentStore.amountCents,
  currency: paymentStore.currency,
};
```

This snapshot does not replace authorization or server-side validation. It answers a narrower question: which page state produced the request?

A complete WebMCP callback could look like this:

```js
async function payInvoice(input, { signal }) {
  const intent = paymentStore.captureIntent(input);
  paymentStore.markPending(intent);

  try {
    const result = await paymentApi.pay({
      invoiceId: intent.invoiceId,
      amountCents: intent.amountCents,
      currency: intent.currency,
      operationId: intent.operationId,
      expectedRevision: intent.serverRevision,
    }, { signal });

    paymentStore.reconcile(intent, result);
    return result;
  } catch (error) {
    paymentStore.reconcileFailure(intent, error);
    throw error;
  }
}
```

When the response returns, `reconcile` compares the captured revision with the current one. If the person changed the amount, the callback does not overwrite the new draft. It records the server effect separately and opens a conflict.

## Idempotency keys and revisions answer different questions

They are easy to conflate because both values travel with a write request.

`operationId` asks: "Have we already performed this intent?" A retry after a timeout should return the previous result, not move money again. [Stripe recommends idempotency keys](https://docs.stripe.com/api/idempotent_requests) for exactly this kind of safe retry.

`expectedRevision` asks: "Is this intent still based on current data?" A request can have a brand-new operation ID and still be stale.

You need both:

```text
same operationId + retry       -> return the existing payment
new operationId + old revision -> reject or surface a conflict
```

Idempotency without revision reliably repeats the wrong amount. Revision checking without idempotency can create the right payment twice.

## Three coordination models

Merge is almost never meaningful for a payment. You cannot average $1,200 and $120 or splice them together. That leaves three practical models.

### A short lock

Once the person confirms an amount, the application briefly locks editing and shows who is executing the payment. This is easy to reason about and works for a short commit. If the provider is slow, the agent appears to have seized the page.

### Optimistic concurrency

The person keeps editing. Every state-changing call includes the revision it was based on. The server or client coordinator rejects a stale write and surfaces a conflict.

This is a useful default for editable entities. It cannot reverse an effect that an external system has already completed, so reconciliation still matters.

### Prepare and commit

The agent calls `preparePayment` first. The server returns a proposal containing a frozen invoice ID, recipient, amount, currency, and expiration. The page shows that exact proposal to the person. A separate `confirmPayment(proposalId)` creates the financial effect.

This design separates assistance from authority. The agent can find an invoice, normalize fields, and prepare the payment without gaining room to mutate the amount at commit time.

For high-stakes actions, that is often more honest than one oversized `payInvoice`.

## A confirmation dialog does not repair stale intent

"Confirm payment?" is useless if the modal displays the current draft while the backend is about to execute a captured intent.

The confirmation must show the frozen version: invoice, recipient, exact amount and currency, masked payment source, initiator, proposal expiry, and the effect of pressing Confirm.

There is another awkward detail. `consequentialHint: true` does not guarantee that every client will present the confirmation your product needs. Critical review belongs in product-controlled UI and at the server boundary.

## Abort, cancel, and refund are different operations

A payment call has at least three possible outcomes:

1. The server definitely did not start it.
2. The payment completed and the client received the result.
3. The client stopped waiting and does not know what happened.

The third state is not `failed`. If the connection drops after commit, a blind retry can create another effect without correct idempotency. Rolling the local store back only hides the uncertainty.

Display `unknown`, then query processor truth by operation ID. If a payment is `succeeded`, returning the money requires a refund. In [Stripe's PaymentIntent lifecycle](https://docs.stripe.com/payments/paymentintents/lifecycle), `succeeded` means the payment flow is complete; refunds are handled separately. That is a concrete provider example, not a universal payment specification.

An Undo button may launch a refund. It should not pretend to rewind time.

## Test event order without an LLM

Shared-state correctness does not require a model. Control the promises and test different interleavings:

```js
it('keeps the corrected draft after an older payment succeeds', async () => {
  const payment = tool.payInvoice({
    invoiceId: 'inv-2048',
    amountCents: 120000,
    currency: 'USD',
  });

  ui.changeAmount(12000);
  processor.resolve({ paymentId: 'pay-7', status: 'succeeded' });

  await payment;

  expect(ui.draft.amountCents).toBe(12000);
  expect(ui.serverPayment.amountCents).toBe(120000);
  expect(ui.conflict.type).toBe('revision-conflict');
});
```

Add abort before commit, abort after commit, a repeated operation ID, a new operation ID with an old revision, logout during execution, and navigation to another invoice. LLM evals still matter for tool selection and conflict handling. State integrity should pass ordinary deterministic tests first.

## Measure the cost of collaboration

Tool-call volume says little about whether the agent is helping. Better signals include conflicts with newer human actions, late responses rejected from the draft, retries absorbed by idempotency, time spent in `unknown`, immediate refunds after agent payments, and full UI-to-processor reconciliations.

These numbers are not a universal benchmark. They tell you whether the agent is collaborating with the person or merely producing expensive divergence faster.

## Production checklist

Before publishing a state-changing WebMCP tool, verify that:

- intent is captured before the first `await`;
- the operation has a stable ID and the mutable entity has a revision;
- the server rechecks authorization, amount, currency, and invoice state;
- a late response cannot overwrite a newer human draft;
- the UI displays draft, pending operation, and server truth separately;
- Stop is not presented as rollback of a committed effect;
- an `unknown` outcome has a status lookup and reconciliation path;
- retries are safe while a fresh stale intent is rejected;
- a high-stakes flow is split into prepare and commit when review is required;
- tests permute human, agent, and server event order.

If one item has no answer, the tool is not ready to control money.

## The tab is now a shared workspace

WebMCP gives an agent a shorter path to action: fewer screenshots, fewer clicks, fewer tokens, and less time wasted on visual recovery. That is a solid reason to publish structured tools.

Efficiency is not correctness.

Once an agent can change data inside a live page, the frontend has a second author. In a payment flow, the old intent does not disappear after a new render. It may already be sitting at the processor.

Design every state-changing WebMCP tool as a concurrent transaction, not a remote click. When the screen says $120 after a $1,200 payment, the interface must preserve both truths until the person explicitly decides what happens next.

---

## Primary technical sources

1. [Chrome for Developers: Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) - current `document.modelContext.registerTool()`, `AbortSignal`, execution cancellation, and annotations.
2. [Chrome for Developers: WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) - UI synchronization, runtime validation, registration lifecycle, and reliability guidance.
3. [Chrome for Developers: WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools) - `consequentialHint`, trust boundaries, confirmation, and input validation.
4. [WebMCP API Proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) - browsing-context execution, UI synchronization, and interleaving tool calls with human input. The article uses the current `document.modelContext` name.
5. [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests) - safe retries of state-changing requests with an idempotency key.
6. [Stripe: PaymentIntent lifecycle](https://docs.stripe.com/payments/paymentintents/lifecycle) - payment states, cancellation limits, and separate refunds after successful payment.
