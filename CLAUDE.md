# CLAUDE.md — Web Automation Generic Rulebook (Playwright)
> **Stack:** TypeScript · Playwright
> **IDE:** VS Code
> **Scope:** Best practices, language rules, naming conventions, do's & don'ts

---

## SECTION 1 — General Automation Best Practices

### 1.1 Test Design Principles
- Every test must be **independent and self-contained** — no test shares state with another test.
- Tests must be **deterministic** — flakiness is a defect. Investigate root causes; do not add retries as a fix.
- Follow the **AAA pattern** (Arrange → Act → Assert) in every test.
- Each `test()` validates exactly **one user behaviour** — do not chain multiple unrelated user journeys.
- Tests must represent **real user interactions** — assert what the user sees, not DOM structure.
- Design tests to be **parallel-safe by default** — never design for sequential execution.

### 1.2 Coverage Standards
- Every user journey must include: happy path, validation/error paths, and boundary/edge cases.
- Assert **navigation outcome** (URL, page title, landmark heading) after every significant user action.
- Cross-browser coverage must be driven through `playwright.config.ts` projects — never per-test configuration.
- Use `storageState` for authentication reuse — never re-login in every test.
- Always verify both element **presence** (exists and is visible) and **content** (text, value) in assertions.

### 1.3 Test Data Management
- Never hardcode test data (usernames, passwords, product IDs) inside spec files or page classes.
- Use JSON fixtures or typed data factory functions for all test input.
- Generate dynamic data (emails, order refs) at runtime via utility functions.
- Seed prerequisite state via API calls — never via UI navigation in `beforeEach`.
- Clean up created data via API in `afterEach` — never rely on manual or UI cleanup.
- Never use production data in tests.

### 1.4 Test Execution
- All tests must be runnable from the CLI with a single command: `npx playwright test`.
- Use project tags and `--grep` for selective test execution.
- All tests must support parallel execution out of the box — `fullyParallel: true`.
- Environment selection must be supported via environment variables (`.env` files).

---

## SECTION 2 — TypeScript Language Rules

### 2.1 Type Safety
- Always enable `"strict": true` in `tsconfig.json` — treat it as non-negotiable.
- **Never use `any`** — use `unknown` with type guards, proper interfaces, or generics instead.
- All function signatures must have explicit parameter types and return types.
- Prefer `interface` over `type` for object shapes; use `type` for unions, intersections, and primitives.
- Use `readonly` on properties that should not be mutated after initialisation.
- Use `as const` for literal arrays and objects that represent fixed sets of values.

```typescript
// ✅ Strict typing
interface UserCredentials {
  readonly email: string;
  readonly password: string;
}

async function login(credentials: UserCredentials): Promise<void> {
  ...
}

// ❌ Never use any
async function doSomething(data: any): Promise<any> { ... }
```

### 2.2 Async/Await
- Always use `async/await` — never `.then()/.catch()` chains in test or page code.
- All Playwright API calls are async — every call to a Playwright method must be `await`ed.
- Never use `Promise.resolve()` as a fake async wrapper — it hides real async issues.
- Use `Promise.all()` for concurrent independent operations — not sequential `await` chains.

```typescript
// ✅ Concurrent independent waits
await Promise.all([
  page.waitForURL('**/dashboard'),
  expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible(),
]);

// ❌ Unintentionally sequential
await page.waitForURL('**/dashboard');
await expect(page.getByRole('heading')).toBeVisible();
```

### 2.3 Null Safety
- Enable `"strictNullChecks": true` (included in `strict: true`).
- Use non-null assertion (`!`) only when you can guarantee non-null — add a comment justifying it.
- Prefer nullish coalescing (`??`) and optional chaining (`?.`) over explicit null checks.

### 2.4 Immutability
- Use `const` for all variable declarations — use `let` only when reassignment is genuinely needed.
- Never use `var`.
- Prefer `readonly` arrays and object properties to prevent accidental mutation.

### 2.5 Module Imports
- Use path aliases (configured in `tsconfig.json`) — never relative `../../..` imports more than two levels deep.
- Group imports: external libraries first, then internal modules, separated by a blank line.
- Never import the entire Playwright namespace — import only what is used.

