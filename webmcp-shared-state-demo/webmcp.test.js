import test from 'node:test';
import assert from 'node:assert/strict';

import { createPayInvoiceTool, registerPayInvoiceTool } from './webmcp.js';

test('tool descriptor uses the current WebMCP shape', () => {
  const execute = () => 'ok';
  const tool = createPayInvoiceTool(execute);

  assert.equal(tool.name, 'payInvoice');
  assert.equal(tool.execute, execute);
  assert.equal(tool.annotations.consequentialHint, true);
  assert.deepEqual(tool.inputSchema.required, [
    'invoiceId',
    'amountCents',
    'currency',
  ]);
  assert.equal(tool.inputSchema.properties.amountCents.type, 'integer');
});

test('missing modelContext uses deterministic simulator', async () => {
  const tool = createPayInvoiceTool(() => 'ok');
  const registration = await registerPayInvoiceTool(tool, undefined);

  assert.equal(registration.mode, 'simulator');
  assert.match(registration.message, /API unavailable/);
});

test('available modelContext registers the shared descriptor', async () => {
  const calls = [];
  const modelContext = {
    async registerTool(tool, options) {
      calls.push({ tool, options });
    },
  };
  const tool = createPayInvoiceTool(() => 'ok');
  const registration = await registerPayInvoiceTool(tool, modelContext);

  assert.equal(registration.mode, 'native');
  assert.equal(calls[0].tool, tool);
  assert.ok(calls[0].options.signal instanceof AbortSignal);

  registration.cleanup();
  assert.equal(calls[0].options.signal.aborted, true);
});

test('registration failure falls back without throwing', async () => {
  const modelContext = {
    async registerTool() {
      throw new Error('origin trial unavailable');
    },
  };
  const registration = await registerPayInvoiceTool(
    createPayInvoiceTool(() => 'ok'),
    modelContext,
  );

  assert.equal(registration.mode, 'simulator');
  assert.match(registration.message, /origin trial unavailable/);
});
