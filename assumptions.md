# System Assumptions & Owner Decisions (assumptions.md)

**Project:** Usha Institute of Computer Education — Website & ERP v2.0  
**Status:** Active  
**Last Updated:** 11 October 2026  

---

## 1. Owner Decisions (Implemented Defaults)

Per Section 1.3 of the Master Build Prompt, the following decisions have been codified into settings and business logic:

| # | Question / Topic | Implemented Default | Rationale & Code Location |
| :--- | :--- | :--- | :--- |
| **1** | **Sample Record Dates** (Omkar Vishwakarma) | Both dates treated as unverified. The record is imported with `is_legacy: true`, `needs_review: true`, and reason `"Issue date 19 Jul 2024 precedes registration date 09 Jul 2025; session 2025- 2024 has end year before start year"`. | Preserves legacy integrity without fabricating dates. Rule runs in `legacyImport` and prevents editing without audit reason. |
| **2** | **Document Prefix (TBF)** | Configured as a dynamic institute setting in `settings.document_prefix` with default `"TBF"`. | Configurable per awarding body or affiliate norms. Can be changed in Admin Settings without code modifications. |
| **3** | **Marksheet Suffix (S)** | Configured in `settings.marksheet_suffix` with default `"S"`. Certificate numbers do not have an `S` suffix. | Matches printed sample `TBF/ADCA/2024/4887S`. |
| **4** | **Counter Reset Rules** | Number series do NOT reset each calendar year. Counters continue sequentially after the highest number already used. | Guarantees non-overlapping serials across annual transitions. |
| **5** | **Starting Counter Values** | Marksheet counter starts after `4887`; Certificate counter starts after `31158`; S.No (Register Serial) starts after `6387`. | Based on highest values in the legacy sample record. |
| **6** | **Subject Lists & Maximum Marks** | Initial starter schemes configured for all 5 core courses: ADCA (8 papers, 800 marks total), DCA (4 papers, 400 marks total), BCC (4 papers, 400 marks total), Tally (4 papers, 400 marks total), O-Level (4 papers, 400 marks total). | Exact 8 ADCA papers from the sample marksheet are used as the gold standard. |
| **7** | **Grade Bands & Pass Rule** | Editable bands in Settings: A+ (90.00% – 100.00%), A (75.00% – 89.99%), B (60.00% – 74.99%), C (40.00% – 59.99%), F (0.00% – 39.99%). Pass percentage: 40.00% per paper and overall. | Exact decimal arithmetic with round-half-up. 637 of 800 gives 79.63% (Grade A). |
| **8** | **Allowed Values for Mode** | `Regular` (default), plus `Ex-Student`, `Private`, `Distance`. | Configurable array in Settings. |
| **9** | **Institute Branching** | Single campus: Hanuman Mandir ke pass, Pahasa Bazar, Mau, Uttar Pradesh 221705. ATC Code: `IN/UP/MAU/29172`. | Stored in settings. Ready for multi-branch extension if required later. |
| **10** | **Payment & Reservation Windows** | Official UPI ID: `7275043143@ybl`. Seat hold for cash payments: 3 days. Online payment proof submission window: 48 hours. | Stored in settings. Attempts exceeding window automatically expire. |
| **11** | **Bilingual Support** | English (en) and Hindi (hi) language toggle across all public pages and the student portal. | Dictionary translations stored in JSON i18n bundles. |

---

## 2. Additional Engineering & Architectural Assumptions

1. **Frozen Document Inviolability:**
   * The three document layouts (Certificate, Marksheet, Admit Card) are strictly frozen. Their markup, stylesheets, font choices, borders, stamps, and layout coordinates remain untouched.
   * If candidate names or paper titles exceed standard column widths, existing CSS overflow/wrapping rules govern the display without expanding canvas boundaries.
2. **Immutable Document Snapshots:**
   * Once a marksheet or certificate is issued, a complete JSON snapshot of all printed fields and a SHA-256 content hash are persisted. Subsequent edits to student master records will NEVER modify already-issued certificates. Re-issue requires generating a new version with supersession tracking.
3. **Numbering Guarantee (Concurrency & Locking):**
   * Atomic sequence generation relies on MongoDB's atomic `findOneAndUpdate` with `$inc` on `counters`, backed by compound unique database indexes.
4. **Rounding Accuracy:**
   * Percentages are calculated as exact decimals: `Math.floor(val * 100 + 0.5) / 100` ensuring half-up rounding. Test cases explicitly verify that 637 / 800 produces 79.63% (not 79.62%).
5. **Aadhaar Privacy (DPDP Act Compliance):**
   * No full 12-digit Aadhaar numbers are stored or accepted. The system accepts and stores only the last 4 digits (`aadhaar_last4`), alongside masked identity proof document uploads.
