# Electoral Data Provenance

## Primary references
- ECSL constituency directory: https://ec.gov.sl/constituencies/
- ECSL voter count by polling centre (June 2023 elections): https://ec.gov.sl/voter-count-by-polling-centres-for-the-june-24-2023-multi-tier-elections/

These references do not automatically validate every record transcribed into the app. Review each dataset and relationship independently.

## Required metadata
Record dataset name, source organization, URL, publication/election date when available, retrieval/import timestamps, source-file checksum where practical, parser version, rows read/accepted/rejected/duplicated, verification status, and reviewer notes.

## Status meanings
- **Verified:** checked against the authoritative source for the claim being made.
- **Historical:** tied to a past period; not presented as current.
- **Needs review:** imported but not independently checked.
- **Unverified:** origin or relationship is not established.
- **Pending:** data is not yet available or imported.

## Do not
- Infer constituency assignment from polling-centre name or district alone.
- Present geocoded points as official boundary geometry.
- Present sequence numbers/placeholders as official constituency names.
- Present historical voter totals as current registration figures.
- Claim completeness without reconciling source counts and exceptions.

## Review checklist
Preserve the original source; validate columns, row counts, IDs, spelling, duplicates, missing values, and totals; document transformations; compare samples against the source; investigate rejected rows; and show source, period, and verification status in the UI.
