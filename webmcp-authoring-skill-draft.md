# WebMCP Authoring Skill - draft

Status: proposal draft, not an official WebMCP project artifact.

## Purpose

Help AI coding agents add, review, test, and document WebMCP integrations in existing web applications.

This is a developer authoring skill. It is not the page-side runtime `registerSkill()` concept discussed in WebMCP issue #161.

## Suggested name

`webmcp-authoring`

Alternative names:

- `webmcp-integration`
- `webmcp-tooling`
- `webmcp-authoring-and-review`

## When to use

Use this skill when the user asks to:

- add WebMCP support to a web application;
- expose an existing UI workflow as agent tools;
- review an existing WebMCP integration;
- convert a form or client-side workflow into WebMCP;
- debug stale tools, registration churn, or UI synchronization;
- test WebMCP behavior;
- prepare a WebMCP implementation for review or publication.

Do not use it to invent a new WebMCP browser API, create a remote MCP server, or expose arbitrary application functions without review.

## Core principle

WebMCP should expose explicit, user-facing capabilities owned by the running web application. Reuse application logic and preserve the human UI. Do not simulate DOM clicks when a stable application function can be called directly.

## Required workflow

### 1. Read project context

Before editing:

- read repository instructions;
- identify framework, router, state management, build system, and test system;
- inspect existing WebMCP or MCP-related code;
- check whether the project uses a polyfill, Origin Trial, feature flag, or native browser support;
- preserve unrelated user changes.

### 2. Understand the requested workflow

Translate the user's request into a workflow with:

- user goal;
- relevant page or route;
- existing UI entry points;
- existing client-side functions;
- required data and current state;
- side effects;
- user confirmation points;
- expected visible UI changes;
- success and failure outcomes.

If the request is too broad, narrow it to one concrete workflow before generating tools.

### 3. Decide whether WebMCP is the right boundary

Prefer WebMCP when the operation depends on:

- current page or route;
- unsaved edits;
- selected items;
- local rendering or viewport state;
- authenticated browser session;
- direct human and agent collaboration;
- an in-page or tab-local workflow.

Recommend remote MCP or a service-level API when the operation is browser-independent and belongs to a backend service. A web page calling a backend API is not by itself a reason to wrap that operation as WebMCP.

### 4. Propose a tool inventory

For every candidate tool, define:

- stable name;
- display title where useful;
- one-sentence description;
- single responsibility;
- input parameters and descriptions;
- expected result;
- read-only or write behavior;
- whether output is untrusted;
- whether the operation is consequential;
- current-state preconditions;
- visible UI effect;
- cancellation behavior;
- registration scope and lifecycle.

Reject or merge tools that are redundant, too low-level, too broad, or only expose internal implementation details.

### 5. Choose imperative or declarative integration

Use imperative registration when the behavior requires JavaScript logic, application state, asynchronous work, or a custom result.

Use the declarative API when a semantic HTML form already represents the workflow and the form semantics are sufficient.

For forms, inspect named controls, labels, descriptions, required fields, visibility, default values, submit buttons, and human review behavior.

### 6. Implement with current application logic

Prefer a stable registration with an execute callback that reads current state at call time. Avoid capturing mutable state in a stale closure.

Use framework lifecycle cleanup. Do not register a new tool on every render unless agent-facing metadata actually changes and the framework integration can update it safely.

Use the current project namespace and add feature detection or a compatibility note when the project targets multiple browser implementations.

Pass `AbortSignal` to cancellable asynchronous work where possible.

Update the visible UI immediately so the human and agent observe the same application state.

### 7. Add validation and security controls

Validate at execution time:

- input shape;
- authorization;
- current page and resource state;
- permissions;
- subscription and feature flags;
- business rules;
- user confirmation requirements;
- network and rate-limit failures.

Do not rely on the schema as the only enforcement layer.

Flag or exclude sensitive fields such as:

- passwords;
- current and new password fields;
- one-time codes;
- payment card numbers;
- CVV and PIN values;
- national identifiers;
- WebAuthn-related secrets;
- access tokens and private keys.

