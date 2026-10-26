# WebMCP Benchmark React Redesign

## Goal

Turn the current technical fixture into a publication-ready ecommerce benchmark that looks credible in screenshots and remains deterministic for agent testing.

## Product direction

Northstar Store will look like a compact premium electronics shop. The first screen will establish the benchmark, show the catalog immediately, and keep controls secondary to products. Product cards will use local category artwork, readable prices, stock signals, and clear actions. Cart and checkout will look like a real flow while stating that no payment is processed.

## Architecture

- React owns routing, catalog state, cart state, checkout state, and rendering.
- Vite compiles the React application for both the local server and GitHub Pages.
- The existing deterministic HTTP API and static API adapter remain the data boundary.
- WebMCP registration continues through `document.modelContext` and uses the same request adapter as the UI.
- Existing accessible names and benchmark-critical controls remain stable.

## Visual system

- Dark ink, warm white, electric lime, and muted violet palette.
- Editorial typography with large product-led headlines and dense utility copy.
- Local SVG category artwork so screenshots are deterministic and GitHub Pages has no external image dependency.
- Responsive catalog: four columns on wide screens, two on tablets, one on phones.
- Compact filter toolbar, visible result count, trust strip, and polished empty states.

## Constraints

- Bun is the only package and task runner.
- Use React and Vite, not a CDN runtime.
- Use only `document.modelContext` for WebMCP.
- Preserve the server API, fixtures, task definitions, and benchmark semantics.
- Preserve accessible labels used by browser tests.
- Support the local dynamic server and a static GitHub Pages artifact.
- Use only ordinary hyphen-minus characters in repository text.

## Verification

- Unit and runner tests pass.
- Dynamic browser checkout flow passes.
- Static GitHub Pages catalog and cart flow passes.
- Playwright MCP connection passes.
- Desktop and mobile screenshots show no overflow or broken layout.
