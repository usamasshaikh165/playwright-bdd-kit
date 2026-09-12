# React Coding Standards (v1.0)

**Instruction for Copilot:**  
When reviewing pull requests, always **cite the specific rule ID** (e.g., R2 or R15) and **quote the corresponding rule text** when reporting violations.

---

## 1. Naming Conventions

_These rules define how all identifiers must be named._

- **R1:** Components → `PascalCase` (start with uppercase). Example: `OrderForm`, `UserProfile`
- **R2:** Functions → `camelCase` (start with lowercase). Example: `calculateTotal()`, `handleSubmit()`
- **R3:** Constants → `UPPER_CASE`. Example: `MAX_RETRIES`, `API_TIMEOUT_MS`
- **R4:** Variables → `camelCase`. Example: `isLoading`, `userData`
- **R5:** File names match component names where possible. Example: `UserProfile.jsx` for component `UserProfile`

---

## 2. Formatting and Layout

_Keep formatting consistent and readable._

- **R6:** Limit line length to 300 characters.
- **R7:** Use 4 spaces per indent (matches project convention).
- **R8:** Place opening brace `{` on the same line as function name (JavaScript style).
- **R9:** Add one blank line between functions/components.
- **R10:** Avoid trailing spaces.
- **R11:** Add spaces after commas and around operators. Example: `const x = a + b;`

---

## 3. React Component Standards

_Write clean, functional React components._

- **R12:** Prefer functional components with hooks; avoid class components for new development.
- **R13:** Use arrow functions for component definitions. Example: `const MyComponent = () => {}`
- **R14:** Always include `PropTypes` for component props validation in JavaScript components.
- **R15:** Always use TypeScript types/interfaces for props validation in TypeScript components.
- **R15a:** Every new component MUST expose a stable, unique id on its root element (and on key interactive elements such as inputs, buttons, and form controls) to support test automation. Prefer deterministic values derived from props over random values, and never rely on auto-generated or index-based ids that can change between renders. Example: <button id="order-form-submit">Submit</button>.

---

## 4. Hooks and State Management

_Follow React hooks best practices._

- **R16:** Use `useState` for local component state.
- **R17:** Use `useEffect` with proper dependency arrays; never omit the dependency array parameter. For mount-only effects, use an empty array `[]`.
- **R18:** Use `useCallback` to memoize callbacks passed to optimized components.
- **R19:** Use `useMemo` to optimize expensive computations.
- **R20:** Clean up subscriptions in `useEffect` return function.

---

## 5. Business Logic Architecture

_Keep components clean by extracting business logic._

- **R21:** Extract business logic from components into separate files (e.g., `utils.js`, `businessLogic.js`).
- **R22:** Export pure functions from separate files.
- **R23:** Keep presentation layer focused on rendering; move calculations/transformations to logic files.
- **R24:** Place business logic files alongside components. Example: `UserForm/index.jsx`, `UserForm/formatters.js`

---

## 6. Props and PropTypes

_Validate all component inputs._

- **R25:** Always define `PropTypes` for all component props.
- **R26:** Use `PropTypes.shape()` for complex object props.
- **R27:** Mark required props with `.isRequired`.
- **R28:** Provide meaningful `PropTypes` for array items (use `.arrayOf()` or `.shape()`).
- **R29:** Define default props when appropriate.
- **R30:** Use `PropTypes` as inline documentation (add brief comments next to non-obvious or complex props).

---

## 7. API Integration and Services

_Follow service layer patterns for API calls._

- **R31:** Define services in `src/services/` for all API calls; never call APIs directly from components.
- **R32:** Use `axios` with configured interceptors.
- **R33:** Handle authentication tokens properly in service layer.
- **R34:** Gracefully handle errors using try-catch-finally and retry logic in services.
- **R35:** Return promises/observables from services, not React state.
- **R36:** In all new development, use `axios` instead of `fetch` for API calls.

---

## 8. Styling

_Follow SCSS and theme conventions._

- **R37:** Use SCSS modules where possible; avoid global styles.
- **R38:** Maintain separate SCSS modules for core, dark & light modes.
- **R39:** Define colors in theme files, not inline.
- **R39a:** Never use inline `sx={{...}}` or `style={{...}}` object literals in JSX (MUI `sx` prop or the native `style` prop alike) — define every style as a named constant in that feature's `style.tsx`/`styles.tsx` file and import it, even for a single-property object. This applies to every value a style can hold, not colors alone (R39): spacing, layout, sizing, typography, etc. Example: `sx={cardHeaderStyle}` imported from `styles.tsx`, not `sx={{ display: "flex", padding: "8px" }}`. A prop typed to require a style object but with nothing to apply should be passed `null`/`undefined` per its type, not an empty literal (`sx={{}}`).
- **R40:** Ensure responsive design using CSS Grid and Flexbox.
- **R41:** Adhere to Stylelint rules for SCSS/CSS code.

---

## 9. Performance Optimization

_Write performant React code._

- **R42:** Lazy load components with `React.lazy()` and `Suspense` where appropriate.
- **R43:** Use `React.memo()` to prevent unnecessary component re-renders.
- **R44:** Implement virtual scrolling for large datasets.
- **R45:** Use Web Workers for heavy computations.
- **R46:** Cancel pending API requests when components unmount.

---

## 10. Error Handling and Logging

_Handle errors gracefully with proper logging._

- **R47:** Implement try-catch blocks for async operations.
- **R48:** Define fallback success and error messages for API calls in case the API response lacks a message property.
- **R49:** Handle network failures gracefully with retry mechanisms.
- **R52:** Implement error boundaries for unexpected component failures.

---

## 11. Security and Data Protection

_Protect sensitive data and prevent vulnerabilities._

- **R53:** Never expose API keys or credentials in frontend code.
- **R54:** Validate user inputs before processing.
- **R55:** Do not store sensitive information in plain `localStorage`. If client-side storage is required, prefer storing only non-sensitive data; if sensitive data must be stored, use an approved secure storage approach and ensure encryption keys are not hardcoded or derived from browser/device signatures or fingerprints. Keys must be provided by an approved server-managed/session-controlled mechanism or explicit user-provided secret.
- **R56:** Implement proper authentication checks before sensitive operations.
- **R57:** Use configured base URL for all API communications.

---

## 12. Code Quality and Standards

_Maintain clean, readable code._

- **R58:** Use meaningful variable and function names (never single letters except loop variables).
- **R59:** Add JSDoc comments for complex business logic functions only.
- **R60:** Keep functions small and single-purpose.
- **R61:** Avoid nested ternary operators; use if-else or early returns.
- **R62:** Use `const` for variables that don't change; use `let` for variables that do.
- **R63:** Prefer switch-case over if else-if else statements.

---
## 13. Documentation
- **R64:** Code is documentated and business flows/validations are mentioned.

## 14. Review Checklist

_When reviewing, Copilot and reviewers must confirm:_

- Naming conventions followed (R1–R5).
- Formatting and layout correct (R6–R11).
- Component patterns followed (R12–R15).
- Hooks used properly (R16–R20).
- Business logic extracted (R21–R24).
- PropTypes complete (R25–R30).
- Services used for API calls (R31–R36).
- Styling follows theme (R37–R41).
- Performance optimizations considered (R42–R46).
- Proper error handling (R47–R52).
- Security best practices followed (R53–R57).
- Code quality maintained (R58–R63).
- Documentation updated in terms of code comments (R64).

---

**By following this rulebook, developers ensure React code that is consistent, maintainable, performant, and AI-auditable.**