```typescript
// ✅ Clean imports
import { test, expect } from '@fixtures/index';
import { LoginPage } from '@pages/auth/login.page';
import type { UserCredentials } from '@types/user.types';
```

### 2.6 Code Style
- Use `ESLint` with `@typescript-eslint` rules — enforce via pre-commit hook and CI.
- Use `Prettier` for consistent formatting — no manual style debates.
- Prefer arrow functions for callbacks — use `function` declarations for named utility functions.
- Use template literals for multi-variable string construction.

---

## SECTION 3 — Playwright Best Practices

### 3.1 Locator Strategy
Playwright locators must follow this priority order:

1. `getByRole()` — semantic, accessible, resilient to styling changes (preferred)
2. `getByLabel()` — for form inputs associated with labels
3. `getByTestId()` — with `data-testid` attributes (advocate for these in the app)
4. `getByText()` — for visible text content
5. `getByPlaceholder()` — for inputs with placeholder text
6. `locator('css')` — only when semantic locators are not viable
7. **Never** use XPath, absolute CSS paths, or positional selectors

```typescript
// ✅ Preferred locators
await page.getByRole('button', { name: 'Submit Order' }).click();
await page.getByLabel('Email address').fill(user.email);
await page.getByTestId('user-avatar').click();

// ❌ Fragile — never do this
await page.locator('div:nth-child(3) > button.css-abc123').click();
await page.locator('//html/body/div[1]/form/button').click();
```

### 3.2 Auto-Waiting and Assertions
- Playwright has built-in auto-waiting — never add manual delays before interactions.
- Use `expect(locator).toBeVisible()` over `isVisible()` — `expect` auto-retries with timeout.
- Use `expect(page).toHaveURL()` for navigation assertions — not `page.url()` with `===`.
- Always use Playwright's `expect` assertions — they are retry-aware and produce better failure messages.
- **Never use `waitForTimeout()`** in committed test code — it is a crutch that hides real issues.

```typescript
// ✅ Auto-retrying assertions
await expect(page).toHaveURL(/\/dashboard/);
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
await expect(page.getByTestId('user-count')).toHaveText('42');

// ❌ Point-in-time check — no retry
expect(await page.isVisible('.dashboard')).toBe(true);
```

### 3.3 Authentication
- Use `storageState` to save and reuse authenticated sessions.
- Create auth state in a dedicated `*.setup.ts` file that runs before test suites.
- Reference auth state in `playwright.config.ts` projects — never log in inside test `beforeEach`.
- Store auth state files in `.auth/` directory — add to `.gitignore`.
- Support multiple roles by creating separate auth state files per role.

### 3.4 Network and API Interactions
- Use `page.route()` for mocking network responses in isolation tests — document what is being mocked and why.
- Use `request` fixture for API-level setup and teardown alongside UI tests.
- Use `page.waitForResponse()` when a user action triggers a critical network call that must complete before asserting UI state.
- Never use `waitForLoadState('networkidle')` as a general-purpose wait — it is unreliable on dynamic apps; use specific element/URL assertions instead.

### 3.5 Test Isolation
- Each test must start from a clean, known state — use `storageState` for auth, API for data.
- Use `test.use({ storageState: ... })` at `describe` level to scope auth to specific test groups.
- Use `test.beforeEach` only for setup that applies to every test in a `describe` block.
- Never mutate shared test data between tests — each test must own its data.

### 3.6 Fixtures
- Use custom Playwright fixtures (extending `base`) to inject page objects into tests.
- Never instantiate page objects directly inside spec files — always via fixtures.
- Fixtures provide the correct setup/teardown lifecycle — prefer them over `beforeEach`/`afterEach` for page setup.

---

## SECTION 4 — BDD Practices with Playwright

> When Playwright tests use BDD-style organisation (e.g., via `playwright-bdd`):

### 4.1 Spec File Organisation
- Use `test.describe()` blocks to group tests by feature or user journey.
- Use `test.describe.serial()` only when sequential order is an absolute requirement — document why.
- `test.beforeEach` and `test.afterEach` must be scoped to the minimum relevant `describe` block.

### 4.2 Test Naming
- Use `should + outcome` format: `should display dashboard after login`.
- Name the `describe` block after the feature or component: `User Authentication`.
- Test names must be descriptive enough to understand the failure from the CI report alone.

