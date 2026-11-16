---
title: "One Store, Three Agents, Three Interfaces: What WebMCP Actually Saves"
subtitle: "We ran one synthetic shop through WebMCP, Playwright MCP, and raw DOM control. WebMCP used 52% to 97% fewer tokens in every run."
description: "A reproducible browser-agent benchmark: five ecommerce tasks, three interfaces, three agents plus a scripted replay. WebMCP needed far fewer tokens and tool calls than Playwright MCP or DOM control. Here are the numbers and the method."
tldr: "We gave Codex, Claude Opus 5.5, Nemotron 3 Ultra, and a scripted flow the same five shopping tasks through WebMCP, Playwright MCP, and DOM control. WebMCP was the cheapest interface on every task in every run: 52-94% fewer tokens than Playwright MCP and 69-97% fewer than DOM. The models stayed the same; they just no longer had to work out the store from its UI."
slug: "one-store-three-agents-three-interfaces-what-webmcp-saves"
tags:
  - webmcp
  - ai-agents
  - browser-automation
  - benchmarks
  - mcp
  - web-development
  - frontend-development
  - llms
cover_alt: "One online store shown three ways: a long DOM dump, an accessibility tree with element references, and five short WebMCP tool calls."
demo_url: "https://shmakovdima.github.io/webmcp-browser-benchmark/"
repo_url: "https://github.com/shmakovdima/webmcp-browser-benchmark"
---

Here is a boring task: find the cheapest in-stock noise-cancelling headphones under $200, put two black pairs in the cart, and place a test order.

A person does this in a couple of minutes. A browser agent without help has to rebuild the store from what it can see. It reads the page, finds the filters, opens a product card, tells the sale price from the crossed-out one, picks a color, checks the cart, and walks through checkout. After every click it asks the browser what changed and reads the answer.

WebMCP lets the page skip that step. The store publishes its actions as tools with names, descriptions, and JSON Schema arguments, and the agent calls them directly. We wanted to know how much work that removes in practice, so we built a small benchmark and ran it with three different agents and one scripted replay.

WebMCP came out cheapest on every task, in every run. How much cheaper depends on the agent and on how you count, so the runs are shown separately below.

## The setup

The benchmark targets Northstar Store, a local synthetic shop with a catalog, category and feature filters, product pages, a cart, and a checkout that creates a test order and never touches a payment provider. Every attempt starts from a fresh seeded store. Two oracles check each result: one reads the backend state (what is actually in the cart, which order exists), the other checks the agent's final answer. A confident summary on top of a wrong cart counts as a failure.

There are five tasks:

- T1: find the cheapest in-stock noise-cancelling headphones under $200;
- T2: put two black pairs of the right model in the cart and check it;
- T3: complete one test order;
- T4: compare two eligible products;
- T5: change a multi-line cart, then complete a test order.

Each task runs through three interfaces to the same store:

- WebMCP: Chrome's native WebMCP host and five tools registered by the page through `document.modelContext`;
- Playwright MCP: the official `@playwright/mcp` server, limited to navigation, accessibility snapshots, `browser_find`, clicks, typing, selects, and key presses. Screenshots and script evaluation are filtered out, and the server starts with `--no-webmcp` so this arm cannot use the page's tools;
- DOM: a rendered-DOM interface in isolated Chrome. The agent gets visible HTML (scripts, styles, hidden elements, and SVG internals stripped) plus CSS-selector clicks, typing, dropdowns, keys, and scrolling. The adapter contains no task logic.

The catalog, the cart rules, the backend, and the oracles are identical across all three. Only the description of the store's capabilities changes.

This is the whole WebMCP surface the agents saw:

```text
search_products    text, category, price, tags, stock    readOnlyHint: true
get_product        full details from the product page    readOnlyHint: true
set_cart_item      { productId, color, quantity }         readOnlyHint: false
get_cart           lines, subtotal, shipping, total       readOnlyHint: true
place_test_order   synthetic order, no payment           consequentialHint: true
```

Five tools cover all five tasks.

## Four runs, four ways of counting

We have four complete T1-T5 matrices. They were measured differently, so I'll keep them apart and avoid adding them up.

### Nemotron 3 Ultra: provider-billed tokens

`nvidia/Nemotron-3-Ultra-550b` through the Nebius Token Factory endpoint. The provider reported the token counts. All 15 cells passed both oracles.

| Interface      | Total tokens, T1-T5 | Tool calls | vs WebMCP                    |
| -------------- | ------------------: | ---------: | ---------------------------- |
| WebMCP         |              31,359 |         15 | -                            |
| Playwright MCP |             515,154 |         57 | WebMCP used 94% fewer tokens |
| DOM            |           1,005,545 |         97 | WebMCP used 97% fewer tokens |

The biggest gap is on T5, the multi-line cart edit: 14,499 tokens and 7 tool calls with WebMCP, 318,418 tokens and 22 calls with Playwright MCP, and 529,806 tokens and 46 calls with DOM. Every extra step means re-reading a bigger page, so the cost grows faster than the number of steps.

### Codex (gpt-5.6-terra): provider-reported, full agent overhead

These totals include everything Codex sends on every turn, its own instructions and tool context included. That fixed overhead is large. The single-call WebMCP run of T1 still came to about 47,000 tokens, so the ratios here are compressed.

| Interface      | Total tokens, T1-T5 | Tool calls |    Time |
| -------------- | ------------------: | ---------: | ------: |
| WebMCP         |             365,517 |         21 |  89.9 s |
| Playwright MCP |           1,033,416 |         62 | 274.5 s |
| DOM            |           1,183,765 |         72 | 349.7 s |

