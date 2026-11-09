# WebMCP payment race

An interactive companion to the HackerNoon article "WebMCP Gives Your Web App a Second Operator. Who Owns the State?"

The demo shows one frontend controlled by two operators. A browser agent starts paying a $1,200 invoice while the human corrects the visible draft to $120. The fake processor completes the captured $1,200 intent after the page has moved to a newer revision.

No LLM, payment provider, bank account, card data, API key, or real funds are used.

## What it demonstrates

- `Unsafe: no coordination` leaves a $120 draft beside a succeeded $1,200 payment.
- `Coordinated: revision + reconciliation` preserves both facts and requires an explicit resolution.
- `Abort after commit` shows why ending a local wait does not reverse a financial effect.
- `Refund $1,200` is a separate state transition, not a local rollback.
- Native WebMCP registration and the simulator use the same `payInvoice` descriptor and execution function.

## Run locally

From the parent repository:

```sh
python3 -m http.server 4173 --directory webmcp-shared-state-demo
```

Open `http://127.0.0.1:4173/`.

## Run deterministic state tests

```sh
cd webmcp-shared-state-demo
node --test *.test.js
```

## Run browser tests

With the local server running:

```sh
cd webmcp-shared-state-demo
bunx playwright test
```

The browser suite uses the installed Google Chrome channel. It verifies the unsafe mismatch, coordinated reconciliation, refund as a new operation, abort after commit, and mobile overflow.

## Publication assets

- `assets/webmcp-shared-state-demo.mp4` is the compact 1280x720 video.
- `assets/webmcp-shared-state-demo.gif` is the 960x540 inline fallback.
- `assets/webmcp-shared-state-demo.webm` is the original Playwright recording.
- `assets/coordinated-conflict.png` is a full-page still of the coordinated conflict.

Regenerate the recording while the local server is running:

```sh
bun run record
```

## Native and simulator modes

When `document.modelContext.registerTool()` is available, the page registers the current `payInvoice` descriptor and displays:

```text
WebMCP API detected: native tool registered
```

Otherwise, the controls call the same descriptor through a deterministic local adapter:

```text
WebMCP API unavailable: deterministic simulator
```

The fallback is intentional. Readers can reproduce the race without an experimental browser setup.

## Move to a standalone repository

This directory has no imports from the parent repository and uses only relative paths. To publish it separately:

1. Copy the directory contents to the root of a new repository.
2. Enable GitHub Pages for the default branch.
3. Confirm that the Pages URL loads `index.html` and all relative assets.
4. Replace `DEMO_URL` in the article files with the published URL.
5. Record the hosted build for the final article.

## Files

- `index.html` contains the semantic page structure.
- `styles.css` contains the responsive visual system.
- `state.js` contains pure payment-state transitions.
- `webmcp.js` contains the shared tool descriptor and native registration adapter.
- `app.js` connects UI events, fake processor timing, and reconciliation.
- `state.test.js` and `webmcp.test.js` verify deterministic logic.
- `browser.spec.js` verifies complete user flows.
