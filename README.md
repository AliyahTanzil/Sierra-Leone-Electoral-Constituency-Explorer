# Salone Constituency Explorer

Independent, source-attributed electoral reference for Sierra Leone. The intended interface is district-first: choose a district, open its dashboard, then inspect constituency details.

> **Data integrity:** This repository began empty. This initial commit establishes project documentation; it does not yet contain the live AppDeploy application's source code. Do not describe placeholders, historical figures, geocoding results, or unverified boundaries as current official facts.

## Status
- [x] Repository structure and engineering documentation
- [ ] Port the deployed AppDeploy source into this repository
- [ ] Add verified datasets and source metadata
- [ ] Configure automated tests and CI
- [ ] Configure preview and production deployment

## Intended structure
```text
src/
  app/             # app entry, routes, providers
  components/      # reusable UI grouped by domain
  layouts/         # shared page shells
  pages/           # district directory, district dashboard, constituency details
  features/        # electoral-domain rules and state
  services/        # API client and integrations
  hooks/ types/    # reusable hooks and TypeScript contracts
  data/            # explicitly labelled fixtures only
  styles/          # tokens, global and component styles
backend/           # API routes, services, persistence
public/assets/     # static images, icons, fonts
tests/             # unit, integration, end-to-end tests
docs/              # architecture, development, testing, deployment, provenance
```

## Core navigation
1. Landing page displays districts/administrative areas, not all constituencies.
2. Selecting a district opens its own dashboard.
3. Selecting a constituency opens its detail view with a route back to the parent district.
4. Source and verification status accompany figures, map layers, and polling-centre records.

## Setup
Use the Node.js LTS version supported by the eventual application and install dependencies with the repository lockfile once the actual application source and manifest have been ported. This scaffold intentionally does not guess dependency versions or claim tests have passed.

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Data provenance](docs/DATA_PROVENANCE.md)
- [Contributing](docs/CONTRIBUTING.md)

Primary reference: [Electoral Commission for Sierra Leone constituency directory](https://ec.gov.sl/constituencies/).
