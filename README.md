# playwright-bdd-kit

A starter kit for web test automation that pairs **Playwright + TypeScript** with **Gherkin feature files**, a strict **BDD governance rulebook**, **AI-assisted scenario generation** (Claude Code commands), and a **Vansah** importer that pushes scenarios into Jira test management.

The sample suite runs against the public [Sauce Demo](https://www.saucedemo.com) site so the kit works out of the box. Replace the sample specs and features with your own application's and keep everything else.

## What is in the box

| Path | Purpose |
|---|---|
| `CLAUDE.md` | The automation rulebook: TypeScript rules, Playwright practices, naming, review checklist, and Section 8, the Gherkin/Vansah governance every `.feature` file must follow. Claude Code reads it automatically. |
| `features/` | Gherkin feature files, one folder per feature. Each scenario carries the mandatory metadata block and tag order from Section 8. |
| `tests/*.spec.ts` | Playwright specs that automate the feature files. Titles carry the test-management case key. |
| `tests/pages/` | Page objects. Locators live here, never in specs. |
| `tests/fixtures/` | Typed test data. Credentials come from `.env`, never from source. |
| `tests/helpers/` | Login flow, Mailosaur email-OTP helper, random-data utilities. |
| `Tools/` | .NET NUnit project that parses a feature file and creates BDD test cases in Vansah through its REST API. |
| `.claude/commands/` | Slash commands for Claude Code: generate a fully covered feature file from a Jira story, optionally import it to Vansah. |
| `.github/` | Playwright CI workflow, PR template, and Copilot instruction files for React front-end repositories. |
| `docs/react-rulebook.md` | Numbered React coding standards that the Copilot PR review cites by rule ID. |

## Quick start

```bash
npm install
npx playwright install --with-deps
cp .env.example .env          # defaults already point at Sauce Demo
npm run test:e2e              # all browsers
npm run test:smoke            # only @smoke tests
npm run report                # open the HTML report
```

Useful variants:

```bash
npm run test:chromium         # one browser
npm run test:headed           # watch it run
npm run typecheck             # tsc over tests and config
npx playwright test tests/Login.spec.ts --project=chromium
```

## Configuration

All environment-specific values live in `.env` (gitignored). See `.env.example`:

| Variable | Meaning |
|---|---|
| `BASE_URL` | Application under test. Feeds `use.baseURL`, so specs call `page.goto('/')`. |
| `DEFAULT_USER_*`, `LOCKED_USER_*` | Test accounts used by the sample suite. |
| `MAILOSAUR_API_KEY`, `MAILOSAUR_SERVER_ID` | Optional. Enables `tests/helpers/mailosaur.helper.ts` for email OTP flows. |
| `ALLOW_SELF_SIGNED_CERTS` | Optional. Set to `1` only when the environment uses self-signed certificates. |

Cross-browser projects (Chromium, Firefox, WebKit) are defined once in `playwright.config.ts`. Retries and single-worker mode switch on automatically under `CI`.

## Writing tests the kit's way

1. **Start from the feature file.** Write or generate `features/<Feature>/<Feature>.feature` following Section 8 of `CLAUDE.md`: a `# Test Case Summary:` and `# Precondition:` line above every scenario, then tags in this exact order:

   ```
   @<Smoke|Regression> @<Automatable|Non-Automatable> @<High|Medium|Low> @<STORY_ID> [@BusinessCase] @ClaudeGeneratedTest @smokeBDD
   ```

   Group scenarios under the standard section comments (Happy Path, Role-Based Access, Business Rules & Restrictions, Validation / Negative, Edge Cases, Workflow States, End-to-End).

2. **Add a page object** in `tests/pages/` for any new screen. Prefer `getByRole`, then `getByLabel`, then `getByPlaceholder`; fall back to `data-test` attributes only when the DOM offers nothing semantic.

3. **Write the spec** in `tests/<Feature>.spec.ts`. One `test()` per scenario, named `should <outcome>`, prefixed with `@smoke` or `@regression` and the test-management case key. Arrange, act, assert. No hardcoded data, no shared state between tests.

4. **Run the review checklist** in `CLAUDE.md` Section 7 (code) and Section 8.8 (BDD) before opening a PR.

## Generating scenarios with Claude Code

With [Claude Code](https://claude.com/claude-code) open in this repository:

| Command | What it does |
|---|---|
| `/generate-bdd` | Asks for a Jira story, framework, and file locations. Reads the story, builds the coverage matrix (happy path, per AC, per role, negative per field, boundaries, business rules, E2E, one Scenario Outline), writes the feature file and stub step definitions, and updates `VansahConfig.json`. Import is left for you to run after review. |
| `/generate-bdd-import` | Same, then runs the Vansah import immediately. |
| `/vansah-import` | Imports an existing feature file using the current `VansahConfig.json`. |

Reading Jira stories requires a Jira MCP server configured in Claude Code.

## Importing to Vansah

1. Copy `VansahConfig.example.json` to `VansahConfig.json` and fill in the API URL, connect token, project key, folder UUID, and the feature file to import. The real file is gitignored; never commit a token.
2. Run the importer (requires the .NET 9 SDK):

   ```bash
   cd Tools
   dotnet test --filter "Category=VansahImport"
   ```

The importer parses each scenario and creates one Vansah test case per scenario. `# Test Case Summary:` becomes the summary, `# Precondition:` the precondition, `@High/@Medium/@Low` the priority, all other tags become labels, and the Given/When/Then steps (plus any `Examples:` table) become the BDD script.

## Adapting the kit to your application

- Delete `tests/Login.spec.ts`, `tests/InventoryCart.spec.ts`, the two page objects, and the two feature folders, or keep them as reference until your own are in place.
- Point `BASE_URL` and the `*_USER_*` variables at your environment.
- If your login sends an email code, `loginWithOTP` in `tests/helpers/auth.helper.ts` already wires the Mailosaur helper in; adjust the OTP box label pattern in `fillOTPFields` if your inputs are named differently.
- Change the story tag prefix (`@PBK-…`) in `CLAUDE.md` Section 8 and in `.claude/commands/` examples to your Jira project key.
- Populate the repository secrets listed in `.github/workflows/playwright.yml` for CI runs against a private environment.

## Requirements

- Node.js 20 or newer
- .NET 9 SDK, only for the Vansah importer
- A Mailosaur account, only for email OTP flows