```typescript
// ✅ Clear test structure
test.describe('Product Search', () => {
  test('should return results matching the search term', async ({ searchPage }) => { ... });
  test('should show an empty state when no results are found', async ({ searchPage }) => { ... });
  test('should filter results by category', async ({ searchPage }) => { ... });
});
```

---

## SECTION 5 — Naming Conventions

### 5.1 File Naming
| Artifact | Convention | Example |
|---|---|---|
| Spec file | `kebab-case.spec.ts` | `user-login.spec.ts` |
| Page Object | `kebab-case.page.ts` | `login.page.ts` |
| Component | `kebab-case.component.ts` | `navbar.component.ts` |
| Fixture file | `kebab-case.fixture.ts` or `index.ts` | `fixtures/index.ts` |
| Helper / utility | `kebab-case.helper.ts` | `auth.helper.ts` |
| Type definitions | `kebab-case.types.ts` | `user.types.ts` |
| Test data | `kebab-case.json` | `valid-users.json` |
| Auth state | `<role>.json` in `.auth/` | `.auth/admin.json` |
| Setup file | `<name>.setup.ts` | `auth.setup.ts` |
| Config | `playwright.config.ts` | fixed name |

### 5.2 Class and Interface Naming
| Type | Convention | Example |
|---|---|---|
| Page class | `PascalCase` + `Page` | `LoginPage`, `CheckoutPage` |
| Component class | `PascalCase` + `Component` | `NavbarComponent` |
| Interface | `PascalCase` (no `I` prefix) | `UserCredentials`, `ProductData` |
| Type alias | `PascalCase` | `UserRole`, `ApiResponse` |
| Enum | `PascalCase` (singular noun) | `UserRole`, `Environment` |
| Fixture type | `PascalCase` | `Pages`, `Components` |

### 5.3 Method Naming
| Method Type | Convention | Example |
|---|---|---|
| Page action | `camelCase` verb phrase | `fillEmail()`, `clickSubmit()` |
| Page query | `get` + noun, or `is` + condition | `getErrorMessage()`, `isModalVisible()` |
| Fixture | `camelCase` noun | `loginPage`, `dashboardPage` |
| Data factory | `create` + noun, `build` + noun | `createUser()`, `buildOrderPayload()` |
| Helper function | descriptive verb phrase | `generateRandomEmail()`, `waitForApiReady()` |
| Test (spec) | `should` + expected outcome | `should redirect to dashboard after login` |

### 5.4 Variable Naming
- Use `camelCase` for all variables, parameters, and instance properties.
- Boolean variables: `is`, `has`, `can`, `should` prefix — e.g., `isLoggedIn`, `hasPermission`.
- `const` for everything that does not need reassignment.
- Never use single-letter names except for loop indices or trivial lambdas.
- Environment variable names: `SCREAMING_SNAKE_CASE` — e.g., `BASE_URL`, `ADMIN_EMAIL`.

### 5.5 Locator Variable Naming
- Named as descriptive PascalCase nouns when stored (rare — usually inline).
- When locators must be stored, name them after their **purpose**, not their HTML attribute.

```typescript
// ✅ Purpose-driven names
const submitButton  = page.getByRole('button', { name: 'Submit' });
const emailField    = page.getByLabel('Email address');
const errorBanner   = page.getByRole('alert');
```

### 5.6 Test Describe and Test Names
| Artifact | Convention | Example |
|---|---|---|
| `test.describe` | Title Case noun phrase | `User Authentication` |
| `test()` name | `should` + present tense outcome | `should show error for invalid password` |
| Setup test | action phrase | `authenticate as admin` |

---

## SECTION 6 — Do's and Don'ts

### ✅ Do's

