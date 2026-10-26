# WebMCP Browser Benchmark - Open Specification

Status: design ready for review

Date: 2026-10-06

Working article title: Does WebMCP Actually Save Tokens? I Tested It Against Playwright MCP

## 1. Purpose

Build a small, reproducible browser-agent benchmark that compares three ways for the same language model to use the same online store:

1. Visual browser control through screenshots and coordinates.
2. Playwright MCP through accessibility snapshots and element references.
3. WebMCP through page-provided semantic tools and structured results.

The benchmark must measure whether WebMCP reduces token use, elapsed time, and failures. It must not assume that WebMCP wins. The final article must report the observed result, including a negative or mixed result.

The project is both:

- a reproducible technical experiment;
- the evidence base for Russian and English HackerNoon article drafts.
- a public, deployable demo that readers can open and inspect.

The article drafts are required deliverables, but they are written only after the benchmark implementation and measured runs. No result, percentage, or conclusion may be invented before data exists.

## 2. Central research question

For identical shopping tasks, the same model, and the same underlying application state, how do visual control, Playwright MCP, and WebMCP differ in:

- input, output, and total model tokens;
- wall-clock completion time;
- model turns and browser or tool calls;
- task success rate;
- recovery work after invalid or failed actions?

## 3. Falsifiable hypotheses

Primary hypothesis:

- WebMCP uses fewer total model tokens than Playwright MCP and visual control because the page exposes compact task-level operations instead of a visual frame or a large accessibility tree.

Secondary hypotheses:

- Playwright MCP uses fewer tokens and fails less often than visual control.
- WebMCP needs fewer interaction turns for multi-step tasks.
- WebMCP's advantage grows with UI complexity, but shrinks when the task requires only one obvious interaction.
- WebMCP can lose if tool schemas and structured responses are too verbose.

The benchmark is valid if these hypotheses are rejected or only partly supported.

## 4. Non-goals

This project does not attempt to:

- prove that one interface is universally superior;
- benchmark every browser agent, browser, or model;
- use a real merchant, payment provider, bank, or customer account;
- build a production ecommerce system;
- evaluate visual design quality;
- evaluate anti-bot systems or CAPTCHAs;
- compare different models;
- reuse results from the earlier booking or fintech shared-state demo;
- present synthetic benchmark results as production performance.

## 5. Experimental fairness rules

### 5.1 Constants across all modes

Every measured comparison must use:

- the same resolved model identifier;
- the same model settings, including temperature and reasoning settings where configurable;
- the same common system prompt;
- the same user task text;
- the same maximum model turns;
- the same task timeout;
- the same browser version and viewport;
- the same seeded catalog and inventory;
- the same backend business rules;
- a fresh application state before each run;
- an isolated browser context for each run;
- an empty cart and no stored user data at the start of each run.

The model identifier is supplied with the required `MODEL_ID` runtime setting. The runner must reject measured runs when it is missing. The resolved identifier returned by the model provider must be recorded in the run manifest and then frozen for the full experiment.

### 5.2 The only intended variable

Only the browser interface changes:

- Visual mode receives screenshots and coordinate-based controls.
- Playwright MCP mode receives accessibility snapshots, element references, and Playwright MCP actions.
- WebMCP mode receives the page's semantic tool definitions and structured tool results.

The common system prompt may contain one neutral sentence telling the model which interface is available. It must not include task hints, expected answers, catalog facts, or recommended action sequences.

### 5.3 Information parity

All three modes must have access to the same user-visible facts and the same business operations. WebMCP may expose structured values that are present in the UI, but it may not expose hidden discounts, internal scoring, expected answers, or a task-solving supertool.

WebMCP tools must map to ordinary store capabilities. A tool such as `find_the_correct_product_for_benchmark_task_1` is prohibited.

### 5.4 No fallback inside measured runs

- Visual mode may not request DOM, accessibility, Playwright MCP, or WebMCP data.
- Playwright MCP mode may not use screenshots or coordinate clicking during a measured run.
- WebMCP mode may not inspect screenshots, DOM, or accessibility snapshots during a measured run.
- If a mode cannot finish using its allowed interface, the run fails. It must not silently switch modes.

