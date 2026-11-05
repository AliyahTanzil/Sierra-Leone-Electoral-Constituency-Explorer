# Salone Constituency Explorer

A mobile-friendly, source-attributed electoral and geographic reference for Sierra Leone. The application uses a district-first navigation model: explore administrative areas, open district dashboards, and inspect constituency records.

## Current application

The working React/Vite application and AppDeploy backend have been ported from the live AppDeploy snapshot into this repository.

- Interactive Leaflet administrative map with ADM2 and ADM3 reference layers.
- District and constituency navigation with parent-district map focus.
- GPS-enabled RRF image capture and polling-location map pins.
- Agent-scoped RRF visibility and supervisor visibility when the `rrf:supervisor` authorization scope is assigned.
- Responsive UI using the established navy, teal, white and soft-grey design system.

## Important data and verification notes

- Administrative map layers are reference geography, not official constituency boundaries.
- Koya and East III are retained as valid source features.
- RRF map pins represent GPS capture points. They are not official polling-centre coordinates until independently verified.
- Gallery-selected images are geotagged at upload time by the browser; embedded EXIF GPS is not currently extracted.
- GPS accuracy flags and OCR-derived polling-centre labels are review aids, not proof of polling-centre identity.
- Supervisor-wide map visibility requires the authenticated user to have the `rrf:supervisor` scope.
- The RRF map API currently returns a maximum of 100 points per request. Pagination and a full supervisor verification workflow remain future work.
- The backend stores a private RRF record before writing its shared map index; transactional consistency/idempotent retry should be strengthened.

## Source provenance

Administrative boundary reference data is sourced from geoBoundaries:
- ADM2: geoBoundaries, Sierra Leone, 2017 reference year, CC BY 3.0 IGO; source: Government of Sierra Leone / OCHA ROWCA.
- ADM3: geoBoundaries, Sierra Leone, 2016 reference year, CC BY 4.0; source: openAFRICA / geoBoundaries.

The map UI displays source attribution and warns users not to interpret administrative overlays as electoral boundaries. See [Data provenance](docs/DATA_PROVENANCE.md).

## Development

The application was deployed and validated in the AppDeploy runtime. The current source imports platform-provided `@appdeploy/client` and `@appdeploy/sdk` modules. A standalone local build requires those platform SDKs or a documented replacement adapter; do not assume a plain npm install reproduces the hosted runtime.

Typical Vite commands:
```bash
npm install
npm run dev
npm run build
```

The manifest contains the application dependencies captured from the deployed project. Verify platform SDK availability and add/lock any missing public dependencies before treating a standalone build as reproducible.

## Repository layout

- `src/` — React application, maps, styles and entry point
- `backend/` — AppDeploy API handlers, RRF capture, OCR and map index
- `tests/tests.json` — AppDeploy acceptance scenarios
- `docs/` — architecture, development, testing, deployment and provenance guidance

## Primary electoral reference

[Electoral Commission for Sierra Leone — Constituencies](https://ec.gov.sl/constituencies/)
