export function createPayInvoiceTool(executePayInvoice) {
  if (typeof executePayInvoice !== 'function') {
    throw new TypeError('executePayInvoice must be a function.');
  }

  return {
    name: 'payInvoice',
    description: 'Pay a reviewed invoice for an exact amount.',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'Stable identifier of the invoice to pay.',
        },
        amountCents: {
          type: 'integer',
          minimum: 1,
          description: 'Exact payment amount in minor currency units.',
        },
        currency: {
          type: 'string',
          enum: ['USD'],
          description: 'ISO 4217 payment currency.',
        },
      },
      required: ['invoiceId', 'amountCents', 'currency'],
    },
    annotations: {
      consequentialHint: true,
    },
    execute: executePayInvoice,
  };
}

export async function registerPayInvoiceTool(tool, modelContext = globalThis.document?.modelContext) {
  if (!modelContext?.registerTool) {
    return {
      mode: 'simulator',
      message: 'WebMCP API unavailable: deterministic simulator',
      cleanup() {},
    };
  }

  const controller = new AbortController();

  try {
    await modelContext.registerTool(tool, { signal: controller.signal });
    return {
      mode: 'native',
      message: 'WebMCP API detected: native tool registered',
      cleanup: () => controller.abort(),
    };
  } catch (error) {
    controller.abort();
    return {
      mode: 'simulator',
      message: 'WebMCP registration failed: deterministic simulator (' + error.message + ')',
      cleanup() {},
    };
  }
}
