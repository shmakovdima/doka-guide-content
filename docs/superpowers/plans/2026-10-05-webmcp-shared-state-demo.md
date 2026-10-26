# WebMCP payment-race demo implementation plan

Date: 2026-10-06
Status: implemented

## Objective

Build a self-contained companion demo for the shared-state HackerNoon article. The scenario uses a synthetic invoice payment because a stale intent has an obvious cost: the page shows a corrected $120 draft while the processor has completed $1,200.

## Architecture

- `state.js` is a pure state-transition engine.
- `webmcp.js` defines the `payInvoice` descriptor and native registration adapter.
- `app.js` connects UI events, deterministic fake-processor timing, aborts, and reconciliation.
- `index.html` and `styles.css` provide the three-panel responsive interface.
- `state.test.js` and `webmcp.test.js` cover deterministic logic.
- `browser.spec.js` covers complete browser flows.
- `record-demo.mjs` produces the article recording.

## Implemented event sequence

```text
T0  draft = $1,200, revision 41
T1  payInvoice captures $1,200
T2  human changes draft to $120, revision 42
T3  fake processor commits $1,200
T4  result is reconciled against revision 42
```

## Implemented checks

- corrected draft increments the page revision;
- unsafe result exposes $120 and $1,200 together;
- coordinated result preserves the draft and opens a conflict;
- unchanged revision completes without conflict;
- abort before commit creates no payment;
- abort after commit becomes unknown;
- status lookup discovers the succeeded payment;
- repeated operation ID does not create a second payment;
- refund is a separate transition;
- native WebMCP registration and simulator share one descriptor;
- desktop and mobile browser flows work without horizontal overflow.

## Run

```sh
python3 -m http.server 4173 --directory webmcp-shared-state-demo
```

```sh
cd webmcp-shared-state-demo
node --test *.test.js
bunx playwright test
```

## Publication assets

- `assets/coordinated-conflict.png`
- `assets/webmcp-shared-state-demo.webm`
- `assets/webmcp-shared-state-demo.mp4`
- `assets/webmcp-shared-state-demo.gif`

The demo directory uses only relative paths and can later become the root of a standalone GitHub repository.

## Article generation

`scripts/generate-webmcp-publish-files.mjs` extracts the Russian and English final articles from `webmcp-hackernoon-shared-state.md` and adds publication front matter.

```sh
node scripts/generate-webmcp-publish-files.mjs
```

The generated files are:

- `webmcp-hackernoon-ru.md`
- `webmcp-hackernoon-en.md`

`DEMO_URL` remains a placeholder until the demo is moved to a standalone repository and published.
