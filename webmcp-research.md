# WebMCP research and proposal notes

Date: 2026-09-29

This note records the research done for the idea of proposing a Codex-style authoring skill for WebMCP. It includes the repository review, the WebMCP design, the issue inventory, related proposals, the fit assessment, and a draft proposal for the WebMCP community.

## 1. The original idea

The proposed artifact is a coding skill for AI coding agents. It would help a developer add WebMCP to an existing web application.

The skill is not a page-side runtime skill registered with `registerSkill()`. It is an authoring and review tool used by a developer or coding agent.

The skill should:

- inspect an existing codebase;
- identify user-facing workflows and candidate capabilities;
- suggest a small, non-overlapping set of WebMCP tools;
- generate imperative `registerTool()` integrations or declarative form integrations;
- reuse existing application logic instead of simulating DOM clicks;
- adapt to framework lifecycle patterns;
- avoid stale closures and registration leaks;
- generate input schemas, runtime validation, structured results, and errors;
- account for tool budget and dynamic registration;
- protect sensitive data and consequential actions;
- generate tests and a security review;
- produce documentation describing the tools exposed to agents.

The strongest positioning is not "a generator that writes WebMCP code". It is:

> A framework-aware WebMCP authoring and validation skill for AI coding agents.

Or:

> An AI-assisted authoring workflow for designing, implementing, and validating WebMCP tools in existing web applications.

## 2. Repository reviewed

Repository: https://github.com/webmachinelearning/webmcp

The repository was inspected through its current tree, including the main specification, explainers, security questionnaire, implementation status, contribution rules, configuration, and assets.

### Main files and their roles

- `README.md`: primary explainer, motivation, goals, non-goals, use cases, imperative API examples, declarative API overview, best practices, alternatives, open questions, and links to implementation guidance.
- `index.bs`: current Bikeshed specification draft. It defines the browser-facing API, tool registration, discovery, execution, lifecycle, permissions, frames, cancellation, observations, schemas, and annotations.
- `declarative-api-explainer.md`: proposed HTML form integration. It describes `toolname`, `tooldescription`, `toolautosubmit`, `toolparamdescription`, schema synthesis, form invocation, `respondWith()`, pseudo-classes, and declarative events.
- `docs/service-workers.md`: supplemental proposal for WebMCP tools in service workers, background discovery, manifest-based installation, routing, sessions, and security boundaries.
- `implementation-status.md`: browser and agent support. The snapshot reviewed listed Brave Leo experimental support, ChatGPT Desktop support, Chrome 149 Origin Trial, Edge 150 Origin Trial, Firefox and Safari positions, and Meta Ray-Ban Web Apps support as coming soon.
- `security-privacy-questionnaire.md`: W3C security and privacy self-review covering exposure, PII, cross-origin iframes, permission policy, tool outputs, BFCache, document lifecycle, and errors.
- `CONTRIBUTING.md`: the repository is work in the W3C Web Machine Learning Community Group. Substantive contributions require joining the Community Group. Contributors must be identified in pull requests.
- `Makefile`: repository publishing and Bikeshed-related workflow.
- `.github/workflows/auto-publish.yml`, `.github/dependabot.yml`, `.pr-preview.json`: repository automation and preview configuration.
- `assets/`: repository branding and diagrams.
- `w3c.json`: W3C metadata.
- `LICENSE.md`, `.gitignore`: standard project files.

## 3. WebMCP design distilled

WebMCP lets a web application expose functionality as tools for AI agents. The tools can be imperative JavaScript callbacks or declarative HTML form tools.

The intended flow is:

1. The page registers tools.
2. An agent discovers the active tools.
3. The agent invokes a tool with structured arguments.
4. The browser mediates execution in the tool owner's context.
5. The page updates its application state and visible UI.
6. The result goes back to the agent.

The central value is that the page owns its client-side state, authentication context, UI synchronization, and application logic. This is different from a backend MCP integration that may bypass the active UI and duplicate state or authentication.

The README describes WebMCP as an in-page MCP-like surface, but it intentionally does not simply embed the backend MCP protocol. The browser has web-native concerns such as origins, permissions, frames, DOM lifecycle, navigation, and user interaction.

### Imperative API

The main authoring pattern is approximately:

```js
const controller = new AbortController();

await document.modelContext.registerTool({
  name: "add-todo",
  description: "Add a new item to the user's active todo list",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text content of the todo item"
      }
    },
    required: ["text"]
  },
  async execute({ text }, options) {
    await addTodoItemToCollection(text, options.signal);
    return {
      content: [{
        type: "text",
        text: `Added todo item: "${text}" successfully.`
      }]
    };
  }
}, { signal: controller.signal });
```

The current interface includes:

- tool `name`;
- optional display `title`;
- tool `description`;
- optional JSON Schema `inputSchema`;
- `execute` callback;
- `annotations`;
- registration options such as `exposedTo` and an abort signal.

The callback receives input and execution options. The execution options include an `AbortSignal`.

Tools can be removed by aborting the signal used for registration. A `toolchange` event informs consumers that tools were added, removed, or changed.

In-page agents can discover tools with `getTools()` and invoke them with `executeTool()` when permitted by the security model.

### Tool annotations currently reflected in the spec

The reviewed `index.bs` contains these annotations:

- `readOnlyHint`: the tool does not modify state;
- `untrustedContentHint`: the output contains content that is untrusted from the author's perspective;
- `consequentialHint`: execution causes significant, real-world, or non-reversible effects;
- `debugging`: the tool is intended for debugging and developer tooling rather than end-user interaction.

The `debugging` annotation is especially relevant because the developer-tooling issue was resolved around this distinction. General-purpose agents should be able to filter out developer/debugging tools while DevTools-style agents can use them.

### Declarative API

The declarative explainer proposes adding WebMCP metadata to forms and controls:

- `toolname` maps to the tool name;
- `tooldescription` maps to the tool description;
- `toolautosubmit` allows the agent to submit automatically;
- `toolparamdescription` describes input schema properties.

The browser synthesizes a schema from form controls. A form without `toolautosubmit` remains a human-in-the-loop flow: the agent fills the form, then the user reviews and submits it.

The declarative design is still evolving. The explainer marks input schema synthesis as a TODO area for controls, `min`, `max`, `step`, `anyOf`, `oneOf`, date constraints, radio groups, and related semantics.

### Permissions and frames

WebMCP is gated by the `tools` Permissions Policy feature. It is enabled by default in top-level windows and same-origin descendants, while cross-origin frames need permission delegation such as:

```html
<iframe src="https://trusted-partner.example/" allow="tools"></iframe>
```

Tool registration can use `exposedTo` to restrict which secure origins can discover and invoke tools. The repository discusses cross-origin frame exposure, caller origins, name collisions, host-controlled topologies, and isolation.

### Lifecycle and context

Tools are connected to page and document lifecycle. Relevant states include:

- page load and hydration;
- SPA route transitions;
- MPA navigation;
- component mount and unmount;
- async data loading;
- permissions or subscription changes;
- BFCache suspension and restoration;
- document destruction;
- cancellation by the caller;
- tool registration and unregistration races.

This is one of the strongest reasons for a framework-aware authoring skill. The raw API is small, but correct integration depends on application lifecycle and current state.

## 4. Official goals and non-goals

The README lists these goals:

- human-in-the-loop workflows;
- simpler and more reliable agent integration;
- preventing web application disintermediation by backend integrations;
- code reuse;
- accessibility assistance through agents;
- headless browsing scenarios where appropriate.

The README lists these non-goals:

- fully autonomous server-side workflows without a browser UI;
- replacing backend integrations such as MCP;
- replacing the human web interface.

The proposal for an authoring skill aligns strongly with the goals of simplification and code reuse. It should explicitly respect the non-goals.

## 5. README best practices relevant to the skill

The README's best practices are the core of what the skill should operationalize.

### Tool strategy and budget

- Every tool consumes model context and can increase latency.
- Do not expose dozens or hundreds of irrelevant tools.
- Each tool should have a single, well-defined responsibility.
- Avoid overlapping tools.
- Dynamically register tools relevant to the current state or workflow.
- Static registration is fine for simple applications with a small tool set.
- Descriptions should explain what a tool accomplishes and what inputs it requires, rather than forcing a rigid procedure.

### Dynamic metadata and current state

- The implementation behind a tool can change without re-registering if the agent-facing name, description, and schema remain accurate.
- Agent-facing metadata must be re-registered when it changes under the current API model.
- The execute callback must still validate current inputs, authorization, and preconditions at execution time.
- The README currently references open discussion around in-place updates, lazy schemas, disabled state, and grouped tools.

### Language and schemas

- Use precise verbs.
- Distinguish immediate execution from starting a workflow.
- Use positive descriptions.
- Accept raw user input where reasonable and normalize in application code.
- Prefer self-explanatory enum values.
- Give parameters useful descriptions.

### Reliability and errors

- Validate strictly in code but avoid unnecessarily brittle schema constraints.
- Return clear, actionable failures.
- Handle rate limits and service failures gracefully.
- Synchronize visible UI state immediately after tool actions.

A skill should turn these recommendations into checks, generated templates, code review comments, and tests.

## 6. WebMCP and backend MCP boundary

Several issues now emphasize that WebMCP should not become a browser-dependent substitute for ordinary remote MCP.

The current boundary should be described this way:

- WebMCP is appropriate when the operation depends on the active browser client, current UI state, unsaved edits, selected items, local rendering state, or direct collaboration with the user.
- Browser-independent domain and service operations should generally remain exposed through remote MCP or another service-level interface.
- A web UI may call a service API, but that does not automatically mean every service operation should be wrapped as a WebMCP tool.

