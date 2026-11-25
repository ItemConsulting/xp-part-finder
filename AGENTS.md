# Agent guidelines

## Functional programming

Write TypeScript in a functional style. Prefer small, pure functions composed together over imperative code.

### Do not mutate

- Declare variables with `const`. Do not use `let` or `var`.
- Do not reassign function parameters.
- Do not change arrays or objects after they are created. Create new ones instead:
  - Spread to add or change: `[...list, item]`, `{ ...obj, key: value }`.
  - Avoid mutating methods: `push`, `pop`, `shift`, `unshift`, `splice`, `reverse`, `fill`, and assigning to
    properties or indexes.
  - `sort` mutates the array it is called on. Only call it on an array that was just created in the same expression
    (for example the result of `map` or `filter`), or copy it first with `slice()`.

### Use functions instead of loops

- Do not use `for`, `for...of`, `for...in`, `while` or `do...while`.
- Transform data with array methods: `map`, `filter`, `reduce`, `some`, `every`, `concat`, `slice`, `join`.
- Use `reduce` to build up a single value, such as a sum, a lookup object or the "best" element of a list.
- Chain the steps into a pipeline that reads top to bottom, e.g. `list.filter(...).map(...).sort(...)`.

### Keep functions pure

- A function's result should depend only on its arguments, and it should not change anything outside itself.
- Keep side effects (calls to XP libraries, logging, rendering) at the edges, such as in controllers, and pass their
  results into pure functions.
- Return values instead of updating outer state. Return `undefined` (and filter it with `notNullOrUndefined`) instead
  of throwing for expected "not found" cases.

### Small and composable

- Give each function one job and a descriptive name, so pipelines read like sentences.
- Prefer expressions over statements: arrow functions with expression bodies, ternaries and `??` over `if`/`else`
  blocks that assign variables.
- Compute derived data once and pass it along, instead of calling the same expensive function several times.

### Performance comes first

Functional style must not cost performance. When an array method version would be clearly slower (for example
`reduce` with `concat`, which is quadratic), use a local `for` loop inside a small helper function, and mark it with
the comment used in `utils.ts`. The function itself must still be pure.

## Performance and database lookups

Prioritize performance whenever code queries the database (lib-node, lib-content) or lists schemas (lib-schema).
There can be a large number of components, and each component can be used in a large number of content items, across
many projects (repos).

- **No queries in loops.** Never query once per component, content item, application or project (the N+1 problem).
  Fetch everything needed in one query, and look up the results in memory afterwards.
- **Query across repos at once.** Use `multiRepoConnect` (or `queryAllRepos`) for all projects, instead of one query
  per project.
- **Let the database do the work.** Use `filters` and `query` to narrow results, `sort` to order them and
  `aggregations` to count them, instead of fetching nodes and filtering, sorting or counting in JavaScript.
- **Only fetch what is needed.**
  - Use `count: 0` when only aggregations are needed.
  - Use aggregations to count usages, instead of fetching the content and counting it.
  - Only fetch full nodes (`connection.get`) for the hits that are actually shown.
- **Reuse results within a request.** Run each query or listing (such as `listComponents` per application and type)
  at most once per request, and pass the result to the functions that need it.
- **Do as little as possible per request.** Requests from Turbo Frames (`turbo-frame` header) only render part of the
  page, so they should only run the lookups that part needs.
- **Be aware of limits.** Queries and aggregations return a limited number of results (`count`, aggregation `size`).
  Choose limits that cover realistic data, and do not assume a result is complete if it can be truncated.
- **Measure.** When changing lookups, check the response time of the affected pages before and after.

## Designsystemet and accessibility

The UI is built with [Designsystemet](https://designsystemet.no). Its documentation for LLMs is available at
https://designsystemet.no/llms.txt. Read it to learn:

- how to use Designsystemet's components, CSS classes (`ds-*`), data attributes (`data-color`, `data-size`,
  `data-variant`, ...) and design tokens (`--ds-*` custom properties)
- best practices for accessibility (a11y) patterns, such as navigation, tables, forms, focus handling and texts for
  screen readers

Prefer Designsystemet's components, tokens and accessibility patterns over custom solutions.

## Server-side runtime (Enonic XP)

Server code (everything outside `assets/`) runs on Nashorn and is type checked against ES5 (`"lib": ["es5"]` in
`src/main/resources/tsconfig.json`). Newer built-ins such as `Array.prototype.flatMap`, `Array.prototype.find`,
`Object.entries` and `Object.fromEntries` are not available there. Use the helpers in
`src/main/resources/lib/part-finder/utils.ts` (`flatMap`, `find`, `unique`, `difference`, `objectKeys`,
`forceArray`, `notNullOrUndefined`, ...) or add a new pure helper there.
