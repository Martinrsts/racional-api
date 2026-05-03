Create integration tests for the route file at `$ARGUMENTS`.

Before writing, read:

- The target route file (`$ARGUMENTS`) and its service and repository
- @src/tests/setup.ts — global `beforeEach` that truncates all tables before each test thanks to cascade.
- Any other test files that seem relevant to the route being tested
- The `$ARGUMENTS` test file if it already exists, to understand what tests are already present and what is missing

Rules:

- Use Vitest (`describe`, `it`, `expect`) and `supertest` against `app` from `@src/app.ts`
- Cover: happy path, validation errors (400), and all relevant business error cases (403, 404, 409, etc.)
- Use `db` from `@src/db/client.ts` and the relevant table schemas to set up any necessary database state for the tests, and to make assertions about the final state after the route is called
- Place the output file alongside the route file with a `.test.ts` suffix
- If needs to implemente a new helper function, add it to `@src/tests/helpers.ts` and use it in the test file

After writing the tests, run them with `npm run db:coverage` and ensure they all pass.
Debug and fix any failures before moving on.

Once passing, check the coverage report for the routes being tested and ensure
all lines are covered, with the only acceptable exceptions being defensive
`throw` statements (e.g. unexpected error paths that are intentionally unreachable).
