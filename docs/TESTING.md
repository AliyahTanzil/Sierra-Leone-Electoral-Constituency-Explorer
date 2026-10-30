# Testing Strategy

## District directory
- Districts/administrative areas are the primary landing content.
- The old all-constituencies grid is not shown on the landing page.
- Search/filter labels match actual behavior.
- Loading, empty, and error states are understandable.

## District dashboard
- Selecting a district opens the correct dashboard.
- Data is scoped to that district.
- Historical, unverified, and pending values are labelled.
- Back navigation returns to the directory.

## Constituency details
- The selected record opens correctly and retains its parent district context.
- Missing or unverified fields are not fabricated.

## API and data integrity
- Validate response shapes and handle HTTP errors.
- Test malformed imports, duplicate IDs, missing values, and reconciliation totals.
- Polling-centre-to-constituency relationships require a trusted source.
- Preserve source URLs, import/retrieval timestamps, and verification status.

## Accessibility and responsive behavior
- Keyboard-only navigation works.
- Focus states and accessible names are present.
- Layout works on narrow screens.
- Map attribution and a non-map alternative are available.

## Tooling and commands
Choose tools after porting the real manifest. Vitest, React Testing Library, and Playwright are options, not assumed-installed dependencies. Add scripts such as `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` only when configured. Never report an unexecuted check as passed.