Consequential actions should remain visible and should require the appropriate human confirmation. The skill must never hide or bypass confirmation steps.

### 8. Check tool budget and lifecycle

Report:

- total registered tools;
- duplicate or overlapping descriptions;
- tools that could be dynamic by route or state;
- tools that may remain registered after component caching;
- registration and unregistration churn;
- asynchronous registration that may race with agent observation;
- tools that appear or disappear without explaining why.

Suggest grouping or progressive disclosure as a platform discussion, not as an unreviewed custom API.

### 9. Generate tests

Generate tests for:

- registration and cleanup;
- duplicate names;
- current state at execution time;
- authorization and preconditions;
- valid and invalid inputs;
- cancellation;
- network failure;
- UI synchronization;
- sensitive field exclusion;
- consequential action confirmation;
- navigation or route transitions where relevant.

Where possible, add a browser smoke test using the project's supported WebMCP testing path. Clearly label Origin Trial, experimental, and polyfill tests.

### 10. Produce a review report

The final report must include:

- files changed;
- tools added;
- tool names and descriptions;
- input schemas;
- visible UI effects;
- authorization and consent behavior;
- tests added and their status;
- browser compatibility assumptions;
- security warnings;
- unresolved specification questions;
- manual review steps for the developer.

## Output contract

When making changes, return:

1. a short summary of the workflow exposed;
2. the generated or modified files;
3. the tool inventory;
4. security and privacy findings;
5. testing results;
6. known compatibility limitations;
7. explicit manual confirmation points.

Never claim that an integration is safe, portable, or standards-complete solely because code generation succeeded.

## Review rules

The skill should reject or pause before implementing when:

- the target action is a generic backend operation with no browser-local state;
- the requested tool would expose credentials or sensitive personal data;
- the application has no clear authorization boundary;
- the tool would bypass a visible human approval step;
- the tool description is too vague to distinguish it from another tool;
- the requested workflow needs a browser feature not supported by the target environment;
- the request conflicts with repository instructions;
- the implementation would overwrite unrelated user changes.

## Example request

```text
Add WebMCP support to this React shopping page. The agent should be able to search
products, filter the current grid, add an item to the cart, and start checkout.
The user must review the cart and complete payment manually.
```

## Example result

Suggested tools:

- `search-products`: searches the catalog and returns bounded product summaries;
- `show-products`: updates the visible product grid using existing filter state;
- `add-to-cart`: adds a selected product after checking current availability;
- `start-checkout`: opens the review or checkout step but does not enter payment data or finalize the purchase.

The skill should identify that payment is sensitive and consequential, keep the final confirmation in the UI, add tests for stale state and product availability, and report any browser support assumptions.

## Initial implementation scope

Start with:

- React and Next.js;
- imperative `registerTool()` integrations;
- declarative HTML forms;
- TypeScript projects;
- Jest/Vitest and Playwright-style tests;
- one small todo or shopping example.

Add Vue, Svelte, Angular, and Web Components after the lifecycle model is proven.

## Relationship to WebMCP discussions

- #131: auto-discovery suggests that boilerplate reduction belongs in userland tooling rather than necessarily in the browser.
- #161: runtime skills are a different concept; this skill is for developers and coding agents.
- #199: framework lifecycle, stale closures, scoped registries, and pending state are core design inputs.
- #207: developer tooling and the `debugging` annotation are related, but this skill targets authoring rather than DevTools debugging.
- #255: tool collections and context budget motivate the tool inventory and tool explosion report.
- #252 and #318: polyfills, Origin Trials, and deployment requirements motivate compatibility checks.
- #316: sensitive fields motivate security linting.
- #322: the remote MCP boundary motivates the WebMCP-versus-backend decision step.
- #328: tool stability motivates lifecycle and asynchronous registration checks.

## Proposal question for the WebMCP community

```text
I have prepared this draft authoring skill for AI coding agents. Would the WebMCP
community be interested in reviewing it as community developer tooling, an examples
project, or a companion repository linked from the main WebMCP documentation?
```

