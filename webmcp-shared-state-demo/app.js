import {
  abortOperation,
  changeDraftAmount,
  commitServerPayment,
  createInitialState,
  formatMoney,
  receiveOperationResult,
  reconcileServerState,
  resetState,
  resolveConflict,
  setMode,
  startOperation,
} from './state.js';
import { createPayInvoiceTool, registerPayInvoiceTool } from './webmcp.js';

const elements = {
  apiStatus: document.querySelector('#api-status'),
  modeInputs: [...document.querySelectorAll('input[name="mode"]')],
  scenarioInputs: [...document.querySelectorAll('input[name="scenario"]')],
  instruction: document.querySelector('#instruction'),
  amountButtons: [...document.querySelectorAll('.amount-option')],
  visibleDraft: document.querySelector('#visible-draft'),
  pageRevision: document.querySelector('#page-revision'),
  manualPay: document.querySelector('#manual-pay-button'),
  operationStatus: document.querySelector('#operation-status'),
  capturedIntent: document.querySelector('#captured-intent'),
  serverState: document.querySelector('#server-state'),
  countdown: document.querySelector('#countdown'),
  countdownCopy: document.querySelector('#countdown-copy'),
  conflictCard: document.querySelector('#conflict-card'),
  conflictKicker: document.querySelector('#conflict-kicker'),
  conflictTitle: document.querySelector('#conflict-title'),
  conflictCopy: document.querySelector('#conflict-copy'),
  conflictActions: document.querySelector('#conflict-actions'),
  reconcileButton: document.querySelector('#reconcile-button'),
  agentButton: document.querySelector('#agent-button'),
  stopButton: document.querySelector('#stop-button'),
  resetButton: document.querySelector('#reset-button'),
  timeline: document.querySelector('#timeline'),
  eventCount: document.querySelector('#event-count'),
  liveRegion: document.querySelector('#live-region'),
};

let state = createInitialState('unsafe');
let scenario = 'race';
let activeRun = null;
let registration = null;
let announcedEventCount = state.events.length;

function formatIntent(intent) {
  if (!intent) return 'No operation yet';
  return [
    'operation: ' + intent.operationId,
    'invoice:   ' + intent.invoiceId,
    'amount:    ' + formatMoney(intent.amountCents, intent.currency),
    'revision:  ' + intent.pageRevision,
  ].join('\n');
}

function formatServer(payment) {
  if (!payment) return 'No payment';
  return [
    'payment: ' + payment.paymentId,
    'invoice: ' + payment.invoiceId,
    'amount:  ' + formatMoney(payment.amountCents, payment.currency),
    'status:  ' + payment.status,
  ].join('\n');
}

function conflictContent(conflict) {
  if (!conflict) return null;

  if (conflict.type === 'uncoordinated-result') {
    return {
      kind: 'unsafe',
      kicker: 'Uncoordinated result',
      title: 'The page is wrong by $1,080',
      copy: 'The human corrected the draft to ' + formatMoney(conflict.currentAmountCents) + ', but the processor completed ' + formatMoney(conflict.capturedAmountCents) + '. The old intent became real money.',
      showActions: false,
    };
  }

  if (conflict.type === 'unknown-after-abort') {
    return {
      kind: 'unsafe',
      kicker: 'Outcome unknown',
      title: 'Stopping the client did not stop the payment',
      copy: 'The local call was aborted after the commit point. Check processor state before retrying or telling the user that payment failed.',
      showActions: false,
    };
  }

  if (conflict.type === 'revision-conflict' || conflict.type === 'reconciled-after-abort') {
    return {
      kind: 'coordinated',
      kicker: conflict.type === 'revision-conflict' ? 'Revision conflict detected' : 'Payment state reconciled',
      title: 'The agent paid ' + formatMoney(conflict.capturedAmountCents),
      copy: 'Your current draft is ' + formatMoney(conflict.currentAmountCents) + '. The succeeded payment was not hidden or written over the corrected draft. Refunding it is a separate operation.',
      showActions: true,
    };
  }

  return null;
}

function renderTimeline() {
  elements.timeline.replaceChildren();
  for (const item of state.events) {
    const row = document.createElement('li');
    row.dataset.actor = item.actor;
    const label = document.createElement('strong');
    label.textContent = 'T' + (item.sequence - 1) + ' ' + item.actor;
    row.append(label, document.createElement('br'), item.message);
    elements.timeline.append(row);
  }
  elements.timeline.scrollTop = elements.timeline.scrollHeight;
  elements.eventCount.textContent = state.events.length + (state.events.length === 1 ? ' event' : ' events');
}

function render() {
  for (const button of elements.amountButtons) {
    button.setAttribute(
      'aria-pressed',
      String(Number(button.dataset.amountCents) === state.draft.amountCents),
    );
  }

  elements.visibleDraft.textContent = formatMoney(state.draft.amountCents, state.draft.currency);
  elements.pageRevision.textContent = state.pageRevision;
  elements.operationStatus.textContent = state.operationStatus;
  elements.operationStatus.dataset.status = state.operationStatus;
  elements.capturedIntent.textContent = formatIntent(state.capturedIntent);
  elements.serverState.textContent = formatServer(state.serverPayment);

  const pending = state.operationStatus === 'pending';
  const unknown = state.operationStatus === 'unknown';
  elements.agentButton.disabled = pending;
  elements.manualPay.disabled = pending;
  elements.stopButton.disabled = !pending;
  elements.reconcileButton.hidden = !unknown;

  for (const input of [...elements.modeInputs, ...elements.scenarioInputs]) {
    input.disabled = pending;
  }

  const content = conflictContent(state.conflict);
  elements.conflictCard.hidden = !content;
  if (content) {
    elements.conflictCard.dataset.kind = content.kind;
    elements.conflictKicker.textContent = content.kicker;
    elements.conflictTitle.textContent = content.title;
    elements.conflictCopy.textContent = content.copy;
    elements.conflictActions.hidden = !content.showActions;
  }

  if (state.events.length > announcedEventCount) {
    elements.liveRegion.textContent = state.events.at(-1).message;
    announcedEventCount = state.events.length;
  }

  renderTimeline();
}

