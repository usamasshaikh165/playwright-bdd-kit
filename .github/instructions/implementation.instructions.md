# Implementation Instructions



Before implementation:



1. Analyze impacted areas:

   - Components

   - Pages

   - Shared UI

   - State management

   - API layer

   - Routing

   - Validation

   - Styling

   - Tests



2. Reuse existing:

   - Components

   - Hooks

   - Layouts

   - Services

   - Utilities

   - Form patterns

   - Table/grid patterns



3. Create implementation plan including:

   - Components affected

   - Hooks/services affected

   - API contracts

   - State changes

   - Validation strategy

   - Accessibility considerations

   - Performance considerations



---



# Architecture Rules



## Presentational Components



Must:

- Be reusable

- Be stateless where possible

- Focus on rendering only



Must NOT:

- Fetch data directly

- Contain business logic

- Access global state unnecessarily



---



## Container Components



Responsible for:

- Data orchestration

- State coordination

- Calling services/hooks

- Business flow handling



---



## Hooks



Custom hooks should:

- Encapsulate reusable behavior

- Avoid UI rendering concerns

- Follow single responsibility



---



## API Layer



Must:

- Centralize HTTP calls

- Use typed contracts

- Handle errors consistently



Components must NEVER directly call fetch/axios/API endpoints.

All API communication MUST go through:

- `src/services/`

- Existing API clients

- Approved data access abstractions

- Existing query/service layers

Always reuse existing API integration patterns defined in the repository and `docs/react-rulebook.md`.