This is the core warning in issue [#322](https://github.com/webmachinelearning/webmcp/issues/322). The authoring skill should include this decision rule and flag suspicious wrappers.

## 7. Current browser and agent status at research time

The repository's `implementation-status.md` listed:

- Brave: experimental support in Leo AI chat;
- ChatGPT Desktop: WebMCP support;
- Chrome: Origin Trial live in Chrome 149, with a local testing flag;
- Edge: Origin Trial live in Edge 150;
- Firefox: standards position and Bugzilla tracking;
- Meta Ray-Ban Display: Web Apps support coming soon and disabled by default;
- Safari: standards position.

The exact state of browser support is unstable, so a skill should use feature detection, clearly label experimental paths, and avoid hardcoding one implementation as universal.

Issue [#266](https://github.com/webmachinelearning/webmcp/issues/266) reports a production commerce implementation that resolves both `document.modelContext` and `navigator.modelContext` because the namespace changed during implementation. The skill should support the current documented form while providing a compatibility note and feature detection.

Issue [#318](https://github.com/webmachinelearning/webmcp/issues/318) reports deployment friction from the `Origin-Agent-Cluster: ?1` header on non-Chromium browsers. The skill should surface deployment prerequisites instead of assuming that adding JavaScript is sufficient.

## 8. Full issue review: overall inventory

The GitHub API snapshot used for this research returned 212 issue threads and 111 pull request records. Pull requests were excluded from the issue inventory below, except when they were directly relevant. The issue list spans early API design, security, declarative forms, framework integration, discovery, service workers, agent behavior, browser implementation, and adoption.

### Early API and scope

- [#2](https://github.com/webmachinelearning/webmcp/issues/2) Bikeshed naming for the overall API - resolved naming around WebMCP.
- [#5](https://github.com/webmachinelearning/webmcp/issues/5) Update contributors - project maintenance.
- [#6](https://github.com/webmachinelearning/webmcp/issues/6) adds the ability for multi-modal authenticated session management - authenticated transitions between visual and non-visual agent modes.
- [#7](https://github.com/webmachinelearning/webmcp/issues/7) MCP Client Capabilities - web applications acting as MCP clients.
- [#8](https://github.com/webmachinelearning/webmcp/issues/8) Should tools be a means for capability discovery? - distinction between tools and higher-level capabilities.
- [#9](https://github.com/webmachinelearning/webmcp/issues/9) Introduce `outputSchema` - typed output and result descriptions.
- [#10](https://github.com/webmachinelearning/webmcp/issues/10) Developer Tools - inspect messages, usage, performance, and agent behavior.
- [#11](https://github.com/webmachinelearning/webmcp/issues/11) Prompt injection - prompt injection risks.
- [#15](https://github.com/webmachinelearning/webmcp/issues/15) API design - registration API shape.
- [#16](https://github.com/webmachinelearning/webmcp/issues/16) Add API to list / execute tools? - later led toward list and execute APIs.
- [#17](https://github.com/webmachinelearning/webmcp/issues/17) SVG diagrams need text and design updates - documentation quality.
- [#20](https://github.com/webmachinelearning/webmcp/issues/20) Interleaving user and Agent interaction with the site - concurrent interaction model.
- [#21](https://github.com/webmachinelearning/webmcp/issues/21) Elicitation - bringing the user's attention to a tab or UI.
- [#22](https://github.com/webmachinelearning/webmcp/issues/22) Declarative API Equivalent - forms as tools.
- [#23](https://github.com/webmachinelearning/webmcp/issues/23) External MCP Client API / Permissions - external clients and permission boundaries.
- [#24](https://github.com/webmachinelearning/webmcp/issues/24) Bikeshedding the global name - multiple agents and clients.
- [#25](https://github.com/webmachinelearning/webmcp/issues/25) Core design principles for WebMCP - SDK-style browser API versus direct MCP protocol transport.
- [#27](https://github.com/webmachinelearning/webmcp/issues/27) Use-cases targeted by WebMCP - use case scope.
- [#28](https://github.com/webmachinelearning/webmcp/issues/28) General process setup and collaboration with MCP - ecosystem collaboration.
- [#29](https://github.com/webmachinelearning/webmcp/issues/29) Allow developers to manage Agent's memory - resources and memory context.
- [#30](https://github.com/webmachinelearning/webmcp/issues/30) Async Dynamic Tool Registration - races when tools change after a call.
- [#31](https://github.com/webmachinelearning/webmcp/issues/31) Support agent to agent interaction - site agents and browser agents.
- [#32](https://github.com/webmachinelearning/webmcp/issues/32) Explore integration options for non browser Agents to integrate with WebMCP - external agent hooks.
- [#35](https://github.com/webmachinelearning/webmcp/issues/35) Communication with the TAG - platform architecture and extensibility.
- [#38](https://github.com/webmachinelearning/webmcp/issues/38) Support application's cloud based AI agents to connect with surface tools via webMCP - in-page tools for cloud agents.
- [#39](https://github.com/webmachinelearning/webmcp/issues/39) webllm or langgraph support? - in-page agents and local model frameworks.
- [#40](https://github.com/webmachinelearning/webmcp/issues/40) Is there a discussion group or discord associated with this? - community process.
- [#41](https://github.com/webmachinelearning/webmcp/issues/41) Support multimodal tool input/output - media inputs and outputs.
- [#43](https://github.com/webmachinelearning/webmcp/issues/43) Clarifying the scope of the proposal - scope clarification.
- [#44](https://github.com/webmachinelearning/webmcp/issues/44) Managing action specific permissions - action authorization.
- [#45](https://github.com/webmachinelearning/webmcp/issues/45) Privacy & security considerations for WebMCP - security and privacy.
- [#47](https://github.com/webmachinelearning/webmcp/issues/47) Should concurrent tool execution be allowed? - concurrency.
- [#48](https://github.com/webmachinelearning/webmcp/issues/48) Add a callback to inform the site when tool invocation should be aborted - cancellation.
- [#49](https://github.com/webmachinelearning/webmcp/issues/49) Should concurrent execution by multiple Agents be allowed? - multi-agent concurrency.
- [#50](https://github.com/webmachinelearning/webmcp/issues/50) Handling multiple elicitation requests - multiple user interaction requests.
- [#51](https://github.com/webmachinelearning/webmcp/issues/51) Define the API for in-page Agents to use a site's declared tools - page-local agents.
- [#52](https://github.com/webmachinelearning/webmcp/issues/52) Should we support cross-origin Agents across frame boundaries - frames and origins.
- [#53](https://github.com/webmachinelearning/webmcp/issues/53) Introduce semantic hints for side-effects of tools - read/write and side-effect metadata.
- [#54](https://github.com/webmachinelearning/webmcp/issues/54) Challenging assumptions of Identity within WebMCP - identity model.
- [#56](https://github.com/webmachinelearning/webmcp/issues/56) Is this a proposal or a group of proposals? - project shape.
- [#57](https://github.com/webmachinelearning/webmcp/issues/57) Allow iframes to declare tools - iframe support.
- [#58](https://github.com/webmachinelearning/webmcp/issues/58) socialize to broader ecosystem of web platforms - outreach.
- [#60](https://github.com/webmachinelearning/webmcp/issues/60) Transition from the WebMCP explainer to a Community Group spec draft - specification process.

### Declarative API and accessibility

- [#62](https://github.com/webmachinelearning/webmcp/issues/62) Grant user gesture activation when interacting with the webpage - user activation.
- [#63](https://github.com/webmachinelearning/webmcp/issues/63) Converting multiple submit buttons in forms to an MCP tool - declarative submit semantics.
- [#65](https://github.com/webmachinelearning/webmcp/issues/65) WebMCP accessibility considerations - accessibility review.
- [#66](https://github.com/webmachinelearning/webmcp/issues/66) Handling multiple labels - declarative labels.
- [#67](https://github.com/webmachinelearning/webmcp/issues/67) Should labels actually determine `title`? - declarative display title.
- [#68](https://github.com/webmachinelearning/webmcp/issues/68) Schema for minimum and maximum date - input schema synthesis.
- [#69](https://github.com/webmachinelearning/webmcp/issues/69) Using tool attributes on subordinate form control elements - declarative element attributes.
- [#71](https://github.com/webmachinelearning/webmcp/issues/71) Describing a single parameter across multiple elements - radio and grouped controls.
- [#73](https://github.com/webmachinelearning/webmcp/issues/73) Consider restricting maximum input lengths - security and internationalization.
- [#81](https://github.com/webmachinelearning/webmcp/issues/81) Proposal: Support file attachments via imperative WebMCP API - files and media.
- [#82](https://github.com/webmachinelearning/webmcp/issues/82) Proposal: Stream Tool Arguments - streaming input.
- [#85](https://github.com/webmachinelearning/webmcp/issues/85) Proposal: Tool execution lifecycle events - lifecycle observability.
- [#86](https://github.com/webmachinelearning/webmcp/issues/86) Proposal: Tool result content types beyond text - multimodal results.
- [#91](https://github.com/webmachinelearning/webmcp/issues/91) Redundancy with the accessibility tree - relationship between WebMCP and accessibility APIs.
- [#92](https://github.com/webmachinelearning/webmcp/issues/92) Who owns the validation layer? - browser, agent, or application validation.
- [#94](https://github.com/webmachinelearning/webmcp/issues/94) Define Declarative WebMCP integration with form-associated custom elements - custom elements.
- [#95](https://github.com/webmachinelearning/webmcp/issues/95) Treat hidden and visible elements in declarative MCP differently - visibility semantics.
- [#100](https://github.com/webmachinelearning/webmcp/issues/100) Natural language attributes - markup and descriptions.
- [#104](https://github.com/webmachinelearning/webmcp/issues/104) Input Changed Event Lifecycle - form lifecycle.
- [#110](https://github.com/webmachinelearning/webmcp/issues/110) `sensitiveHint` annotation for tool outputs and a standardized secret reference content type - secret handling.
- [#119](https://github.com/webmachinelearning/webmcp/issues/119) Add missing MCP tool annotations - destructive, idempotent, and open-world hints.
- [#122](https://github.com/webmachinelearning/webmcp/issues/122) Invoking tools: should we validate model arguments against inputSchema parameters? - input validation.
- [#126](https://github.com/webmachinelearning/webmcp/issues/126) Where to fire `toolactivated` and `toolcanceled` events? - declarative events.
- [#133](https://github.com/webmachinelearning/webmcp/issues/133) Add `title` property to `ModelContextTool` - display labels.
- [#135](https://github.com/webmachinelearning/webmcp/issues/135) Cross-document tool response mechanism - navigation and form responses.
- [#138](https://github.com/webmachinelearning/webmcp/issues/138) Declarative API Fit for JS-Driven Forms - declarative API and real applications.
- [#139](https://github.com/webmachinelearning/webmcp/issues/139) Communicate Validation Errors to Agent Prior to Form Submission - form validation.
- [#140](https://github.com/webmachinelearning/webmcp/issues/140) `SubmitEvent.prototype.respondWith` Breaks the Event Contract - event API.
- [#144](https://github.com/webmachinelearning/webmcp/issues/144) Declarative API should not be provided natively - scope of declarative support.
- [#157](https://github.com/webmachinelearning/webmcp/issues/157) How do agents handle pre-filled or user-modified form values? - human edits and form state.
- [#163](https://github.com/webmachinelearning/webmcp/issues/163) ToolAnnotations should be implemented for Declarative Tools - annotations for forms.
- [#182](https://github.com/webmachinelearning/webmcp/issues/182) How to expose failed declarative tool registration - registration errors.
- [#210](https://github.com/webmachinelearning/webmcp/issues/210) Define the declarative input-schema synthesis algorithm - current TODO area.
- [#276](https://github.com/webmachinelearning/webmcp/issues/276) Preserve language and direction for declarative tool descriptions - i18n.
- [#286](https://github.com/webmachinelearning/webmcp/issues/286) Include `aria-label` as part of declarative tool parameter description sources - accessibility labels.
- [#307](https://github.com/webmachinelearning/webmcp/issues/307) Clarify caller lifecycle for non-autosubmit declarative tools - pending human approval.
- [#316](https://github.com/webmachinelearning/webmcp/issues/316) Guidance for sensitive form fields - credentials, card data, OTP, national IDs.

### Security, privacy, identity, and authorization

- [#96](https://github.com/webmachinelearning/webmcp/issues/96) Address agent-to-tool trust, scoped permissions, and delegation context - identity and delegation.
- [#102](https://github.com/webmachinelearning/webmcp/issues/102) Proposal: Per-tool scopes for WebMCP - scope control.
- [#105](https://github.com/webmachinelearning/webmcp/issues/105) Proposal: Agent Identity Verification and Authorization Framework - agent identity.
- [#106](https://github.com/webmachinelearning/webmcp/issues/106) Supporting interoperable probabilistic defense structures through shared attack eval datasets - security evaluation.
- [#116](https://github.com/webmachinelearning/webmcp/issues/116) Agent allowlist use cases and requirements - allowlists.
- [#118](https://github.com/webmachinelearning/webmcp/issues/118) Agent negotiation - capabilities and negotiation.
- [#121](https://github.com/webmachinelearning/webmcp/issues/121) WebMCP Security Considerations - security text.
- [#154](https://github.com/webmachinelearning/webmcp/issues/154) Threat modeling - threat model.
- [#155](https://github.com/webmachinelearning/webmcp/issues/155) `userConsent` communication from User Agent to Web Application - consent.
- [#159](https://github.com/webmachinelearning/webmcp/issues/159) Protecting tools from 3P scripts in the top-level context - third-party scripts.
- [#160](https://github.com/webmachinelearning/webmcp/issues/160) Support cross-frame tool enumeration and composability while handling name collisions - frame composition.
- [#162](https://github.com/webmachinelearning/webmcp/issues/162) The Human Consent Layer - human authorization.
- [#174](https://github.com/webmachinelearning/webmcp/issues/174) WebMCP design fundamentally breaks origin isolation - origin isolation.
- [#176](https://github.com/webmachinelearning/webmcp/issues/176) Hint for reversible or consequential actions - effect annotation.
- [#178](https://github.com/webmachinelearning/webmcp/issues/178) Document `Permissions-Policy: tools=()` as a security control - opt-out and sensitive pages.
- [#180](https://github.com/webmachinelearning/webmcp/issues/180) Per-tool annotations for where a tool is allowed to run - exposure scope.
- [#191](https://github.com/webmachinelearning/webmcp/issues/191) Surface `callerOrigin` on `ModelContextClient` - caller identity.
- [#211](https://github.com/webmachinelearning/webmcp/issues/211) Declarative API creates undocumented HTML injection and agent hijacking escalation path - prompt injection.
- [#219](https://github.com/webmachinelearning/webmcp/issues/219) Future length limits need to define the text unit - limits and i18n.
- [#239](https://github.com/webmachinelearning/webmcp/issues/239) Grammar-level structural mitigation for prompt injection - prompt injection.
- [#257](https://github.com/webmachinelearning/webmcp/issues/257) Agent-Scoped Cookies - agent identity, marked beyond scope.
- [#282](https://github.com/webmachinelearning/webmcp/issues/282) No structured way to signal a tool's refusal - application refusal versus platform failure.
- [#288](https://github.com/webmachinelearning/webmcp/issues/288) A user agent that invokes tools and automates the page can complete the page's own human-approval step - consent bypass risk.
- [#291](https://github.com/webmachinelearning/webmcp/issues/291) `readOnlyHint` cannot distinguish a reversible write from a commit - effect semantics.
- [#298](https://github.com/webmachinelearning/webmcp/issues/298) Add page-enforced write boundaries as a mitigation for agent over-reach - security documentation.
- [#313](https://github.com/webmachinelearning/webmcp/issues/313) Mitigations for profound privacy and security issues seem to be missing? - large-scale threat concerns.
- [#314](https://github.com/webmachinelearning/webmcp/issues/314) Visible UI and forms might have fewer open-ended prompt injection attacks - visible UI as a mitigation.
- [#317](https://github.com/webmachinelearning/webmcp/issues/317) Host-controlled WebMCP access between iframes - frame topology.
- [#323](https://github.com/webmachinelearning/webmcp/issues/323) Define specific errors for tool execution failures - platform failures versus tool failures.

### Remote MCP, external clients, service workers, and discovery

- [#74](https://github.com/webmachinelearning/webmcp/issues/74) WebExtensions API to enumerate and invoke tools - browser extension collaboration.
- [#83](https://github.com/webmachinelearning/webmcp/issues/83) Proposal: API for connecting to remote MCP servers - remote bridge.
- [#84](https://github.com/webmachinelearning/webmcp/issues/84) Proposal: Standard MCP-to-WebMCP tool format converter - schema and result conversion.
- [#87](https://github.com/webmachinelearning/webmcp/issues/87) Proposal: Session and authentication context for tools - sessions.
- [#90](https://github.com/webmachinelearning/webmcp/issues/90) List of sites supporting WebMCP - adoption and discovery.
- [#97](https://github.com/webmachinelearning/webmcp/issues/97) Clarifying WebMCP's Place in the Machine Readable Web Stack - relationship to schema.org and structured web metadata.
- [#131](https://github.com/webmachinelearning/webmcp/issues/131) Feature Request: Auto-Discovery for Tool Registration - marked functions and generated metadata; closed as a backlog/userland direction.
- [#166](https://github.com/webmachinelearning/webmcp/issues/166) Forward-compatible discoverability profile and signed reference - discoverability.
- [#188](https://github.com/webmachinelearning/webmcp/issues/188) Tool retrieval: wildcard or not - discovery and selection.
- [#192](https://github.com/webmachinelearning/webmcp/issues/192) Transitioning WebMCP to the working group? - standards process.
- [#212](https://github.com/webmachinelearning/webmcp/issues/212) Persistent tools via workers - persistence.
- [#227](https://github.com/webmachinelearning/webmcp/issues/227) Tool discovery should not be limited to a single traversable navigable - browsing context discovery.
- [#242](https://github.com/webmachinelearning/webmcp/issues/242) App -> Agent explicit integration/manifest? - page-to-agent flow and app integration.
- [#252](https://github.com/webmachinelearning/webmcp/issues/252) Hosting official polyfill for WebMCP - official compatibility layer.
- [#274](https://github.com/webmachinelearning/webmcp/issues/274) Skills.sh: A community directory/registry for WebMCP tools - external discovery directory; closed.
- [#322](https://github.com/webmachinelearning/webmcp/issues/322) Prevent WebMCP from becoming a browser-dependent substitute for remote MCP - architectural boundary.

### Frameworks, developer tooling, implementation, and adoption

- [#93](https://github.com/webmachinelearning/webmcp/issues/93) Proposal: Tool active state - tools that exist but are currently unavailable.
- [#103](https://github.com/webmachinelearning/webmcp/issues/103) WebMCP Interface Semantics and potential alignment with Agent IDL - semantic contracts.
- [#127](https://github.com/webmachinelearning/webmcp/issues/127) Community polyfill: `webmcp-core` - zero-dependency polyfill, SSR compatibility, types, tests.
- [#130](https://github.com/webmachinelearning/webmcp/issues/130) Tool unregistration design - lifecycle.
- [#134](https://github.com/webmachinelearning/webmcp/issues/134) Shared Input Schema Fragments - schema reuse.
- [#136](https://github.com/webmachinelearning/webmcp/issues/136) Untrusted Annotation for Tool Responses - result trust metadata.
- [#141](https://github.com/webmachinelearning/webmcp/issues/141) Composite Tools for WebMCP - capabilities over clicks.
- [#148](https://github.com/webmachinelearning/webmcp/issues/148) Proposal: Add Sampling Support to WebMCP - sampling.
- [#150](https://github.com/webmachinelearning/webmcp/issues/150) Support async tool notifications and post-action callbacks - lifecycle notifications.
- [#151](https://github.com/webmachinelearning/webmcp/issues/151) Reactive State Streaming via Resource Subscriptions - state streaming.
- [#153](https://github.com/webmachinelearning/webmcp/issues/153) Internationalization considerations - i18n.
- [#158](https://github.com/webmachinelearning/webmcp/issues/158) Rename `execute` to `run` - naming.
- [#161](https://github.com/webmachinelearning/webmcp/issues/161) Proposal: Skills - workflow-level context for tool composition.
- [#163](https://github.com/webmachinelearning/webmcp/issues/163) ToolAnnotations for declarative tools - declarative metadata.
- [#165](https://github.com/webmachinelearning/webmcp/issues/165) WebMCP elicitation via `requestUserInteraction()` - user interaction API.
- [#167](https://github.com/webmachinelearning/webmcp/issues/167) Proposal: Dynamic Tool Definitions in WebMCP - lazy schemas and disabled state; later marked closed in the API snapshot, but the README still references related ideas.
- [#168](https://github.com/webmachinelearning/webmcp/issues/168) Standardized capabilities - capability semantics.
- [#186](https://github.com/webmachinelearning/webmcp/issues/186) WebMCP real-user measurement - deployment measurement.
- [#196](https://github.com/webmachinelearning/webmcp/issues/196) WebMCP tool execution progress report - progress.
- [#198](https://github.com/webmachinelearning/webmcp/issues/198) Declarative human-in-the-loop policy hints - user approval.
- [#199](https://github.com/webmachinelearning/webmcp/issues/199) Frameworks and WebMCP Meta Issue - React/Vue/Svelte/Angular lifecycle and framework integration.
- [#207](https://github.com/webmachinelearning/webmcp/issues/207) Support developer tooling - framework debugging tools and agent-facing inspection.
- [#222](https://github.com/webmachinelearning/webmcp/issues/222) Code mode / bulk tool execution - batching and reduced round trips.
- [#224](https://github.com/webmachinelearning/webmcp/issues/224) Tool `title` and `inputSchema`: what to expose when not provided? - API shape.
- [#229](https://github.com/webmachinelearning/webmcp/issues/229) Add method to ModelContext for application-driven observation - context.
- [#231](https://github.com/webmachinelearning/webmcp/issues/231) Observations are specified as context thrashing - observation cost.
- [#232](https://github.com/webmachinelearning/webmcp/issues/232) Expose agent sessions and their compaction - agent harness context.
- [#234](https://github.com/webmachinelearning/webmcp/issues/234) `registerTool` should return registered tool instead of undefined - ergonomics.
- [#236](https://github.com/webmachinelearning/webmcp/issues/236) Reposition feature as a generic communication tool? - scope and generic messaging.
- [#237](https://github.com/webmachinelearning/webmcp/issues/237) Various questions and feedback - general feedback.
- [#255](https://github.com/webmachinelearning/webmcp/issues/255) Tool collections: coarse-grained grouping with progressive disclosure - large SPA tool lists.
- [#256](https://github.com/webmachinelearning/webmcp/issues/256) Origin Trial research note: observations on tool exposure, validation, and context cost - empirical evaluation and evidence.
- [#261](https://github.com/webmachinelearning/webmcp/issues/261) Preserve completed WebMCP tasks as reviewable workflow documents - save successful workflows.
- [#262](https://github.com/webmachinelearning/webmcp/issues/262) WebMCP loses important context when tools appear or disappear - semantic unavailable state.
- [#263](https://github.com/webmachinelearning/webmcp/issues/263) Implementer note: same-core decision tool and Inspector natural-language-to-enum mapping - implementation and agent-facing input mapping.
- [#266](https://github.com/webmachinelearning/webmcp/issues/266) Implementation report: agent commerce storefront on WebMCP - production commerce deployment.
- [#267](https://github.com/webmachinelearning/webmcp/issues/267) Turn awareness - turn-level agent context.
- [#270](https://github.com/webmachinelearning/webmcp/issues/270) Add optional `group` field to the tool definition for DevTools grouping - tooling grouping.
- [#271](https://github.com/webmachinelearning/webmcp/issues/271) Add optional `group` field to the tool definition for DevTools grouping - duplicate/group follow-up.
- [#272](https://github.com/webmachinelearning/webmcp/issues/272) WebMCP accessibility review checklist - accessibility requirements.
- [#273](https://github.com/webmachinelearning/webmcp/issues/273) WebMCP internationalization review checklist - i18n requirements.
- [#277](https://github.com/webmachinelearning/webmcp/issues/277) Define accessibility requirements for WebMCP user-agent UI - browser UI.
- [#282](https://github.com/webmachinelearning/webmcp/issues/282) No structured way to signal a tool's refusal - result semantics.
- [#290](https://github.com/webmachinelearning/webmcp/issues/290) Focused WebMCP callback observability - instrumentation.
- [#292](https://github.com/webmachinelearning/webmcp/issues/292) Tool results are untyped, so every page invents its own truncation contract - result contracts.
- [#293](https://github.com/webmachinelearning/webmcp/issues/293) Two agent-browser behaviours a page cannot detect or recover from - browser implementation feedback.
- [#297](https://github.com/webmachinelearning/webmcp/issues/297) Model-aware tool definitions - different descriptions and schemas per model.
- [#304](https://github.com/webmachinelearning/webmcp/issues/304) Implementation information: DeepDeck WebMCP browser and agent - external browser implementation.
- [#306](https://github.com/webmachinelearning/webmcp/issues/306) Tool Namespaces/Groups for Filtering and Preventing Tool Explosion in Large SPAs - framework and enterprise SPA use case.
- [#312](https://github.com/webmachinelearning/webmcp/issues/312) Keeping the agent in-sync with the page's context - page context updates.
- [#318](https://github.com/webmachinelearning/webmcp/issues/318) Origin-Agent-Cluster requirement requires custom server headers on non-Chromium browsers - deployment friction.
- [#319](https://github.com/webmachinelearning/webmcp/issues/319) Deployment data for implementation-status - 580 sites registering tools in one reported audit.
- [#323](https://github.com/webmachinelearning/webmcp/issues/323) Define specific errors for tool execution failures - failure taxonomy.
- [#328](https://github.com/webmachinelearning/webmcp/issues/328) Signaling tool stability to agents - pages need to signal that tool registration is still in flux.

### Other project and process issues

- [#101](https://github.com/webmachinelearning/webmcp/issues/101) `provideContext` overwriting previously registered tools - registration semantics.
- [#108](https://github.com/webmachinelearning/webmcp/issues/108) alternative approach - alternative design.
- [#109](https://github.com/webmachinelearning/webmcp/issues/109) WebMCP for Enterprise POS, ERP, ASR and industry scenarios in China - industry use cases.
- [#114](https://github.com/webmachinelearning/webmcp/issues/114) No versioning or capability negotiation mechanism - versioning.
- [#115](https://github.com/webmachinelearning/webmcp/issues/115) No mechanism for tool deprecation or soft removal - deprecation.
- [#117](https://github.com/webmachinelearning/webmcp/issues/117) Allow iframes to deal with tools in their parent/top-level context - iframe context.
- [#128](https://github.com/webmachinelearning/webmcp/issues/128) PR preview not working - project automation.
- [#129](https://github.com/webmachinelearning/webmcp/issues/129) Prevent scripts from unregistering tools they did not register - ownership.
- [#142](https://github.com/webmachinelearning/webmcp/issues/142) need api - incomplete issue.
- [#145](https://github.com/webmachinelearning/webmcp/issues/145) Codify MCP tool name requirements into the spec - naming.
- [#170](https://github.com/webmachinelearning/webmcp/issues/170) Issues Resolved - issue maintenance.
- [#172](https://github.com/webmachinelearning/webmcp/issues/172) how to install - onboarding.
- [#173](https://github.com/webmachinelearning/webmcp/issues/173) Make tools Document-scoped instead of Window-scoped - scope.
- [#175](https://github.com/webmachinelearning/webmcp/issues/175) Consider making `registerTool()` return a Promise - registration timing.
- [#187](https://github.com/webmachinelearning/webmcp/issues/187) Replace Direct backend MCP flow image with Mermaid diagram - docs.
- [#190](https://github.com/webmachinelearning/webmcp/issues/190) Hosting official TypeScript types for WebMCP - types package.
- [#193](https://github.com/webmachinelearning/webmcp/issues/193) Self-Review Questionnaire: Security and Privacy - process.
- [#198](https://github.com/webmachinelearning/webmcp/issues/198) Add declarative human-in-the-loop policy hints - declarative policy.
- [#206](https://github.com/webmachinelearning/webmcp/issues/206) Sort `getTools()` lexicographically - deterministic retrieval.
- [#208](https://github.com/webmachinelearning/webmcp/issues/208) Experimenting with WebMCP and the Web Sustainability Guidelines - sustainability.
- [#213](https://github.com/webmachinelearning/webmcp/issues/213) `registerTool()` stores definition in the model context struct - spec bug.
- [#214](https://github.com/webmachinelearning/webmcp/issues/214) Active document assertion inversion - spec bug.
- [#215](https://github.com/webmachinelearning/webmcp/issues/215) Tool change notification skips the registering document - spec bug.
- [#218](https://github.com/webmachinelearning/webmcp/issues/218) Should unregistering a tool cancel in-flight executions? - lifecycle.
- [#230](https://github.com/webmachinelearning/webmcp/issues/230) `registerTool` could send an observation - observations.
- [#233](https://github.com/webmachinelearning/webmcp/issues/233) Partition browser agents by origin - agents and origins.
- [#238](https://github.com/webmachinelearning/webmcp/issues/238) ioiopaut789 - invalid/noise issue.
- [#243](https://github.com/webmachinelearning/webmcp/issues/243) `executeTool()` should take an object, not a string - argument encoding.
- [#261](https://github.com/webmachinelearning/webmcp/issues/261) Preserve completed WebMCP tasks as reviewable workflow documents - workflow artifact.
- [#268](https://github.com/webmachinelearning/webmcp/issues/268) Working on Brave, not working on MS Edge and Chrome - browser compatibility bug.
- [#274](https://github.com/webmachinelearning/webmcp/issues/274) Skills.sh community directory/registry - external discovery.
- [#278](https://github.com/webmachinelearning/webmcp/issues/278) Clarify `executeTool` argument encoding and returned schema shape - implementation clarification.
- [#287](https://github.com/webmachinelearning/webmcp/issues/287) Clarification: `RegisteredTool.inputSchema`, `executeTool` input, and result types - string versus object.
- [#288](https://github.com/webmachinelearning/webmcp/issues/288) User agent can complete the page's own human approval step - agent automation boundary.
- [#299](https://github.com/webmachinelearning/webmcp/issues/299) Let a tool deliver a final result on caller abort - cancellation result.
- [#300](https://github.com/webmachinelearning/webmcp/issues/300) Unregistration must not fail an in-flight execution - lifecycle.
- [#303](https://github.com/webmachinelearning/webmcp/issues/303) Tool aliases - naming.
- [#305](https://github.com/webmachinelearning/webmcp/issues/305) Run `executeTool` completion steps in parallel - execution algorithm.
- [#307](https://github.com/webmachinelearning/webmcp/issues/307) Clarify caller lifecycle for non-autosubmit declarative tools - caller pending state.
- [#308](https://github.com/webmachinelearning/webmcp/issues/308) Preserve what a tool already produced across the execution boundary - refusal, abort, and unregistration result handling.
- [#313](https://github.com/webmachinelearning/webmcp/issues/313) Mitigations for profound privacy and security issues - privacy review.
- [#316](https://github.com/webmachinelearning/webmcp/issues/316) Sensitive form fields - security guidance.
- [#317](https://github.com/webmachinelearning/webmcp/issues/317) Host-controlled access between iframes - security topology.

## 9. Most relevant existing proposals and what they imply

### Issue #131: auto-discovery for marked functions

This is the closest existing idea to code generation. It describes reducing boilerplate by explicitly marking functions and deriving tool metadata. The issue asks whether this should be a browser feature or a userland library.

Implication for our proposal: do not present the authoring skill as a new native auto-discovery feature. Present it as userland tooling that can produce explicit, reviewable registrations.

### Issue #161: runtime skills

This proposal uses "skills" in a different sense. It suggests that a web page could register a higher-level skill containing tools, instructions, and structured context, for example shopping guidance and policies.

Implication: avoid calling the authoring skill a WebMCP runtime skill without explaining the distinction. Use terms such as `WebMCP authoring skill`, `developer skill`, or `authoring assistant`.

### Issue #199: frameworks meta issue

This is the strongest place to connect the proposal. It discusses:

- stale closures;
- registering rarely and reading current state at execution time;
- framework reconciliation and stable identity;
- scoped and composable registries;
- pending/unavailable tool states;
- persistence across routes, views, and pages.

The issue explicitly welcomes contributions and sub-issues.

Implication: the skill should be framework-aware, not just a code snippet generator.

### Issue #207: developer tooling

This issue proposed WebMCP tools supplied by React, Angular, MobX, NgRx, and similar frameworks for DevTools AI debugging. It was linked to PR #253, which added a `debugging` annotation so developer tools can be distinguished from end-user tools.

Implication: include support for `debugging` annotations in the skill, but do not confuse app-facing tools with framework debugging tools.

### Issue #255: tool collections and progressive disclosure

This issue describes 50 to 100+ tools in large SPAs, context waste, tool confusion, and the need for coarse-grained groups. It proposes collection-like structures with stable identity across navigation and round trips.

Implication: the skill should report tool explosion and suggest grouping or dynamic registration. It should not claim to solve the platform-level collection API.

### Issue #274: Skills.sh discovery registry

This was a community project exploring an external registry for WebMCP tools and sites. It relates to the README's open question about capability discovery and manifests.

Implication: our authoring skill is not a discovery registry. It can generate documentation or metadata that a registry could consume, but discovery is a separate concern.

### Issue #252: official polyfill

The issue notes that browser support timelines differ and several independent polyfills exist.

Implication: generated integrations should use feature detection and test against a compatibility layer where appropriate, but the skill should not present a polyfill as equivalent to native browser security mediation.

### Issue #316: sensitive declarative fields

This issue points out that forms can expose card numbers, CVV, passwords, OTPs, and national IDs as tool parameters unless explicitly handled.

Implication: sensitive-field detection should be a first-class skill check, not an optional warning.

### Issue #322: remote MCP boundary

This issue warns that ordinary service operations may be incorrectly wrapped as WebMCP tools simply because the web page already calls the backend.

Implication: the skill should help decide whether a capability belongs in WebMCP or remote MCP.

### Issue #328: tool stability signal

This issue describes agents observing a page before asynchronous tool registration has settled, especially during hydration and SPA route changes.

Implication: the skill should detect asynchronous registration and document stability assumptions, even if the final platform API is not yet standardized.

## 10. What the authoring skill should actually do

### Input

The skill receives an existing web project and a requested user workflow, for example:

> Add WebMCP support for searching products, filtering the current product grid, and starting checkout. Keep payment confirmation in the human UI.

### Workflow

1. Read project instructions and framework configuration.
2. Identify the UI route and existing functions used by the workflow.
3. Map the workflow into candidate tools.
4. Reject tools that are too low-level, redundant, browser-independent, or unsafe.
5. Choose imperative versus declarative integration.
6. Generate code using the project's existing state and application functions.
7. Add runtime authorization, precondition checks, and current-state reads.
8. Add annotations, schemas, descriptions, abort handling, and structured results.
9. Add registration cleanup and lifecycle handling.
10. Add tests and a browser smoke path.
11. Produce a report with exposed tools, risks, assumptions, and manual review points.

### Generated artifacts

- WebMCP integration code;
- schema definitions;
- framework lifecycle adapter or hook code;
- tests for registration, execution, cancellation, and UI synchronization;
- security review;
- tool inventory and context-budget report;
- developer documentation;
- a patch/diff for review.

### Static checks

The skill should detect:

- stale state captured when registration happens;
- missing runtime authorization;
- missing current-state validation;
- tool descriptions without useful parameter descriptions;
- overlapping tool names or responsibilities;
- excessive number of tools;
- tools that expose arbitrary internal IDs instead of understandable values;
- missing UI synchronization;
- missing `AbortSignal` support for long-running operations;
- missing `consequentialHint` on side effects;
- sensitive form controls in generated schemas;
- tools that return unbounded data;
- tools wrapping backend operations that should remain remote MCP;
- registration that depends on unstable component mount cycles;
- hardcoded `document.modelContext` or `navigator.modelContext` without feature detection where compatibility matters;
- missing `Origin-Agent-Cluster` deployment note where relevant;
- use of experimental browser-only behavior without a warning.

### Framework strategy

The skill should initially target one framework rather than all of them. React/Next.js is a reasonable first target because the framework issue explicitly discusses React-like stale closures, cleanup, and reconciliation.

Later adapters could cover:

- Vue;
- Svelte;
- Angular;
- vanilla HTML forms;
- Web Components.

The generated pattern should prefer stable registration plus fresh state reads inside `execute`, unless agent-facing metadata itself changes. Re-registering on every state change should be treated as a deliberate choice because it can cause tool churn and context races.

## 11. Fit assessment

### Strong fit

The idea aligns with:

- WebMCP's goal to simplify AI agent integration;
- WebMCP's code reuse principle;
- the framework lifecycle concerns in #199;
- the developer tooling direction in #207;
- the adoption and documentation gap;
- the tool budget and grouping discussions in #88 and #255;
- the security guidance gaps in #154 and #316.

### Weak fit if framed incorrectly

The idea becomes weak if it is framed as:

- a new browser API;
- a replacement for remote MCP;
- a generic function auto-exposer;
- a discovery registry;
- a runtime `registerSkill()` API;
- a promise that generated code is automatically safe;
- a tool that hides user consent.

### Overall assessment

- As developer tooling for the WebMCP ecosystem: strong, approximately 8/10.
- As a change to the WebMCP browser specification: weak, approximately 3/10.
- As a community proposal with a working draft: good, approximately 7/10.

The proposal should ask whether the community wants to endorse, link, host, or collaborate on the draft. It should not ask the specification to standardize the skill itself.

## 12. Recommended proposal title

Preferred:

> Proposal: Framework-aware WebMCP authoring and validation skill

Other options:

- WebMCP Authoring Skill for AI Coding Agents
- WebMCP Integration Assistant for Existing Web Applications
- Reference Authoring Workflow for WebMCP Integrations

Avoid:

- WebMCP Skill API, because that collides with runtime skills in #161;
- Automatic WebMCP Generator, because it sounds unsafe and too broad;
- WebMCP MCP Server Generator, because it blurs the WebMCP and remote MCP boundary.

## 13. Draft proposal to show the WebMCP community

```md
# Proposal: Framework-aware WebMCP authoring and validation skill

## Summary

I drafted an authoring skill for AI coding agents that helps developers add WebMCP
to existing web applications.

The skill is intended for the development workflow, not as a new browser API. It
inspects an application, identifies suitable user-facing workflows, generates
imperative or declarative WebMCP integration code, and validates the result against
WebMCP best practices and security guidance.

## Motivation

The WebMCP API is intentionally small, but production integration requires
framework-specific and application-specific decisions around:

- tool boundaries and naming;
- current application state and stale closures;
- registration lifecycle and cleanup;
- dynamic tool registration;
- tool count and context budget;
- schema and runtime validation;
- UI synchronization;
- user confirmation and consequential actions;
- sensitive form fields and private data;
- browser compatibility and testing.

These decisions are currently handled independently by each application. A coding
skill could make the recommended patterns easier to adopt and provide a repeatable
reference workflow for WebMCP developers.

## Proposed capabilities

The skill would:

1. Inspect an existing application and identify candidate user workflows.
2. Suggest a minimal, non-overlapping tool inventory.
3. Reuse existing client-side application logic instead of simulating DOM clicks.
4. Generate imperative `registerTool()` or declarative form integrations.
5. Adapt the integration to common framework lifecycle patterns.
6. Detect stale closures, missing cleanup, excessive registration churn, and
   unsynchronized UI state.
7. Generate schemas, parameter descriptions, runtime validation, structured
   results, and actionable errors.
8. Detect sensitive fields and consequential operations.
9. Generate tests, browser smoke tests, and a security review.
10. Produce documentation describing the exposed tools and their user-visible effects.

## Example

Given an existing shopping application and the request:

"Expose product search, filtering of the current product grid, and the start of
checkout, while keeping payment confirmation in the human UI."

The skill would inspect the existing application logic and propose a small set of
tools such as:

- `search-products`;
- `show-products`;
- `start-checkout`.

It would generate schemas, reuse the application's existing functions, mark the
checkout transition as consequential where appropriate, preserve the visible UI,
and leave payment entry and final confirmation to the user.

## Relationship to WebMCP

This is developer tooling and reference guidance, not a proposal to add a new
browser API. It could live in a companion repository, an examples repository, or
another community-maintained location linked from WebMCP documentation.

The proposal is related to the framework discussion in #199, the developer tooling
discussion in #207, and the auto-discovery discussion in #131, but it does not
require changing the WebMCP API.

## Non-goals

The skill would not:

- automatically expose arbitrary functions;
- infer authorization or user consent;
- replace remote MCP integrations;
- define a WebMCP registry or discovery service;
- replace the human-facing web interface;
- treat generated code as safe without developer review.

## Initial draft

I have prepared a draft skill and would appreciate feedback on:

1. whether this is a useful contribution to the WebMCP ecosystem;
2. whether it should be linked from the main repository or hosted separately;
3. which framework and example application would be most useful for an initial reference;
4. which current WebMCP best practices or security considerations the skill should
   enforce;
5. whether the community would be interested in reviewing a small prototype.
```

## 14. Short message to accompany the draft

```text
I have prepared a draft authoring skill for AI coding agents that helps developers
integrate WebMCP into existing applications.

It is not a proposal for a new WebMCP browser API and it is separate from the
runtime "skills" discussion. The draft focuses on framework-aware integration,
tool boundary design, lifecycle correctness, schemas, security checks, testing,
and documentation.

I would appreciate feedback on whether this would be useful as community tooling,
an examples project, or a companion repository linked from WebMCP.
```

## 15. Suggested references to include in the issue

- Main repository and README: https://github.com/webmachinelearning/webmcp
- Main spec: https://github.com/webmachinelearning/webmcp/blob/main/index.bs
- Declarative API explainer: https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md
- Service worker explainer: https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md
- Best practices: https://developer.chrome.com/docs/ai/webmcp/best-practices
- Secure tools guidance: https://developer.chrome.com/docs/ai/webmcp/secure-tools
- Contribution rules: https://github.com/webmachinelearning/webmcp/blob/main/CONTRIBUTING.md
- Frameworks meta issue: https://github.com/webmachinelearning/webmcp/issues/199
- Runtime skills proposal: https://github.com/webmachinelearning/webmcp/issues/161
- Auto-discovery issue: https://github.com/webmachinelearning/webmcp/issues/131
- Developer tooling issue: https://github.com/webmachinelearning/webmcp/issues/207
- Tool collections: https://github.com/webmachinelearning/webmcp/issues/255
- Official polyfill: https://github.com/webmachinelearning/webmcp/issues/252
- Sensitive form fields: https://github.com/webmachinelearning/webmcp/issues/316
- Remote MCP boundary: https://github.com/webmachinelearning/webmcp/issues/322
- Tool stability: https://github.com/webmachinelearning/webmcp/issues/328

## 16. Practical submission strategy

1. Show the draft skill, not just the idea.
2. Explain that it is a developer authoring tool, not a runtime WebMCP feature.
3. Link to #199, #131, and #207 to show that the proposal follows existing discussions.
4. Include one concrete example with a before/after diff.
5. Include generated tests and a security report.
6. State the initial framework scope clearly.
7. Ask whether the community prefers a companion repository, examples, or documentation link.
8. Avoid claiming official status before maintainers review it.

The strongest contribution is a small, working, reviewable draft that demonstrates
how the skill handles real framework lifecycle and security issues. The proposal
should make it easy for maintainers to say yes to collaboration without committing
the specification to a new API.

## 17. Final conclusion

The idea is strong because WebMCP has a small API but a large integration surface.
The difficult part is not typing `registerTool()`. The difficult part is deciding
what should be exposed, keeping the tool correct as the application changes, not
overloading the agent's context, preserving the human UI, and avoiding privacy and
security mistakes.

That is exactly where a framework-aware authoring skill can add value.

The correct pitch is:

> I prepared a draft skill that turns WebMCP guidance into a practical, reviewable
> integration workflow for AI coding agents. Is this useful as community tooling
> or as a companion project for WebMCP?