function clearRunTimers() {
  if (!activeRun) return;
  clearTimeout(activeRun.commitTimer);
  clearTimeout(activeRun.responseTimer);
  clearInterval(activeRun.countdownTimer);
  elements.countdown.hidden = true;
}

function finishRun() {
  clearRunTimers();
  activeRun = null;
  render();
}

function updateCountdown(deadline) {
  const remaining = Math.max(0, deadline - performance.now());
  elements.countdownCopy.textContent = 'Processor response in ' + (remaining / 1000).toFixed(1) + 's';
}

function buildInput(initiator) {
  return {
    operationId: crypto.randomUUID().slice(0, 8),
    initiator,
    invoiceId: state.draft.invoiceId,
    amountCents: state.draft.amountCents,
    currency: state.draft.currency,
  };
}

async function executePayInvoice(input, context = {}) {
  const signal = context.signal;
  state = startOperation(state, input);
  render();

  const commitDelay = scenario === 'abort' ? 1200 : 2200;
  const responseDelay = scenario === 'abort' ? 3600 : 3000;
  const deadline = performance.now() + responseDelay;
  elements.countdown.hidden = false;
  updateCountdown(deadline);

  return new Promise((resolve, reject) => {
    const commitTimer = setTimeout(() => {
      state = commitServerPayment(state);
      if (scenario === 'abort') {
        elements.instruction.textContent = 'Processor committed. Press Stop before the response reaches the page.';
      }
      render();
    }, commitDelay);

    const responseTimer = setTimeout(() => {
      state = receiveOperationResult(state);
      const result = state.serverPayment;
      finishRun();
      if (state.conflict) elements.conflictCard.focus();
      resolve(result);
    }, responseDelay);

    const countdownTimer = setInterval(() => updateCountdown(deadline), 100);
    activeRun = { commitTimer, responseTimer, countdownTimer, signal };

    signal?.addEventListener('abort', () => {
      const committed = Boolean(state.serverPayment);
      clearTimeout(responseTimer);
      clearInterval(countdownTimer);
      if (!committed) clearTimeout(commitTimer);
      state = abortOperation(state);
      activeRun = null;
      elements.countdown.hidden = true;
      render();
      if (state.conflict) elements.conflictCard.focus();
      reject(new DOMException('Operation aborted', 'AbortError'));
    }, { once: true });
  });
}

const payInvoiceTool = createPayInvoiceTool(executePayInvoice);

async function runPayment(initiator) {
  const controller = new AbortController();
  const input = buildInput(initiator);
  elements.instruction.textContent = scenario === 'race'
    ? 'Now correct the amount to $120 before the response arrives.'
    : 'Wait for processor commit, then press Stop before the response arrives.';

  const promise = payInvoiceTool.execute(input, { signal: controller.signal });
  if (activeRun) activeRun.controller = controller;

  try {
    await promise;
  } catch (error) {
    if (error.name !== 'AbortError') throw error;
  }
}

elements.agentButton.addEventListener('click', () => runPayment('agent'));
elements.manualPay.addEventListener('click', () => runPayment('human'));

elements.stopButton.addEventListener('click', () => {
  activeRun?.controller?.abort();
});

elements.resetButton.addEventListener('click', () => {
  clearRunTimers();
  activeRun = null;
  state = resetState(state);
  announcedEventCount = state.events.length;
  elements.countdown.hidden = true;
  elements.instruction.textContent = scenario === 'race'
    ? 'Start the agent, then correct the amount to $120 while the request is running.'
    : 'Start the agent, wait for processor commit, then press Stop.';
  render();
});

for (const button of elements.amountButtons) {
  button.addEventListener('click', () => {
    state = changeDraftAmount(state, Number(button.dataset.amountCents));
    render();
  });
}

for (const input of elements.modeInputs) {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    state = setMode(state, input.value);
    announcedEventCount = state.events.length;
    render();
  });
}

for (const input of elements.scenarioInputs) {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    scenario = input.value;
    state = resetState(state);
    announcedEventCount = state.events.length;
    elements.instruction.textContent = scenario === 'race'
      ? 'Start the agent, then correct the amount to $120 while the request is running.'
      : 'Start the agent, wait for processor commit, then press Stop.';
    render();
  });
}

elements.reconcileButton.addEventListener('click', () => {
  state = reconcileServerState(state);
  render();
  elements.conflictCard.focus();
});

elements.conflictActions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-resolution]');
  if (!button) return;
  state = resolveConflict(state, button.dataset.resolution);
  render();
});

registration = await registerPayInvoiceTool(payInvoiceTool);
elements.apiStatus.textContent = registration.message;
elements.apiStatus.dataset.mode = registration.mode;

window.addEventListener('beforeunload', () => {
  registration?.cleanup();
  clearRunTimers();
});

render();
