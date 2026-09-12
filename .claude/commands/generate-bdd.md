---
description: Generate BDD scenarios with full coverage + step definitions for a Jira story. Works with ANY framework/language. Updates VansahConfig.json but does NOT run the import — user runs vansah-import.exe manually after review.
---

## Step 1 — Collect inputs from the user

Ask the user ALL of the following questions together in a single message (do not ask one at a time):

```
Please provide the following details:

1. Jira Story number            (e.g. PROJ-1234)
2. Framework / Language         (e.g. Java/Cucumber, Python/Behave, JS/Playwright, Ruby/Cucumber, C#/SpecFlow)
3. Feature file name            (e.g. UserLogin  ← no extension)
4. Feature file path            (e.g. src/test/resources/features  or  features/auth)
5. Step definition file name    (e.g. UserLoginSteps  ← no extension)
6. Step definition path         (e.g. src/test/java/steps  or  step_definitions/auth)
7. VansahConfig.json location  (e.g. root of project, or path where the file lives)
```

Wait for the user's answers. Store as:
- STORY_ID      = answer to 1
- FRAMEWORK     = answer to 2
- FEATURE_NAME  = answer to 3
- FEATURE_PATH  = answer to 4
- STEPS_NAME    = answer to 5
- STEPS_PATH    = answer to 6
- CONFIG_PATH   = answer to 7

---

## Step 2 — Read and analyse the Jira story

Fetch Jira issue [STORY_ID] and extract ALL of the following:

**Roles** — every user role mentioned. For each: what they CAN do, CANNOT do, what they SEE.

**Acceptance criteria** — number every AC. Each numbered AC = at least one scenario.

**Business rules** — explicit rules AND implicit domain rules (workflow ordering, restrictions, guards).

**States & transitions** — build a mental state machine. Every state + every transition = a scenario.

**Data dimensions** — every field with validation: required, format, range, type. Each = a negative scenario.

---

## Step 3 — Build coverage matrix (internal check before writing)

Before writing a single scenario, confirm EVERY row below is covered:

| Coverage category                    | Min        | Notes |
|--------------------------------------|------------|-------|
| Happy path                           | 1          | Primary success flow, end-to-end |
| Per user role                        | 1 per role | Each role's distinct action |
| Per acceptance criterion             | 1 per AC   | Direct AC mapping |
| Workflow states                      | 1 per state | Every state the feature defines (e.g. Draft, Active, Closed) |
| Status / column display              | 1          | UI shows correct values after each action |
| Positive data variations             | 1+         | Valid inputs that should succeed |
| Negative — required field missing    | 1 per field | Each mandatory field left blank |
| Negative — invalid format            | 1 per field | Wrong type / format input |
| Negative — quantity boundary         | 3          | Below limit, at limit, above limit |
| Role restriction                     | 1 per rule | Action blocked for unauthorised role |
| Business restriction                 | 1 per rule | Any rule explicitly stated in the AC that the system must enforce (e.g. duplicate prevention, filter persistence, locked record) |
| Workflow ordering                    | 1          | Step N cannot happen before Step N-1 |
| Rejection path                       | 1 per rejector | If the feature has a rejection/decline action — one scenario per role that can reject |
| Edge cases                           | 1+         | Empty state, special characters, max-length input |
| Full E2E lifecycle                   | 1          | Complete flow from start to final state |
| Data-driven (Outline)                | 1 outline  | Min 3 rows in Examples table |

---

## Step 4 — Write the Feature File

Create: [FEATURE_PATH]/[FEATURE_NAME].feature

**Metadata block — mandatory above every scenario in this exact order:**
```gherkin
# Description: <one sentence — what this scenario verifies>
# Precondition: <setup state explicitly stated in the story, or N/A>
@Smoke @Automatable @High @[STORY_ID] @smokeBDD
Scenario: ...          ← happy path / E2E example

# Description: <one sentence — what this scenario verifies>
# Precondition: <setup state explicitly stated in the story, or N/A>
@Regression @Automatable @Medium @[STORY_ID] @smokeBDD
Scenario: ...          ← validation / negative / role example
```

**Precondition rules — strictly enforced:**
- If the story has a **Preconditions heading** → use that content
- If the story **mentions preconditions anywhere** in the text (Description, AC, Definition of Done) → extract and use it
- If the story has **no mention of preconditions anywhere** → write `N/A`
- NEVER infer, assume, or invent a precondition that is not written in the story

**Tag rules (in this exact order):**
- `@Smoke` — happy path + E2E lifecycle scenarios (critical path only)
- `@Regression` — all other scenarios: validation, negative, role-based, edge cases
- Never both `@Smoke` and `@Regression` on the same scenario
- `@Automatable` or `@Non-Automatable` — always one, never both
- `@High` / `@Medium` / `@Low` — always one (maps to Vansah priority):
  - `@High`   → happy path, E2E lifecycle, data loss risk
  - `@Medium` → role restriction, validation, secondary paths
  - `@Low`    → edge cases, cosmetic, rarely exercised
- `@[STORY_ID]` — Jira story traceability
- `@BusinessCase` — optional; add ONLY to scenarios under the "Business Rules & Restrictions" section; omit from Happy Path, Validation, Edge Cases, and E2E scenarios
- `@smokeBDD` — always last

