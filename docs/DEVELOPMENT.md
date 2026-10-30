# Development Guide

## Setup
This repository currently contains the documentation scaffold. Port the working deployed source and its actual dependency manifest before running the app. Do not guess package versions or replace a working manifest blindly.

1. Install the Node.js LTS version supported by the application.
2. Install dependencies using the committed lockfile, preferably `npm ci`.
3. Copy `.env.example` to `.env.local` if needed and set only documented values.
4. Run the development script defined in the actual `package.json`.
5. Open the local URL reported by the dev server.

Never commit credentials, tokens, database passwords, or private voter data.

## Conventions
- Keep components in domain-oriented folders and use one file per meaningful component.
- Use PascalCase for React components; camelCase for functions and variables; prefix hooks with `use`.
- Type component props and API payloads.
- Put API requests in service modules, not low-level visual components.
- Centralize typography, color, spacing, and responsive breakpoints.
- Use semantic HTML, keyboard navigation, visible focus, and accessible labels.
- Keep fixtures distinct from API-backed production data.

## Git workflow
Use `feat/<name>`, `fix/<name>`, `docs/<name>`, or `refactor/<name>` branches. Write focused commits, for example `refactor: extract district directory components`. Pull requests should explain motivation, changes, tests, data sources, and include screenshots for UI changes.

## Before PR
Run configured lint, type checks, unit/integration tests, and production build. Manually verify district → dashboard → constituency → back navigation, mobile layout, keyboard accessibility, and API error states.