- **Do** use `getByRole()`, `getByLabel()`, `getByTestId()` as the primary locator strategy.
- **Do** use `expect(locator).toBeVisible()` and Playwright's retry-aware assertions.
- **Do** use `storageState` for auth — create once, reuse across tests.
- **Do** use custom fixtures to inject page objects into tests.
- **Do** use `async/await` throughout — no `.then()` chains.
- **Do** enforce `strict: true` in `tsconfig.json`.
- **Do** use `page.route()` for network mocking in isolation tests — and document the mock.
- **Do** seed test data via `request` fixture (API) — never via UI navigation.
- **Do** use `fullyParallel: true` and design all tests to be parallel-safe.
- **Do** use `page.waitForResponse()` when an action must trigger a specific API call before asserting.
- **Do** define one `playwright.config.ts` for all project/browser/environment settings.
- **Do** advocate for `data-testid` attributes in the application codebase.
- **Do** name tests with `should + outcome` to make CI failure reports self-explanatory.
- **Do** capture screenshots and traces `on-first-retry` in config.

### ❌ Don'ts

- **Don't** use `waitForTimeout()` in committed test code — ever.
- **Don't** use XPath or absolute/positional CSS selectors.
- **Don't** use `any` TypeScript type — use `unknown` + type guards or proper interfaces.
- **Don't** use `.then()` chains — always `async/await`.
- **Don't** import `test` and `expect` from `@playwright/test` directly in spec files — use the fixture wrapper.
- **Don't** log in inside `beforeEach` — use `storageState`.
- **Don't** write assertions inside page object methods — only in spec files.
- **Don't** use `waitForLoadState('networkidle')` as a general-purpose wait.
- **Don't** hardcode URLs, credentials, or environment-specific values.
- **Don't** instantiate page objects inside spec files — use fixtures.
- **Don't** use `var` — always `const` or `let`.
- **Don't** write tests that depend on execution order.
- **Don't** disable TypeScript strict checks with `// @ts-ignore` without a documented justification.
- **Don't** use `page.$()` or `page.$$()` — always the `Locator` API.
- **Don't** mock all network calls as a default — only mock what is necessary for isolation.

---

## SECTION 7 — Code Review Checklist

### 7.1 TypeScript Code Quality
- [ ] `"strict": true` enabled in `tsconfig.json` — no suppressions.
- [ ] No `any` types used — all types explicit and meaningful.
- [ ] All function signatures have explicit parameter and return types.
- [ ] `const` used for all variables that are not reassigned.
- [ ] No `var` declarations anywhere in the codebase.
- [ ] No `.then()/.catch()` chains — `async/await` used throughout.
- [ ] No `// @ts-ignore` without a documented justification comment.
- [ ] ESLint and Prettier passing with no suppressions.
- [ ] Path aliases used — no deep relative imports (`../../..`).

### 7.2 Playwright API Usage
- [ ] Locators use `getByRole`, `getByLabel`, `getByTestId`, or `getByText` (no XPath, no absolute CSS).
- [ ] All assertions use Playwright's `expect(locator)` — no point-in-time `isVisible()` calls for assertions.
- [ ] `waitForTimeout()` is absent from all committed test code.
- [ ] `waitForLoadState('networkidle')` not used as a general wait strategy.
- [ ] Authentication uses `storageState` — no login in `beforeEach` or within tests.
- [ ] Network mocking (`page.route()`) is documented with a comment explaining what is mocked and why.

### 7.3 Page Object Model
- [ ] All page classes extend `BasePage`.
- [ ] No assertions written inside page object methods.
- [ ] Page action methods return `this` or the next page object for chaining.
- [ ] Page objects injected via fixtures — never instantiated inside spec files.
- [ ] No direct Playwright calls inside spec files — always delegated to page objects.

### 7.4 Test Structure and Isolation
- [ ] `test` and `expect` imported from the custom fixtures file — not `@playwright/test` directly.
- [ ] `test.describe()` groups logically related tests under a feature name.
- [ ] Each `test()` name uses `should + outcome` convention.
- [ ] No test ordering dependencies — `test.describe.serial()` not used unless documented.
- [ ] Test data seeded via API (`request` fixture) — not via UI navigation.
- [ ] Test data cleaned up after tests.
- [ ] `fullyParallel: true` set in config and tests are designed to be parallel-safe.

### 7.5 Configuration and Environment
- [ ] All environment values (URLs, credentials) loaded from `.env` files — none hardcoded.
- [ ] `.env` files not committed — `.env.example` with keys (no values) committed instead.
- [ ] `playwright.config.ts` defines all browser projects, reporters, base URL, and timeout settings.
- [ ] Auth state files in `.auth/` directory and listed in `.gitignore`.