Troubleshooting outside measured runs is allowed but must not be included in results.

## 6. Project location and isolation

Create the implementation in a new top-level folder:

`webmcp-browser-benchmark/`

It must be self-contained so it can later be extracted into a separate repository. Do not modify or depend on `doka-demo/platform` or the earlier `webmcp-shared-state-demo/`.

Required layout:

```text
webmcp-browser-benchmark/
  README.md
  package.json
  bun.lock
  .gitignore
  config/
    benchmark.config.json
  fixtures/
    catalog.json
    tasks.json
  src/
    server/
      server.js
      store.js
      reset.js
    web/
      index.html
      app.js
      styles.css
      webmcp.js
    runner/
      run.js
      manifest.js
      metrics.js
      oracle.js
      model-client.js
      modes/
        visual.js
        playwright-mcp.js
        webmcp.js
  tests/
    store.test.js
    tools.test.js
    oracle.test.js
    reset.test.js
    browser.test.js
  results/
    .gitkeep
  article/
    .gitkeep
```

Generated screenshots, traces, raw model messages, and result files remain ignored by default. A small sanitized result summary and the final aggregate dataset may be committed later.

### 6.1 Publication target

The benchmark must be ready for two separate public artifacts:

- a public GitHub repository that contains the source, fixtures, tests, README, and sanitized results;
- a public GitHub Pages HTTPS demo URL that serves a self-contained static build of the synthetic store and its WebMCP tools without model-provider secrets;
- a private or local Node service for benchmark runs that need HTTP reset state and runner instrumentation.

The GitHub Pages demo is for inspecting the store and WebMCP surface. It must use browser-local deterministic state because GitHub Pages does not run the Node server. It must not run paid model calls, expose the benchmark runner, or accept real payment data. Full benchmark runs remain local or run in a private controlled environment.

The local Node server must support `PORT` and `HOST` environment variables, bind to `0.0.0.0` when deployed, serve a health endpoint suitable for a hosting provider, and use no filesystem state for business data. The Pages build must use relative assets, copy the catalog and browser-compatible store logic, and work under a repository subpath. The README must document GitHub Pages publication and the HTTPS requirement for browser features that require a secure origin.

The repository must be extractable without the parent Doka repository. It must not depend on parent-relative imports, untracked local files, private assets, or environment-specific absolute paths.

Public deployment acceptance criteria:

- the repository starts from a clean clone using documented commands;
- `GET /health` returns a successful response on the hosting platform;
- the store works from the public HTTPS URL;
- WebMCP registration degrades safely when the browser does not support the current API;
- no API key or private result is present in the client bundle or repository;
- the GitHub Pages app can complete catalog, cart, and test checkout without a Node server;
- the public app cannot invoke benchmark model calls;
- deployment configuration and public URL placeholders are documented without pretending that a URL exists before deployment.

## 7. Implementation constraints

Use a deliberately small stack:

- Node.js 22 or newer;
- vanilla HTML, CSS, and browser JavaScript;
- a Node HTTP server;
- JSON fixtures;
- Playwright for browser automation and deterministic tests;
- no frontend framework;
- no database;
- no real authentication;
- no real payment processing;
- no analytics service.
- deployment-compatible with a plain Node service and no persistent filesystem.

The fake backend owns catalog, cart, inventory, checkout, and order state. The UI and WebMCP tools must call the same backend operations so neither interface receives different business behavior.

The store must run locally with one documented command and expose a health endpoint. Each benchmark run must be able to reset state through an internal test-only endpoint protected by a random run token.

## 8. Store application

### 8.1 Catalog

Create exactly 24 deterministic products across these categories:

- headphones;
- keyboards;
- mice;
- monitors.

Each product contains:

- stable product ID;
- name;
- category;
- short description;
- price in integer cents;
- feature tags;
- available colors;
- stock count per color;
- image placeholder URL or local generated placeholder;
- customer rating as fixture data.

At least six products must be headphones. At least four headphone products must have the `noise-cancelling` tag. At least three noise-cancelling headphones must be in stock and cost below USD 200.

