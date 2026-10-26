# WebMCP Benchmark React Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the technical vanilla frontend with a polished React ecommerce interface without changing benchmark behavior.

**Architecture:** Vite builds one React application into `dist`. The dynamic benchmark server serves `dist` and its existing APIs. The Pages builder copies the compiled app plus deterministic static adapters and fixtures into `site`.

**Tech Stack:** Bun, React, Vite, Node HTTP server, Playwright, WebMCP `document.modelContext`

## Global Constraints

- Bun is the only package and task runner.
- Preserve benchmark API routes, fixtures, accessible labels, and test semantics.
- Use only `document.modelContext` for WebMCP.
- Keep all images local and deterministic.
- Keep GitHub Pages support.
- Use ordinary hyphen-minus characters only.

---

### Task 1: Add the React and Vite build boundary

**Files:**
- Create: `webmcp-browser-benchmark/index.html`
- Create: `webmcp-browser-benchmark/vite.config.js`
- Modify: `webmcp-browser-benchmark/package.json`
- Modify: `webmcp-browser-benchmark/src/server/server.js`
- Test: `webmcp-browser-benchmark/tests/browser.test.js`

**Interfaces:**
- Produces: `bun run build` and a `dist` directory served by `createBenchmarkServer()`.

- [ ] Add React, React DOM, Vite, and the Vite React plugin with Bun.
- [ ] Add `build`, `dev`, and build-aware `start` scripts.
- [ ] Configure Vite to preserve relative asset URLs for GitHub Pages.
- [ ] Make the dynamic server serve the compiled application and retain API routes.
- [ ] Run the browser test and confirm its current flow still passes.

### Task 2: Move the benchmark UI into focused React components

**Files:**
- Create: `webmcp-browser-benchmark/src/web/main.jsx`
- Create: `webmcp-browser-benchmark/src/web/App.jsx`
- Create: `webmcp-browser-benchmark/src/web/components/Header.jsx`
- Create: `webmcp-browser-benchmark/src/web/components/Catalog.jsx`
- Create: `webmcp-browser-benchmark/src/web/components/ProductDetail.jsx`
- Create: `webmcp-browser-benchmark/src/web/components/Cart.jsx`
- Create: `webmcp-browser-benchmark/src/web/components/Checkout.jsx`
- Create: `webmcp-browser-benchmark/src/web/product-art.jsx`
- Modify: `webmcp-browser-benchmark/src/web/static-api.js`
- Modify: `webmcp-browser-benchmark/src/web/webmcp.js`
- Remove: `webmcp-browser-benchmark/src/web/app.js`

**Interfaces:**
- Consumes: existing `/api/products`, `/api/cart`, and `/api/orders/test` responses.
- Produces: the same labels and actions currently used by browser tests.

- [ ] Create a request adapter that selects HTTP or static behavior.
- [ ] Implement hash routing and shared cart state in React.
- [ ] Implement catalog filters with visible result count and stable accessible labels.
- [ ] Implement product detail, cart, and checkout views with unchanged benchmark actions.
- [ ] Register WebMCP tools once against the shared request adapter.
- [ ] Run dynamic browser and WebMCP tool tests.

### Task 3: Apply the publication-ready visual system

**Files:**
- Modify: `webmcp-browser-benchmark/src/web/styles.css`
- Create: `webmcp-browser-benchmark/src/web/components/BenchmarkPanel.jsx`

**Interfaces:**
- Produces: desktop and mobile layouts with no remote assets.

- [ ] Add the header, benchmark introduction, trust strip, and compact toolbar.
- [ ] Add deterministic product artwork and polished product cards.
- [ ] Style product, cart, and checkout states consistently.
- [ ] Add tablet and phone breakpoints plus reduced-motion behavior.
- [ ] Capture desktop and mobile screenshots and inspect overflow and hierarchy.

### Task 4: Rebuild static Pages output and verify the complete stand

**Files:**
- Modify: `webmcp-browser-benchmark/scripts/build-pages.js`
- Modify: `webmcp-browser-benchmark/tests/pages.test.js`
- Modify: `webmcp-browser-benchmark/tests/pages-browser.test.js`
- Modify: `webmcp-browser-benchmark/README.md`

**Interfaces:**
- Consumes: Vite `dist` output.
- Produces: self-contained `site` output for GitHub Pages.

- [ ] Make the Pages builder run the Vite build and copy compiled output.
- [ ] Inject static-demo mode without changing the production build.
- [ ] Verify unit, browser, Pages, and Playwright MCP tests.
- [ ] Verify no `navigator.modelContext` or prohibited dash characters were introduced.
- [ ] Document local staging and Pages publication commands.
