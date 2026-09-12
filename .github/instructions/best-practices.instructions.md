# Best Practices Instructions

# General Principles

- Follow SOLID
- Follow DRY
- Follow KISS
- Prefer readability
- Prefer composition over inheritance
- Avoid premature optimization

---

# React Standards

- Follow the repository's existing language conventions
- Use TypeScript only when the project supports it
- Avoid introducing TypeScript into JavaScript codebases unless explicitly requested
- In JavaScript projects, use PropTypes according to `docs/react-rulebook.md`
- Prefer explicit typing/documentation for props, models, and function contracts
- Keep components small and focused
- Every new component MUST include a stable, unique `id` on its root element and on key interactive elements (inputs, buttons, form controls) to enable test automation, per rule R15a in `docs/react-rulebook.md`. Avoid random or index-based ids that change between renders.

---

# Naming Conventions

- Components: PascalCase
- Hooks: useXyz
- Functions: camelCase
- Constants MUST use UPPER_CASE naming convention
  Examples:
  - MAX_RETRIES
  - API_TIMEOUT_MS
  - DEFAULT_PAGE_SIZE

---

# Hooks Rules

- Never call hooks conditionally
- Avoid deeply nested effects
- Minimize unnecessary state
- Prevent race conditions

---

# State Management

Prefer:
1. Local state
2. Feature state
3. Global state only when necessary

Do NOT:
- Duplicate state
- Store derived state unnecessarily
- Overuse global state

---

# Accessibility

Always:
- Use semantic HTML
- Support keyboard navigation
- Add accessible labels
- Ensure focus management
- Maintain proper contrast

Never:
- Ignore screen reader behavior
- Use inaccessible click handlers

---

# Security

- Never trust user input
- Prevent XSS
- Avoid exposing secrets/tokens
- Respect authorization boundaries

Never:
- Store secrets in frontend code
- Log sensitive information

---

# Performance

- Avoid unnecessary re-renders
- Use stable keys
- Lazy load heavy routes/components
- Cache when appropriate
- Debounce expensive operations
