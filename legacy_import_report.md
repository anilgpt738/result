# Legacy Data Import & Audit Report (legacy_import_report.md)

**Execution Mode:** LIVE COMMIT  
**Timestamp:** 2026-10-11T03:30:48.265Z  
**Database:** `uiskills_db`  

---

## 1. Import Summary

* **Records Processed:** 1
* **Records Clean / Verified:** 0
* **Records Flagged with `Needs review`:** 1

---

## 2. Legacy Sample Record Audit (Section 1.1)

| Field | Printed Value | System Audit Finding | Action Taken |
| :--- | :--- | :--- | :--- |
| **Student Name** | OMKAR VISHWAKARMA | Valid format | Stored verbatim, capitalised |
| **Father's Name** | RAMESH VISHWAKARMA | Valid format | Stored verbatim, capitalised |
| **Date of Birth** | 22 Sep 2004 | Valid date (age 20 in 2024) | Stored as `2004-09-22` |
| **Course** | Advance Diploma in Computer Application | 12 Months duration | Linked to Course `ADCA` |
| **Registration Date** | 09 Jul 2025 | Chronological anomaly | Flagged: **Preceded by issue date** |
| **Date of Issue** | 19 Jul 2024 | Chronological anomaly | Flagged: **Precedes registration date by 1 year** |
| **Session** | `2025- 2024` | Inverted sequence | Flagged: **End year prior to start year** |
| **Enrollment Number** | `202536924646` | 12 digits, legacy structure | Imported unchanged with `is_legacy: true` |
| **Marksheet Number** | `TBF/ADCA/2024/4887S` | Valid legacy pattern with `S` suffix | Preserved in snapshot |
| **Certificate Number**| `TBF/ADCA/2024/31158` | Valid legacy pattern without `S` | Preserved in snapshot |
| **Serial Number (S.No)** | `6387` | Plain integer | Preserved in snapshot |
| **Grand Total** | 637 / 800 | 8 papers @ 100 max | Exact decimal: **79.625%** |
| **Percentage** | 79.63% | Half-up rounding confirmed | Formula: `Math.floor(637/800 * 10000 + 0.5) / 100` = **79.63%** |
| **Grade** | A | Band 75.00% – 89.99% | Grade A confirmed |
| **Result** | Pass | No subject < 40 | Result Pass confirmed |

---

## 3. Discrepancies & Flagged Issues

The legacy sample record violates Section 6 business rules in two places:
1. **Date Order Violation:** The issue date (`19 Jul 2024`) is a full year prior to the registration date (`09 Jul 2025`).
2. **Session String Inversion:** Session string is formatted as `2025- 2024`, where the completion year is before the intake year.

**System Behaviour:**
Per Section 1.2 and Section 1.3, the system does NOT silently alter or guess either date. The record is flagged with:
```json
{
  "is_legacy": true,
  "needs_review": true,
  "review_reasons": [
    "Date Order Violation: Issue date (19 Jul 2024) precedes registration date (09 Jul 2025).",
    "Session Reversed: End year (2024) is before start year (2025)."
  ]
}
```

---

## 4. Counter High-Water Marks & Next Starting Sequences

Counters have been analyzed to prevent duplicate collisions with legacy records:

| Series | Highest Legacy Value Found | Proposed Next Counter Value |
| :--- | :--- | :--- |
| **Marksheet Number** | `4887` (in `TBF/ADCA/2024/4887S`) | **`4888`** |
| **Certificate Number** | `31158` (in `TBF/ADCA/2024/31158`) | **`31159`** |
| **Register Serial (S.No)** | `6387` | **`6388`** |
| **New 12-Digit Enrollments** | `202536924646` (legacy) | New enrollments use Luhn format (Section 5.1): `20260100001X` |

---

## 5. Duplicate Check
A uniqueness sweep across existing collections confirmed:
* No duplicate enrollment numbers exist.
* Marksheet and Certificate numbers are unique across all records.
