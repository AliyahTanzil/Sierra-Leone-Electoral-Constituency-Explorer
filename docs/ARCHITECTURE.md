# Architecture

## Goals
- Preserve district-first navigation when porting the deployed source.
- Separate UI, electoral-domain logic, API access, and styles.
- Retain source attribution and verification metadata.
- Make components responsive and testable.

## Intended modules
- `src/app/`: app entry, routes, providers.
- `src/components/common/`: buttons, cards, badges, loading/error/empty states.
- `src/components/navigation/`: header, breadcrumbs, back navigation.
- `src/components/districts/`: district cards, directory filters, summary widgets.
- `src/components/constituencies/`: constituency entries and status indicators.
- `src/components/maps/`: map canvas, layer controls, attribution.
- `src/layouts/`: shared page shells.
- `src/pages/`: district directory, district dashboard, constituency detail, not-found page.
- `src/features/electoral-data/`: domain types, validation, selectors, use cases.
- `src/services/`: API client and adapters.
- `src/hooks/`, `src/types/`, `src/data/`, `src/styles/`: shared hooks, contracts, fixtures, design tokens/styles.
- `backend/`: routes, application services, repositories.
- `tests/`: component, page, integration, and end-to-end tests.

## Dependency direction
Pages compose layouts and components. Components receive typed props and avoid direct data fetching. Feature modules own domain rules. Services communicate with APIs. Backend routes validate requests and call services; business logic should not live in route handlers. Fixtures must be labelled and never silently mixed with production data.

## Data contracts
Use stable IDs for districts, constituencies, wards, polling centres, results, and sources. Only create relationships from credible cross-references; do not infer constituency assignment from similar names.

Retain `sourceName`, `sourceUrl`, `publicationDate` when known, `retrievedAt`, `importedAt`, `verificationStatus`, and source row/page identifiers where possible. Suggested statuses: `verified`, `historical`, `needs_review`, `unverified`, `pending`.

## Mapping
Official boundary geometry requires an authoritative source. Place-name geocoding is only an approximate locator, not an official boundary. Keep geometry provenance and map-provider attribution visible.

## Navigation states
The district directory, district dashboard, and constituency details should be distinct route-level views with loading, missing-data, error, and empty states. Dashboard content must be scoped to the selected district.