**Vansah field mapping — what each element becomes after import:**
| Feature file element                        | Vansah field              |
|---------------------------------------------|---------------------------|
| `# Description: <text>`                     | Description tab           |
| `# Precondition: <text>`                    | Precondition tab          |
| `@High` / `@Medium` / `@Low`               | Priority field            |
| `@Smoke`, `@Regression`, `@Automatable` etc | Labels                    |
| Given / When / Then steps                   | Test Script (BDD - GHERKIN) |

**Scenario title rules:**
- Business-readable and role-explicit
- Follow the pattern: [Role] [performs action] and [observable outcome]
- GOOD: "Admin User submits order and receives confirmation"
- GOOD: "Standard User applies filter and list updates immediately"
- BAD:  "Test approve button" / "Check the form" / "Verify scenario 3"

**Other rules:**
- Use Scenario Outline + Examples (min 3 rows) for data-driven cases
- Group scenarios with section comments:
  ```
  # ── Happy Path ──────────────────────────────────────
  # ── Role-Based Access ────────────────────────────────
  # ── Business Rules & Restrictions ────────────────────
  # ── Validation / Negative ────────────────────────────
  # ── Edge Cases ───────────────────────────────────────
  # ── Workflow States ──────────────────────────────────
  # ── End-to-End ───────────────────────────────────────
  ```

**Gherkin discipline:**
- Given = state / precondition
- When  = user action
- Then  = assertion / outcome
- And   = continuation of previous keyword type
- Never jump from Given to Then without a When

---

## Step 5 — Write Step Definitions

Create: [STEPS_PATH]/[STEPS_NAME].[ext]

Generate step definitions in the language/framework specified by FRAMEWORK:

### Java / Cucumber
```java
import io.cucumber.java.en.*;
import static org.junit.Assert.*;

public class [STEPS_NAME] {
    @Given("...")   public void given() { /* TODO */ }
    @When("...")    public void when()  { /* TODO */ }
    @Then("...")    public void then()  { /* TODO */ }
}
```

### Python / Behave
```python
from behave import given, when, then

@given('...') def step(context): pass   # TODO
@when('...')  def step(context): pass   # TODO
@then('...')  def step(context): pass   # TODO
```

### JavaScript / Playwright + Cucumber
```javascript
const { Given, When, Then } = require('@cucumber/cucumber');
Given('...', async function () { /* TODO */ });
When('...',  async function () { /* TODO */ });
Then('...',  async function () { /* TODO */ });
```

### TypeScript / Playwright + Cucumber
```typescript
import { Given, When, Then } from '@cucumber/cucumber';
Given('...', async function () { /* TODO */ });
When('...',  async function () { /* TODO */ });
Then('...',  async function () { /* TODO */ });
```

### Ruby / Cucumber
```ruby
Given('...') do end   # TODO
When('...')  do end   # TODO
Then('...')  do end   # TODO
```

### C# / SpecFlow
```csharp
using TechTalk.SpecFlow;
using NUnit.Framework;
namespace [Project].StepDefinitions {
    [Binding] public class [STEPS_NAME] {
        [Given(@"...")] public void Given() { /* TODO */ }
        [When(@"...")]  public void When()  { /* TODO */ }
        [Then(@"...")]  public void Then()  { /* TODO */ }
    }
}
```

Rules for all frameworks:
- Each Gherkin step maps to exactly one method
- Step text must match feature file exactly
- Add TODO comments where real locators/selectors are needed
- No hardcoded credentials — use environment variables or config

---

## Step 6 — Ask for FolderIdentifier

After Steps 4–5 are complete, output a coverage summary then ask:

```
┌─ Coverage summary ──────────────────────────────────────┐
│  Total scenarios : N                                     │
│  Happy path      : N                                     │
│  Role-based      : N                                     │
│  Positive        : N                                     │
│  Negative        : N   (validation + format + boundary)  │
│  Business rules  : N                                     │
│  Edge cases      : N                                     │
│  E2E lifecycle   : N                                     │
└──────────────────────────────────────────────────────────┘

Ready to update config.
Please provide the FolderIdentifier — the Vansah folder UUID where
test cases should be created (found in the Vansah folder URL or folder settings).
```

Wait for the user's answer. Store it as FOLDER_ID.

---

## Step 7 — Update VansahConfig.json

Update [CONFIG_PATH]/VansahConfig.json — ONLY these three fields:
  "FeatureFilePath":  "[FEATURE_PATH]"
  "FeatureFileName":  "[FEATURE_NAME].feature"
  "FolderIdentifier": "[FOLDER_ID]"

Do NOT change VansahApiUrl, VansahToken, ProjectKey, or TypeIdentifier.

If VansahConfig.json does not exist at [CONFIG_PATH], create it:
```json
{
  "VansahApiUrl":     "https://<your-instance>.vansah.com",
  "VansahToken":      "<your-vansah-token>",
  "ProjectKey":       "<your-project-key>",
  "FolderIdentifier": "[FOLDER_ID]",
  "TypeIdentifier":   "",
  "FeatureFilePath":  "[FEATURE_PATH]",
  "FeatureFileName":  "[FEATURE_NAME].feature"
}
```
Remind the user to fill in VansahToken and ProjectKey before running import.

---

## Step 8 — Final summary

Output:
```
  Feature file:         [FEATURE_PATH]/[FEATURE_NAME].feature
  Step definitions:     [STEPS_PATH]/[STEPS_NAME].[ext]
  Framework:            [FRAMEWORK]
  VansahConfig.json:   FeatureFilePath, FeatureFileName, FolderIdentifier updated

  When ready to import, run:
  vansah-import [FEATURE_PATH]/[FEATURE_NAME].feature

  Or config-driven (no argument):
  vansah-import
```