Even with that overhead, WebMCP used 65% fewer tokens than Playwright MCP and 69% fewer than DOM, and finished in about a third of the time.

### Claude Opus 5.5: agent-driven self-run, tokenized

Claude chose and issued every tool call itself, through the same MCP servers and tool allowlists as the scored runs. No provider billing was involved: we tokenized everything the agent saw (tool schemas plus every observation) and its final answer with `o200k_base`. Every call is counted, including opening the page and discovering the WebMCP tools.

| Interface      | Tokens, T1-T5 | Tool calls | Tool handler time |
| -------------- | ------------: | ---------: | ----------------: |
| WebMCP         |         7,289 |         24 |            31.5 s |
| Playwright MCP |        15,187 |         56 |           113.1 s |
| DOM            |        28,720 |         52 |            17.4 s |

That is 52% fewer tokens than Playwright MCP and 75% fewer than DOM, the smallest gap of the four. Claude was frugal with Playwright MCP. In the run we kept, it used `browser_find` and scoped snapshots instead of reading the whole accessibility tree. An earlier T1 attempt read the full snapshot, which alone was 4,780 tokens, and spent 6,899 tokens on a task that WebMCP finished in 1,380. The agent's habits move these numbers a lot.

Look at the time column too. DOM was the fastest interface here, because dumping HTML and clicking a selector is cheap for the browser. The cost of DOM control lands in the context window, not in the handler. This column measures tool execution only and leaves out model latency, so it does not tell you how long a real user would wait.

### Scripted flow: the lower bound

One more matrix replays a fixed, oracle-checked sequence of calls for each interface and tokenizes the exchanges with `o200k_base`. No model makes decisions, so it shows roughly the minimum context each interface needs for the same scenario.

| Interface      | Tokens, T1-T5 | Tool calls |
| -------------- | ------------: | ---------: |
| WebMCP         |         4,623 |         15 |
| Playwright MCP |        27,272 |         81 |
| DOM            |        48,330 |         76 |

83% and 90% fewer tokens. In this replay a single WebMCP call finished T1 and T4. The other interfaces needed 6 to 12 calls for the same tasks.

### What the four have in common

The absolute numbers differ by more than two orders of magnitude, because they count different things. The order is the same in all four: WebMCP is cheapest on every one of the five tasks, then Playwright MCP, then DOM. Tool calls follow the same pattern. WebMCP needed between 15 and 24 calls for the full suite, and the other interfaces needed between 52 and 97.

## Where the tokens go

With DOM or Playwright MCP, the agent has two jobs. It has to work out what the interface means (this element is the price filter, that button adds the black variant, this counter is the cart) and then decide what to do. The first job costs tokens on every turn, because the agent has to re-read the page to confirm that its last action did what it expected.

An accessibility tree is much better than raw HTML. It still describes widgets and leaves out the business operation behind them. The agent sees a button labelled "Add to cart", three color swatches, and a quantity stepper, and has to connect them itself.

With WebMCP it sees this:

```js
set_cart_item({ productId: "hp-sonic-lite", color: "black", quantity: 2 });
```

The result is structured: the cart line, the subtotal, the total. The operation, the object, and the required parameters are all in the contract, so the agent has nothing to work out about the UI. The model is exactly as capable as before. One translation layer is gone, and on this store that layer accounted for most of the tokens.

## What to take from this if you build websites

Don't register fifty tools. If you expose every method in your frontend store, the agent gets a long list of similar verbs to read through, and you get one more public surface to maintain. Our five tools work because each one is a single business step with a short result: search, read a product, change one cart line, read the cart, place the order. None of them has hidden side effects.

Annotations do not give you security. `readOnlyHint` and `consequentialHint` are hints to the client. [Chrome's guidance on securing tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools) says this directly. A tool that changes money, access rights, bookings, or user data has to go through the same server-side checks as the button a person clicks: authorization, amount validation, and duplicate protection.

WebMCP fits best where the state of the open tab is part of the task: the current cart, a selected filter, unsaved form input, an active session, a moment where the person needs to review something. For capabilities that should work without a page open, such as CRM lookups or backend jobs, a regular MCP server is still the better choice.

Your site already knows what "add two black headphones to the cart" means. Exposed as a tool, that knowledge cost between 52% and 97% fewer tokens in our runs than making the agent work it out from the page.

## Run it yourself

The benchmark is open source and tagged `v0.1.0-rc.1`. The public demo runs the store and its WebMCP tools in the browser with local state. The repository has the runner, the oracles, every result matrix, and raw per-call `events.jsonl` logs for the Claude run.

- [Live demo: Northstar Store with WebMCP tools](https://shmakovdima.github.io/webmcp-browser-benchmark/)
- [Repository and runbook](https://github.com/shmakovdima/webmcp-browser-benchmark)
- [Nemotron 3 Ultra matrix](https://github.com/shmakovdima/webmcp-browser-benchmark/blob/main/results/2026-10-30-nebius-nemotron-3-ultra-550b-a55b/matrix.md)
- [Codex matrix](https://github.com/shmakovdima/webmcp-browser-benchmark/blob/main/results/ideal-order/codex.md)
- [Claude Opus 5.5 self-run matrix and diagnostics](https://github.com/shmakovdima/webmcp-browser-benchmark/blob/main/results/2026-10-26T14-29-selfrun-claude/matrix.md)
- [Scripted-flow matrix](https://github.com/shmakovdima/webmcp-browser-benchmark/blob/main/results/ideal-order/muse.md)
- [Chrome for Developers: WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome for Developers: Securing WebMCP tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

If you run it with another model and WebMCP loses, please open an issue. The benchmark is built so that it can show that result.
