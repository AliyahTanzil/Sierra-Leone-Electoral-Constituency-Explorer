# Live AppDeploy Source Sync

## Snapshot

- App: Salone Constituency Explorer
- AppDeploy app ID: `salone-constituency-explorer-1mzq29`
- Source snapshot: `1793460931691`
- Live URL: https://salone-constituency-explorer-1mzq29.v2.appdeploy.ai/
- Snapshot status: ready
- QA: no reported frontend, network, or backend errors at deployment validation.

## Ported source

The repository now contains the complete 14-file source inventory from the deployed snapshot:

- `backend/index.ts`
- `index.html`
- `package.json`
- `postcss.config.js`
- `src/App.tsx`
- `src/components/AdministrativeMap.css`
- `src/components/AdministrativeMap.tsx`
- `src/components/RrfPollingMap.tsx`
- `src/index.css`
- `src/main.tsx`
- `tailwind.config.js`
- `tests/tests.json`
- `tsconfig.json`
- `vite.config.ts`

The restored original styling is included in `src/index.css`; the administrative and RRF map components are included without replacing the original application design.

## Runtime dependencies

The deployed source imports `@appdeploy/client` in the frontend and `@appdeploy/sdk` in the backend. These are platform runtime integrations. A local or third-party deployment must provide compatible implementations or replace them with an explicit API/auth/storage adapter. The source was copied as deployed; no unsupported package versions were invented.

## RRF location semantics and safeguards

- Browser geolocation is captured at image selection/upload time.
- A gallery image therefore receives the phone's current upload-time location, not necessarily the original shutter location.
- Pins are classified as `polling_centre_capture`, but remain pending human verification.
- Accuracy above 100 metres is flagged for low-accuracy review.
- Agent accounts see their own records; users with `rrf:supervisor` scope can see all indexed records.
- The map endpoint currently loads up to 100 entries and does not yet paginate.
- A failed shared-index write can occur after the private RRF record has been stored; idempotent retry/transactional consistency remains a required hardening task.

Do not describe these pins as official or verified polling-centre coordinates.

## Next engineering tasks

1. Make RRF record persistence and shared map indexing transactional or idempotent.
2. Add pagination to the supervisor and agent map endpoint.
3. Implement a supervisor verification interface and immutable audit trail.
4. Add EXIF GPS extraction as a separate evidence field.
5. Add offline capture and reliable queued synchronization.
6. Verify a clean standalone build with explicit platform SDK adapters and lockfile.
7. Add executable unit/integration tests and CI; the current JSON file is an AppDeploy acceptance-test specification, not a test runner.
