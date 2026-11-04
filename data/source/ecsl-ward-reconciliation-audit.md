# ECSL ward-to-constituency reconciliation audit

**Prepared:** 4 November 2026  
**Project:** Salone Constituency Explorer  
**Status:** Source comparison completed; full constituency assignment NOT approved.

## Sources examined

1. ECSL, *Boundary Delimitation Wards*: https://ec.gov.sl/wards/
2. ECSL, *Constituencies*: https://ec.gov.sl/constituencies/
3. National Electoral Commission / ECSL, *Constituency Boundary Delimitation Report, Volume 2* (August 2017): https://ec.gov.sl/wp-content/uploads/2022/09/BD-Constituency-Description-and-Maps.pdf

## Confirmed extract

- The ECSL wards page states **446 wards**.
- The source extract contains 446 unique legacy ward numbers (001–446) and preserves the published description text, district table heading, population where parseable, and source provenance.
- No constituency IDs are inserted into the ward extract. The wards page itself does not provide a direct ward-number-to-constituency-number field.
- Ward 273 has no population value parsed from its description; the description is retained.

## District ward-count comparison

The district table groupings in the wards page extract and the district summary on the constituencies page do not agree.

| District | Ward page table extract | Constituencies page summary |
|---|---:|---:|
| Kailahun | 30 | 29 |
| Kenema | 42 | 22 |
| Kono | 27 | 27 |
| Bombali | 24 | 28 |
| Falaba | 18 | 21 |
| Koinadugu | 18 | 21 |
| Tonkolili | 29 | 31 |
| Kambia | 23 | 28 |
| Karene | 21 | 21 |
| Port Loko | 31 | 31 |
| Bo | 42 | 42 |
| Bonthe | 21 | 21 |
| Moyamba | 22 | 20 |
| Pujehun | 23 | 11 |
| Western Area Rural | 27 | 32 |
| Western Area Urban | 48 | 57 |
| **Total** | **446** | **442** |

The wards page district-heading counts sum to 446. The constituencies page district summary counts sum to 442, although the wards page states 446. These two published summaries cannot both be used as a consistent district allocation without further ECSL clarification. The difference is not silently corrected in this project.

## Specific cross-district conflict

- The wards page places legacy Ward 030 under the **Kailahun Ward Summary Description** heading and describes the entire Kandu Lekpeiama Chiefdom, population 18,229.
- The 2017 delimitation report describes Constituency 011 as comprising Kandu Leppiama, Small Bo, Niawa and Langrama in **Kenema District**; its listed population for Kandu Leppiama is also 18,229.
- This is a strong source-level cross-reference indicating that the Ward 030 heading placement requires correction or clarification by ECSL. The original ward record remains unchanged and flagged for review; no automatic district reassignment is applied.

## What the 2017 report supports

- The report describes the 2017 delimitation exercise and constituency component parts for the historical 16-district electoral structure.
- Its constituency descriptions identify chiefdoms and, where relevant, sections and local areas.
- The extracted report text contains explicit Ward No / Constituency tables for the Western Urban constituency section (legacy wards 399–446). For the other districts, the report text principally provides constituency component-part descriptions rather than a complete, machine-readable 001–446 ward-number-to-constituency crosswalk.
- Matching a ward's chiefdom/section description to a constituency component description can produce candidate assignments, but split chiefdoms, partial sections, OCR/text extraction quality, and the Ward 030 conflict require manual validation. A text similarity or majority-area result is not an official crosswalk.

## Decision for application data

1. Keep all 446 records in the source layer with original ward number and original published description.
2. Do not populate `constituencyId` from guesswork.
3. Do not issue new sequential ward numbers ordered by constituency yet.
4. Keep the RRF ward selector locked until the complete 446-record constituency assignment register is reconciled and verified.
5. Preserve source district and proposed/corrected district separately if ECSL later confirms corrections; never overwrite source provenance.
6. Treat the 2017 crosswalk as historical until ECSL confirms whether any post-2026 electoral boundary or district crosswalk has been adopted.

## Next required evidence

Obtain from ECSL a machine-readable ward register or written confirmation of:
- the correct district allocation for Ward 030 and any other heading inconsistencies;
- the official district ward totals (the two pages currently conflict);
- the constituency number for each of the 446 legacy ward numbers;
- whether the 2017 constituency/ward framework remains the operative electoral crosswalk following the 2026 creation of Bandajuma and Kpanguima administrative districts.

**No production registry records were changed and no application deployment was made as part of this audit.**
