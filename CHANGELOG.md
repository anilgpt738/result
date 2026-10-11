# CHANGELOG: Usha Institute Website & ERP v2.0

## [Phase 0] - 2026-10-11: Audit, Frozen Baseline Extraction & Legacy Ingestion

### Added
* **Frozen Document Safeguards (`frozen_templates/`):**
  * Extracted raw copies of Certificate (`v1_certificate_raw.html`), Marksheet (`v1_marksheet_raw.html`), and Admit Card (`v1_admit_card_raw.html`).
  * Cryptographic manifest `checksums.json` with SHA-256 hashes for all three documents.
  * Template files (`certificate.template.html`, `marksheet.template.html`, `admit_card.template.html`) replacing only dynamic values with Section 4.4 tokens without altering a single character of layout, markup, fonts, or styles.
  * Golden baseline renders in `frozen_templates/baselines/` (`baseline_certificate.png/.pdf`, `baseline_marksheet.png/.pdf`, `baseline_admit_card.png/.pdf`) generated with exact Section 1.1 sample data.
  * Automated visual regression suite (`frozen_templates/test-visual-regression.js`) verifying checksum integrity and 0.00% pixel layout drift.
* **Architecture & Decision Deliverables:**
  * `existing_site_audit.md`: Full stack audit, component inventory (Keep/Rebuild/Delete), frozen document analysis, vulnerability catalog, stack decision.
  * `assumptions.md`: Comprehensive owner decision defaults (TBF prefix, S suffix, no yearly counter reset, editable grade bands, 40% pass rule, 48h payment window, etc.).
  * `design_decisions_needing_approval.md`: Derived states (focus, error, disabled, loading, alerts) and status badge palettes.
  * `legacy_import_report.md` & `config/legacy_import.js`: Dual-mode (dry-run & live) migration script, validation against Section 6 rules, flagging Omkar Vishwakarma (`202536924646`) with `Needs review`, and initializing sequence counters after highest legacy numbers (Marksheet: 4887, Certificate: 31158, S.No: 6387).

### Verified
* All three golden baseline documents verified visually and via automated pixel byte comparison (Diff: 0.00%).
* Visual regression test passed in CI/testing run.
* MongoDB connection and counter synchronization confirmed.