### 7.6 General Quality
- [ ] Each test validates exactly one user behaviour.
- [ ] All tests are independent and parallel-safe.
- [ ] Test and file names are descriptive and follow naming conventions.
- [ ] No commented-out code committed.
- [ ] All tests passing or explicitly skipped (`test.skip`) with a documented reason.
- [ ] Trace and screenshot capture configured for CI (`on-first-retry`).

---

## SECTION 8 — BDD Test Case Governance (Gherkin / Vansah)

> Applies to every `.feature` file in this project. Supplements Section 1.2 (coverage) and Section 4 (BDD structure)
### 8.1 Mandatory Per-Scenario

Every scenario **must** have this comment block immediately above its tags, in this exact order:

```gherkin
# Test Case Summary: <one sentence — what this scenario verifies>
# Precondition: <specific system state required before the test runs, or N/A>
```

Rules:
- `# Test Case Summary:` — one sentence, present tense, states the observable outcome being verified.
- `# Precondition:` — sourced directly from the Jira story. Must capture the full criteria before the test can execute:
  - Story has a **Preconditions heading** → use that content
  - Story **explicitly uses the word "precondition"** anywhere in Description, AC text, or Definition of Done → extract and use it. **Sections labeled "Dependencies", "Assumptions", "Non-Functional Requirements", or "Notes" do NOT count — these are not preconditions.**
  - **`Given` clauses inside the Acceptance Criteria ARE a valid precondition source** (project rule, 2026-08-28) — use the `Given` clause of the AC that the scenario covers. This previously said the opposite; it was changed because our ACs are consistently written in Given/When/Then form, so the `Given` **is** the story's own statement of the state required before the action, and treating it as unusable stalled every story on a runtime prompt for something the story already said. Take the `Given` as written — reword only for readability, never to add a condition the AC did not state.
  - Story has **no Preconditions heading, no literal "precondition" text, AND no usable AC `Given` clause** → **prompt the user at runtime**: "No precondition was found in the story. Please provide the precondition for this scenario, or type N/A if none applies." — do NOT write `N/A` automatically without asking
  - NEVER infer, assume, or invent a precondition not written in the story
- These two lines map directly to Vansah's **Test Case Summary** and **Precondition** tabs on import.

### 8.2 Tag Format

Tags must appear in this exact order on the line immediately after the metadata block:

```
@<Smoke|Regression> @<Automatable|Non-Automatable> @<High|Medium|Low> @<STORY_ID> [@BusinessCase] @ClaudeGeneratedTest @smokeBDD
```

> **Important distinction — Labels vs Priority:**
> - **Labels** (map to the Vansah *Labels* field): `@Smoke`, `@Regression`, `@Automatable`, `@Non-Automatable`, `@BusinessCase`, `@ClaudeGeneratedTest`, `@smokeBDD`
> - **Priority** (maps to the Vansah *Priority* field): `@High`, `@Medium`, `@Low` — this is a separate Vansah concept from Labels and must be treated independently

---

**Label rules:**

| Label | Rule |
|---|---|
| `@Smoke` | All `@High` (P1) scenarios |
| `@Regression` | All `@Medium` (P2) and `@Low` (P3) scenarios |
| Never both | `@Smoke` and `@Regression` must never appear on the same scenario |
| `@Automatable` | Outcome is deterministic and observable — see decision logic below |
| `@Non-Automatable` | Requires human judgment or has an uncontrollable dependency — see decision logic below |
| Never both | `@Automatable` and `@Non-Automatable` must never appear on the same scenario |
| `@[STORY_ID]` | Jira story number for traceability (e.g. `@PBK-1234`) |
| `@BusinessCase` | Optional — add only to scenarios under the "Business Rules & Restrictions" section; omit from Happy Path, Validation, Edge Cases, and E2E scenarios |
| `@ClaudeGeneratedTest` | Always present on every Claude-generated scenario — used to distinguish AI-generated test cases from manually written ones in Vansah |
| `@smokeBDD` | Always last, on every scenario — used by Vansah import tooling |

**`@Smoke` vs `@Regression` — decision logic:**

Decision is based on the scenario's priority tag:

| Priority | Label |
|---|---|
| `@High` (P1) | `@Smoke` |
| `@Medium` (P2) | `@Regression` |
| `@Low` (P3) | `@Regression` |

- All P1 (`@High`) scenarios are labelled `@Smoke`.
- All P2 (`@Medium`) and P3 (`@Low`) scenarios are labelled `@Regression`.
- The full regression suite covers all priorities — P1 smoke cases are included when running regression.

---

**`@Automatable` vs `@Non-Automatable` — decision logic (applies to Frontend, Backend, and API products):**

Ask: *"Can the outcome of this scenario be verified by a tool without human intervention?"*

Mark `@Automatable` if the outcome is observable via **any** of these:
- UI element state, text, navigation, or visibility (Frontend)
- API response body, status code, or header (API / Backend)
- Database record, field value, or row existence (Backend)
- Log entry, audit trail record, or event emission (Backend / API)
- Email or notification content via a test hook or mailbox API (e.g. Mailosaur)

Mark `@Non-Automatable` if **any** of these apply:
- Requires a human to visually judge correctness (e.g. layout aesthetics, print output)
- Depends on a live third-party system with no sandbox or test hook (live payment gateway, live telecom SMS, uncontrolled external API)
- Outcome is non-deterministic with no controllable seed or mock (true randomness, real-time market data)
- Requires CAPTCHA or anti-bot challenge that blocks automation by design
- Requires manual infrastructure access (physical server inspection, data centre check)

> **Default to `@Automatable`** — if the scenario does not match any `@Non-Automatable` condition above, it is automatable regardless of product type.

**Priority tag rules:**

| Priority Tag | Rule |
|---|---|
| `@High` | Happy path, E2E lifecycle, data-loss risk |
| `@Medium` | Role restriction, validation, secondary feature paths |
| `@Low` | Edge cases, cosmetic, rarely exercised paths |
| Exactly one | Every scenario must carry exactly one priority tag — never zero, never two |

### 8.3 Coverage Categories

Section 1.2 requires happy path, validation, and boundary/edge cases. For Gherkin scenarios the full required coverage is:

| Category | Minimum | Notes |
|---|---|---|
| Happy path | 1 | Primary success flow — tag `@Smoke @High` |
| Per acceptance criterion | 1 per AC | Every numbered AC in the Jira story |
| Per user role | 1 per role | Where behaviour differs between roles |
| Workflow states | 1 per state | Pending, Approved, Rejected, etc. |
| Positive data variations | 1+ | Valid alternate inputs that should succeed |
| Negative — required field missing | 1 per field | Each mandatory field left blank |
| Negative — invalid format | 1 per field | Wrong type / format input |
| Boundary values | 3 | Below limit, at limit, above limit |
| Role restriction | 1 per rule | Action blocked for unauthorised role |
| Business restriction | 1 per rule | Duplicate submission, guardian lock, etc. |
| Workflow ordering | 1 | Step N cannot occur before step N−1 |
| Rejection path | 1 per approver | Each approver who can reject |
| Edge cases | 1+ | Empty state, max-length, special characters |
| Full E2E lifecycle | 1 | Submission → all approvals → final state — tag `@Smoke @High` |
| Data-driven (Outline) | 1 outline | Minimum 3 rows in the `Examples:` table |

### 8.4 Scenario Title Rules

- Titles must be **business-readable and role-explicit**.
- Follow the pattern: `[Role] [performs action] and [observable outcome]`
- GOOD: `Admin User submits order and receives confirmation`
- GOOD: `Standard User applies filter and list updates immediately`
- GOOD: `Guest User enters invalid credentials and sees error message`
- BAD: `Test approve button` / `Verify scenario 3` / `Check the form`

### 8.5 Gherkin Discipline

- `Given` — system state / precondition (never an action). **Always required** — every scenario must include a `Given` step that establishes the system state or precondition before the action.
- `When` — the user action or triggering event. **Always required** — every scenario must have at least one `When`.
- `Then` — the observable, user-facing outcome (specific — never vague like "it works"). **Always required**.
- `And` — continuation of the previous keyword type.
- Never jump from `Given` directly to `Then` — there must always be a `When` before `Then`.
- No technical language in step text: no CSS selectors, API paths, button IDs, HTTP methods.
- Steps must be **unambiguous** — one interpretation only; avoid words like "appropriate", "correct", "properly", "some".
- Steps must be **suitable for automation** — outcomes must be deterministic and observable in the UI or API; avoid subjective or human-judgment-only assertions.