The required known fixture is:

- ID: `hp-sonic-lite`
- Name: `Sonic Lite ANC`
- Category: `headphones`
- Price: USD 129.00
- Tags: `wireless`, `noise-cancelling`
- Colors: black and blue
- Stock: black 8, blue 0

No other in-stock noise-cancelling headphone below USD 200 may cost less than USD 129.00. This makes the read-only task deterministic without exposing the answer to the agent.

### 8.2 User interface

The application has these screens or panels:

- product catalog;
- text search;
- category, price, feature, and in-stock filters;
- sort control;
- product detail;
- color and quantity selectors;
- cart;
- fake checkout form;
- order confirmation.

The primary benchmark uses one fixed responsive desktop layout at 1440 x 900. A second visual redesign is an optional robustness extension and requires separate user approval after the primary pilot. It is not part of the initial implementation acceptance criteria.

### 8.3 Fake checkout

Checkout fields:

- full name;
- email;
- address line;
- city;
- postal code;
- country.

The order operation validates fields and stock, calculates subtotal and a fixed shipping fee, decrements stock, clears the cart, and returns a deterministic order ID. With reset state, the first order ID is `order-0001`.

No card number, bank account, credential, or payment API is used. The final button must say `Place test order` and the page must state that no payment will occur.

## 9. WebMCP surface

The page exposes these semantic tools:

### `search_products`

Input:

```json
{
  "query": "string, optional",
  "category": "string, optional",
  "maxPriceCents": "integer, optional",
  "tags": ["string"],
  "inStockOnly": "boolean, optional",
  "sort": "price_asc | price_desc | rating_desc, optional"
}
```

Output: matching products with ID, name, price, relevant tags, available colors, and total stock. It must not return descriptions or fields that are not needed for selection.

### `get_product`

Input: product ID.

Output: the same complete product information shown on the product detail page.

### `set_cart_item`

Input: product ID, color, and integer quantity. Quantity zero removes the item.

Output: updated cart summary and validation errors, if any.

### `get_cart`

Input: empty object.

Output: cart lines, quantities, subtotal, shipping fee, and total.

### `place_test_order`

Input: the six checkout fields listed above.

Output: order ID, status, lines, subtotal, shipping fee, total, and normalized shipping destination.

Tool descriptions must explain behavior and constraints but must not mention benchmark tasks or their expected answers. Input and output schemas must use the current WebMCP API supported by the selected browser at implementation time.

Because the WebMCP API is evolving, implementation must place browser API registration behind `src/web/webmcp.js`. This benchmark uses only the current `document.modelContext` API and records that exact surface in the manifest. Do not add an alternate legacy API or mix API surfaces within one experiment.

## 10. Browser interfaces

### 10.1 Visual mode

Allowed observations:

- viewport screenshot after navigation and after each action;
- action error text;
- current URL.

Allowed actions:

- navigate;
- click by x and y coordinate;
- type text;
- press a key;
- scroll;
- finish with a textual answer.

The model must not receive OCR output, DOM text, accessibility data, selectors, or element labels from the runner. Screenshots must use the same image dimensions and encoding settings in every visual run.

### 10.2 Playwright MCP mode

Use the official Playwright MCP accessibility-snapshot workflow. Screenshots and vision mode are disabled during measured runs. The model interacts through element references returned by snapshots.

Record the exact Playwright MCP package version, configuration, and tool list in the run manifest.

### 10.3 WebMCP mode

After opening the store, the model receives only the registered WebMCP tool catalog and structured tool results. The runner may provide a generic navigation action required to open the benchmark URL, but no other DOM or browser-inspection capability.

Record the browser version, WebMCP implementation or flag, exposed tool schemas, and registration API surface in the run manifest.

## 11. Benchmark tasks

The common task prompt must contain only the task and any user-supplied checkout data. It must not name an interface or prescribe steps.

### Pilot task T1 - product discovery

Prompt:

> Find the cheapest in-stock noise-cancelling headphones under $200. Return the product name and price. Do not add anything to the cart.

Success oracle:

- final answer contains `Sonic Lite ANC` and `$129.00` or an equivalent numeric representation;
- cart remains empty;
- no order exists.

### Pilot task T2 - product configuration and cart

Prompt:

> Add two black Sonic Lite ANC headphones to the cart. Return the cart subtotal and total quantity. Do not place an order.

Success oracle:

- cart contains product `hp-sonic-lite`;
- selected color is black;
- quantity is 2;
- subtotal is USD 258.00;
- no order exists;
- final answer reports quantity 2 and subtotal USD 258.00.

### Pilot task T3 - complete test order

Prompt:

> Buy one black Sonic Lite ANC headphone. Ship it to Alex Morgan, alex@example.com, 10 Market Street, Boston, 02110, United States. Place the test order and return the order ID and total.

Success oracle:

- exactly one order exists;
- order ID is `order-0001`;
- order contains one black `hp-sonic-lite`;
- normalized destination matches the supplied data;
- stock for black `hp-sonic-lite` decreases from 8 to 7;
- cart is empty after checkout;
- final answer contains the correct order ID and total.

### Full benchmark expansion

After pilot review, the full benchmark adds two tasks without changing T1-T3:

- T4: compare two eligible products and return the cheaper one plus the price difference without modifying state;
- T5: add two different products, update one quantity, remove the other, place a test order, and return the final line count and total.

T4 and T5 fixtures, prompts, and expected backend states must be committed before any full measured run. They may not be edited after seeing comparative results.

## 12. Runner behavior

For each run, the runner must:

1. Generate a unique run ID.
2. Reset backend and browser state.
3. Confirm the fixture checksum.
4. Start an isolated browser context.
5. Open the store.
6. Provide the common system prompt and selected task.
7. Expose only the selected mode's tools.
8. Execute until success declaration, maximum turns, timeout, or unrecoverable error.
9. Query the backend state directly for oracle validation.
10. Save raw events and a normalized run summary.
11. Close the browser context.

Default limits:

- maximum 30 model turns per run;
- maximum 5 minutes per run;
- no automatic retry of a measured run;
- provider or infrastructure failures are marked `invalid`, not `failed`, and are rerun once with the same seed at the end of the randomized block.

Task-mode order must be randomized with a recorded seed so temporary provider or machine conditions do not consistently favor one mode.

## 13. Metrics

### 13.1 Primary metrics

- input tokens;
- output tokens;
- total tokens;
- successful task completion;
- wall-clock milliseconds from first model request to terminal state.

Use token usage reported by the model provider. Do not estimate primary token counts from characters. Record cached input tokens and reasoning tokens separately when the provider reports them.

### 13.2 Secondary metrics

- number of model requests;
- number of browser or WebMCP tool calls;
- number of observation payloads;
- total observation payload bytes before model-provider encoding;
- invalid tool calls;
- business validation errors;
- repeated actions with identical inputs;
- timeout or turn-limit failures;
- final-answer correctness;
- backend-state correctness.

Payload bytes are diagnostic data, not a substitute for provider-reported tokens.

### 13.3 Aggregate reporting

For each task and mode report:

- number of valid runs;
- successes and success rate;
- median and interquartile range for total tokens;
- median and interquartile range for elapsed time;
- median model turns and tool calls;
- failure categories.

Also publish raw per-run values in machine-readable form. Do not report only averages. With small samples, describe differences as benchmark observations rather than universal performance claims.

## 14. Data format

Write one JSON object per line to `results/raw-events.jsonl` with:

```json
{
  "runId": "string",
  "timestamp": "ISO-8601 string",
  "mode": "visual | playwright-mcp | webmcp",
  "taskId": "T1 | T2 | T3 | T4 | T5",
  "repeat": 1,
  "eventType": "model_request | model_response | tool_call | tool_result | terminal",
  "elapsedMs": 0,
  "inputTokens": 0,
  "cachedInputTokens": 0,
  "outputTokens": 0,
  "reasoningTokens": 0,
  "payloadBytes": 0,
  "data": {}
}
```

Write one row per run to `results/runs.jsonl` with:

```json
{
  "runId": "string",
  "mode": "visual | playwright-mcp | webmcp",
  "taskId": "T1 | T2 | T3 | T4 | T5",
  "repeat": 1,
  "seed": 0,
  "status": "success | failed | invalid",
  "failureCategory": null,
  "inputTokens": 0,
  "cachedInputTokens": 0,
  "outputTokens": 0,
  "reasoningTokens": 0,
  "totalTokens": 0,
  "wallTimeMs": 0,
  "modelRequests": 0,
  "toolCalls": 0,
  "observationBytes": 0,
  "oraclePassed": true,
  "finalAnswerPassed": true
}
```

Secrets, API keys, authorization headers, and unrestricted model chain-of-thought must never be written to result files. Store only provider-returned reasoning token counts, not hidden reasoning text.

## 15. Reproducibility manifest

Every experiment batch writes `results/manifest.json` containing:

- benchmark commit SHA;
- dirty-worktree flag;
- fixture file checksums;
- task file checksum;
- exact resolved model identifier;
- model settings;
- model provider;
- Node.js version;
- operating system and architecture;
- browser name and version;
- viewport and screenshot settings;
- Playwright version;
- Playwright MCP version and configuration;
- WebMCP API surface and implementation version;
- tool schemas for all modes;
- run limits;
- randomization seed;
- start and end timestamps.

Measured batches must refuse to start from a dirty benchmark folder unless `ALLOW_DIRTY_BENCHMARK=1` is explicitly set. The manifest must still record the dirty state.

## 16. Staged execution and token budget gates

No model call is allowed during ordinary application development or deterministic tests.

### Stage 0 - implementation

Build the store, three adapters, runner, metrics, oracle, and tests. Use mocks or recorded fixtures for runner tests. Cost: zero model calls.

### Stage 1 - deterministic verification

Run unit and browser tests. Verify that all modes can theoretically access equivalent operations and information. Cost: zero model calls.

### Stage 2 - smoke test

Run T1 once in each mode: 3 measured model runs total.

Stop and fix the benchmark if any adapter, metric, reset, or oracle is broken. Smoke results are engineering diagnostics and are not included in the article dataset.

### Stage 3 - pilot

Run T1-T3 three times in each mode: 27 measured model runs total.

After the pilot, stop. Produce:

- the complete pilot table;
- median token and latency comparison;
- failure notes;
- estimated model-call count and token cost for the full benchmark;
- a recommendation to continue, revise, or stop.

The full benchmark may not start without separate user approval.

### Stage 4 - full benchmark

After approval and before execution, freeze T1-T5, fixtures, prompts, model configuration, and mode adapters in a commit.

Run each of five tasks ten times in each of three modes: 150 measured model runs total. Pilot runs are excluded from the final dataset because the implementation may change after pilot review.

### Stop conditions

Stop the batch and report rather than consuming more tokens when:

- two consecutive infrastructure-invalid runs occur;
- state reset or oracle validation is unreliable;
- provider token usage is unavailable;
- one interface accidentally gains access to another interface;
- the resolved model changes;
- a fixture, task, prompt, or tool schema changes during the batch;
- projected full-run consumption materially exceeds the pilot forecast.

## 17. Deterministic test requirements

Tests must cover:

- fixture validation and unique product IDs;
- search, filter, sort, and stock behavior;
- cart add, update, remove, subtotal, shipping, and total;
- checkout validation and stock decrement;
- deterministic reset and order ID generation;
- WebMCP input schemas and structured outputs;
- equivalence between UI-visible data and WebMCP-returned data;
- oracle pass and fail cases for every task;
- mode capability isolation;
- secret redaction from logs;
- run manifest completeness;
- one mocked end-to-end run for each mode;
- one real local browser flow for catalog, cart, and checkout without a model call.

## 18. Documentation verification

Before implementing adapters, verify the current behavior against primary sources only:

- the current WebMCP specification or explainer;
- current Chrome WebMCP documentation and official demo;
- current Playwright MCP documentation;
- current Playwright WebMCP API documentation if that integration is used;
- the selected model provider's token-usage documentation.

The README must link the exact sources used and record access dates. If official sources disagree about an API name, follow the API actually supported by the frozen benchmark browser and disclose the discrepancy. Do not silently combine obsolete and current examples.

## 19. Article deliverables after measurement

The benchmark is not complete until it produces two article drafts:

- `article/webmcp-vs-playwright-mcp-ru.md`;
- `article/webmcp-vs-playwright-mcp-en.md`.

The English article is the primary HackerNoon version. The Russian article carries the same evidence and central claim but is written naturally in Russian, not translated sentence by sentence.

### 19.1 Required article angle

The article answers a concrete question: does WebMCP actually save tokens compared with visual browser control and Playwright MCP on the same tasks?

It is not another general introduction to WebMCP. It must still include a short explanation for a reader who has never seen WebMCP:

- browser agents usually infer actions from pixels or page structure;
- Playwright MCP exposes structured browser state and actions;
- WebMCP lets the page expose task-level tools directly;
- the experiment measures the practical cost of these different interfaces.

This primer should be no longer than needed to understand the benchmark.

### 19.2 Planned article structure

1. A result-first hook using the strongest honest measured finding.
2. A concise WebMCP and Playwright MCP primer.
3. Why token cost, latency, and failures matter for browser agents.
4. Benchmark design and fairness controls.
5. The test store and three representative tasks.
6. Results with a compact table and chart.
7. Where each mode spent tokens and interaction turns.
8. Failure analysis, including cases where WebMCP did not win.
9. What the benchmark does and does not prove.
10. A practical decision guide for product and agent developers.
11. Reproduction link and source list.

### 19.3 Editorial rules

- Do not write the result-first hook until full data is available.
- Do not claim statistical significance unless an appropriate test supports it.
- Do not generalize from one synthetic store to the entire web.
- Distinguish provider-reported measurements from interpretation.
- Disclose that the store is synthetic and purpose-built.
- Include enough implementation detail for reproduction without turning the article into a repository README.
- Link raw aggregate data, source code, and the exact benchmark commit.
- Use eight accurate HackerNoon tags, a meta description no longer than 160 characters, and a short TLDR.
- Include a clear AI-assistance disclosure that matches the actual writing process.
- The human author must add personal interpretation and perform the final editorial pass.

### 19.4 Humanizer stage

After both substantive drafts exist and all facts are checked, apply the `humanizer` skill separately to Russian and English.

The humanizer pass must:

- remove generic AI phrasing, repetitive transitions, canned conclusions, and inflated claims;
- preserve all measurements, caveats, code, links, and technical meaning;
- keep the English version idiomatic rather than making it mirror Russian syntax;
- avoid fabricating personal experience or emotional reactions;
- produce an audit report of changed pattern categories.

Humanizer is an editing stage, not a substitute for the author's own contribution or HackerNoon's authorship rules.

## 20. Acceptance criteria

The implementation is ready for smoke testing only when:

- the project exists entirely under `webmcp-browser-benchmark/`;
- the store starts with one documented command;
- all deterministic tests pass without model calls;
- the three modes are capability-isolated;
- every pilot task has a backend-state oracle;
- state reset produces identical fixture checksums;
- token usage comes from provider responses;
- result logs and manifests match the schemas in this specification;
- no real payment or sensitive data is involved;
- official API versions and sources are documented.

The research project is complete only when:

- the approved measured batch has finished;
- invalid runs and exclusions are documented;
- aggregate and per-run results are reproducible;
- conclusions match the data, including negative results;
- both article drafts exist;
- technical claims have primary-source citations;
- both drafts have passed humanizer and manual factual review;
- no fabricated experience, quote, statistic, or production claim appears.

## 21. Required handoff behavior for the implementation model

The implementation model must not:

- write article conclusions before measured data exists;
- start any paid or token-consuming run before deterministic tests pass;
- proceed from smoke to pilot when instrumentation is incomplete;
- proceed from pilot to the full benchmark without explicit user approval;
- change fixtures, task wording, adapters, or model configuration during a measured batch;
- modify unrelated repository files;
- commit secrets or raw sensitive provider responses.

At each stage, it must report exactly what was built, what was tested, how many model runs were consumed, and what approval is needed next.