### 8.6 Vansah Field Mapping

| Feature file element | Vansah field | Type |
|---|---|---|
| `# Test Case Summary: <text>` | Test Case Summary tab | Metadata |
| `# Precondition: <text>` (or `N/A`) | Precondition tab | Metadata |
| `@High` / `@Medium` / `@Low` | Priority field | **Priority** (not a Label) |
| `@Smoke` / `@Regression` | Labels field | Label |
| `@Automatable` / `@Non-Automatable` | Labels field | Label |
| `@BusinessCase` | Labels field | Label (optional) |
| `@ClaudeGeneratedTest` | Labels field | Label (always present on Claude-generated scenarios) |
| `@smokeBDD` | Labels field | Label (always present) |
| Given / When / Then / And steps | Test Script — BDD - GHERKIN | Test Steps |

### 8.7 Feature File Section Grouping

Use these section comments to group scenarios. Only include groups that apply to the feature:

```gherkin
# ── Happy Path ────────────────────────────────────────────────────
# ── Role-Based Access ─────────────────────────────────────────────
# ── Business Rules & Restrictions ────────────────────────────────
# ── Validation / Negative ────────────────────────────────────────
# ── Edge Cases ───────────────────────────────────────────────────
# ── Workflow States ───────────────────────────────────────────────
# ── End-to-End ───────────────────────────────────────────────────
```

### 8.8 BDD Governance Review Checklist

**Mandatory components**
- [ ] Every scenario has `# Test Case Summary:` comment.
- [ ] Every scenario has `# Precondition:` comment; value sourced from story or confirmed with user at runtime — never left blank, never auto-written as `N/A` without prompting.
- [ ] Every scenario has exactly one priority tag (`@High` / `@Medium` / `@Low`) — maps to Vansah **Priority field**, not Labels.
- [ ] Every scenario has the correct label tags (`@Smoke`/`@Regression`, `@Automatable`/`@Non-Automatable`, story ID, `@ClaudeGeneratedTest`, `@smokeBDD`).

**Tag format**
- [ ] Tags are in the mandatory order: suite label → automation label → priority tag → story tag → `@BusinessCase` (if applicable) → `@ClaudeGeneratedTest` → `@smokeBDD`.
- [ ] Exactly one of `@Smoke` / `@Regression` per scenario — `@Smoke` for all `@High` (P1) scenarios; `@Regression` for all `@Medium` (P2) and `@Low` (P3) scenarios (Label).
- [ ] Exactly one of `@Automatable` / `@Non-Automatable` per scenario — decision based on Section 8.2 logic; default is `@Automatable` (Label).
- [ ] Exactly one of `@High` / `@Medium` / `@Low` per scenario (Priority — separate from Labels).
- [ ] `@smokeBDD` is the last tag on every scenario (Label).
- [ ] Jira story tag (`@PBK-XXXX`) present on every scenario.

**Step quality**
- [ ] Every scenario includes a `Given` step that establishes the system state or precondition.
- [ ] Every scenario has at least one `When` and one `Then`.
- [ ] No scenario jumps from `Given` directly to `Then` without a `When`.
- [ ] Steps follow a logical sequential flow — no missing or out-of-order actions.
- [ ] Expected results (`Then` statements) are clearly and specifically defined — not vague.
- [ ] No ambiguity in step language — one interpretation only; no words like "appropriate", "correct", "properly".
- [ ] No technical language (selectors, HTTP methods, API paths) in step text.
- [ ] Steps are suitable for automation — outcomes are deterministic and observable.

**Scenario quality**
- [ ] Scenario aligns with and is traceable to the Jira story requirement or AC.
- [ ] All data-driven cases use `Scenario Outline` with minimum 3 `Examples:` rows.
- [ ] Scenario titles are business-readable and identify the role performing the action.

**Coverage**
- [ ] Coverage matrix satisfied: at least one scenario per AC, per role, per workflow state.
- [ ] Feature file includes positive, negative, and edge case scenarios.
