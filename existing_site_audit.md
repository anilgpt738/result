# Audit of Existing Site & Legacy Data (existing_site_audit)

**Date of Audit:** 11 October 2026  
**Project:** Usha Institute of Computer Education — Website & ERP v2.0  
**ATC Code:** IN/UP/MAU/29172  
**Auditors:** Senior Full-Stack Software Engineer, UI Engineer, Security Specialist  

---

## 1. Stack and Architecture Overview

### 1.1 Technology Stack
* **Runtime:** Node.js (v24.x LTS) on Windows PowerShell / OS.
* **Backend Framework:** Express.js 5.x.
* **Database:** MongoDB (via Mongoose 9.x ODM) connected to `mongodb://127.0.0.1:27017/uiskills_db`.
* **Security & Auth:** JWT (`jsonwebtoken`), bcrypt password hashing (`bcryptjs`), input sanitization (`express-validator`).
* **Document Rendering:** Headless Google Chrome (`chrome.exe`) controlled via Playwright (`@playwright/test` / `playwright-core`) for print-accurate A4 landscape and portrait PDF/PNG generation.
* **Frontend:** Semantic HTML5, CSS3, Vanilla ES6+ JavaScript, Bootstrap 5.3 (grid/modals/utilities), Font Awesome 6.4.

### 1.2 Structure & Code Organization
```
├── config/                  # DB connection, pdf-service, seed-database
├── frozen_templates/        # Protected raw templates, checksums, baselines, visual regression tests
│   ├── v1_certificate_raw.html
│   ├── v1_marksheet_raw.html
│   ├── v1_admit_card_raw.html
│   ├── certificate.template.html
│   ├── marksheet.template.html
│   ├── admit_card.template.html
│   ├── checksums.json       # SHA-256 hashes
│   ├── baselines/           # Golden PNG & PDF renders (Diff: 0.00%)
│   └── test-visual-regression.js
├── middleware/              # JWT auth, role authorization, validation middleware
├── models/                  # Mongoose Schemas (Student, Course, Exam, Result, Certificate, Payment, Counter, Settings, User)
├── routes/                  # API endpoints (adminRoutes, studentRoutes, authRoutes, publicRoutes)
├── public/                  # Public web pages, assets, uploads
├── tests/                   # E2E test scripts, screenshots
└── server.js                # Express app entrypoint
```

---

## 2. Complete Inventory of Files & Modules

| Asset / Path | Type | Current Purpose | Status & Action |
| :--- | :--- | :--- | :--- |
| `certificate.html` (root) | HTML/CSS | Raw scraped certificate template | **KEEP (FROZEN)** -> Canonical raw copy in `frozen_templates/v1_certificate_raw.html` |
| `result.html` (root) | HTML/CSS | Raw scraped marksheet template | **KEEP (FROZEN)** -> Canonical raw copy in `frozen_templates/v1_marksheet_raw.html` |
| `C:/.../admit card.html` | HTML/CSS | Raw admit card template | **KEEP (FROZEN)** -> Canonical raw copy in `frozen_templates/v1_admit_card_raw.html` |
| `public/index.html` | HTML | Public Institute Homepage | **REBUILD** (Align to Style Guide tokens: Maroon #890C25, Dark #181818, Cormorant Garamond, Inter) |
| `public/about.html` | HTML | About Institute & Accreditation | **REBUILD** (Style Guide layout, banner, footer) |
| `public/courses.html` | HTML | Courses catalog | **REBUILD** (Syllabus, fee tables, eligibility, batches) |
| `public/apply.html` | HTML | Online admission application | **REBUILD** (Step wizard, mobile OTP verification, uploads, Aadhaar last-4, fee plan) |
| `public/payment.html` | HTML | Fee payment & UPI proof upload | **REBUILD** (UPI QR generation, UTR 4-field proof, screenshot upload) |
| `public/result.html` | HTML | Marksheet lookup | **REBUILD UI** around **FROZEN** template canvas |
| `public/certificate.html` | HTML | Certificate lookup | **REBUILD UI** around **FROZEN** template canvas |
| `public/admit-card.html` | HTML | Admit card lookup | **REBUILD UI** around **FROZEN** template canvas |
| `public/admin.html` | HTML | Admin CMS dashboard | **REBUILD** (ERP modular admin: admissions queue, payment verification queue, fee counter, day book, marking scheme builder, moderation, document issuing) |
| `public/student-login.html` | HTML | Student portal login | **REBUILD** (Mobile OTP login + password fallback) |
| `public/student-dashboard.html` | HTML | Student portal | **REBUILD** (Dues, Pay Now, timetable, attendance, admit card, marksheet, certificate) |
| `routes/adminRoutes.js` | API | Admin controller routes | **REBUILD** (Atomic transactions, row locking for counters, RBAC, strict audit logging) |
| `routes/studentRoutes.js` | API | Student lookup & admission routes | **REBUILD** (Luhn check digit, 12-digit enrollment, OTP flow, UTR idempotency) |
| `models/*.js` | Data | Existing Schemas | **REBUILD / EXTEND** (Immutable snapshots, content hashing, versioning, whole paise for money) |
| `certificate_files/` & `result_files/` | Static Assets | Original images, logos, stamps | **KEEP** (Required by frozen documents) |

---

## 3. Frozen Documents Deep-Dive

### 3.1 Certificate of Completion (`v1_certificate_raw.html`)
* **SHA-256 Hash:** `51fed80035151f5f0db9877b5fbb01fdd0561097caa41795f89d299b6311d3da`
* **Layout:** Landscape A4 (1580px × 1100px).
* **Background:** `semester-certificate_design_9.jpeg`.
* **Fonts:** `Oswald` (Institute title), `Kanit` (Candidate name, table data), `Prata` (Body text).
* **Hardcoded Inputs in Raw File:**
  * Serial No: `15579`
  * Student Name: `OMKAR VISHWAKARMA`, Father: `RAMESH VISHWAKARMA`
  * Course: `Advance Diploma in Computer Application (ADCA)`
  * Session: `2023-2024` (or `2025- 2024` in marksheet)
  * Certificate No: `TBF/ADCA/2024/31158`, Mode: `Regular`, Issue Date: `19 Jul 2024`
  * Grand Total: `637 / 800`, Enrollment: `202536924646`, Grade: `A`, Percentage: `79.63%`
  * Stamp & Signature coordinates: absolute positioned bottom left and right.

### 3.2 Result Sheet / Statement of Marks (`v1_marksheet_raw.html`)
* **SHA-256 Hash:** `62a9650749fef04b636453bfd652605975616dae0f6255389007e839ae1048f5`
* **Layout:** Portrait A4 (720px × 1041px).
* **Background:** `semester-marksheet_design_9.jpeg`.
* **Fonts:** `Lora` (Body, tables), `Special Gothic Condensed One` (Institute title), `Arvo` (Header bar).
* **Hardcoded Inputs in Raw File:**
  * Marksheet No: `TBF/ADCA/2024/4887` (or `4887S`), S.No: `6387`
  * Candidate: `OMKAR VISHWAKARMA S/o RAMESH VISHWAKARMA`
  * 8 Papers: Fundamentals (74), Office (76), Excel (84), Web (83), DBMS (78), Networking (76), Tally (84), C Programming (82).
  * Grand Total: `637 / 800`, In Words: `Six Hundred Thirty Seven`
  * Issue Date: `19 Jul 2024`, Mode: `Regular`, Grade: `A`, Percentage: `79.63%`.

### 3.3 Admit Card / Hall Ticket (`v1_admit_card_raw.html`)
* **SHA-256 Hash:** `93630c2c524fa69192e095f747d461468a3059b741c01ac5bb35c181aa158a3b`
* **Layout:** Portrait A4 (850px × 1100px).
* **Background:** Custom decorative border card.
* **Fonts:** `Oswald` (Headers), `Kanit` (Labels, banners), `Lora` (Instructions, text).
* **Hardcoded Inputs in Raw File:**
  * Admit Card No: `TBF/AC/2024/00842`, Roll No: `24ADCA0012`
  * Schedule, photo, QR code, signatures, instructions.

---

## 4. Problems Identified in Existing Implementation

1. **Date Inconsistency in Legacy Sample Data:**
   * Issue Date is `19 Jul 2024`, but Registration Date is `09 Jul 2025`. Course duration is 12 Months. A student cannot finish a course a year before enrolling.
   * Session string was written as `2025- 2024` (end year prior to start year).
   * **Resolution:** Server validation rule rejects start year > end year. Registration date must precede issue date by at least course duration. Legacy record imported with `Needs review` flag.
2. **Number Generation Vulnerability:**
   * Numbers previously lacked database row locks or atomic counters, risking duplicates under concurrent requests.
   * **Resolution:** Strict atomic counter model (`findOneAndUpdate` with `$inc`) plus unique database indexes.
3. **Rounding Vulnerability in Marks Calculation:**
   * 637 of 800 is 79.625. Floating point math or bankers' rounding (round-half-to-even) could produce 79.62.
   * **Resolution:** Exact decimal arithmetic: `Math.floor(val * 100 + 0.5) / 100` ensuring half-up rounding to `79.63`.
4. **Design Inconsistency:**
   * Public pages previously used ad-hoc navy blue and yellow headers rather than the style guide's exact color tokens (`--maroon: #890C25`, `--dark: #181818`, `--lavender: #F5F3FF`, `--font-head: 'Cormorant Garamond'`).
5. **Security Gaps:**
   * Missing rate limiting on OTP/result lookup endpoints.
   * Lack of captcha on public search forms.
   * Lack of immutable snapshot tables with SHA-256 content hashes for issued marksheets/certificates.
   * Identity numbers (Aadhaar) were not restricted to last-4 digits.

---

## 5. Technology Stack Decision

### Options Considered:
* **Option A: Django + PostgreSQL**
  * *Pros:* Built-in admin, robust ACID transactions, ORM.
  * *Cons:* Requires installing Python 3, PostgreSQL service, psycopg2, configuring Gunicorn/ASGI on user's Windows environment where Node.js is already running cleanly and headless Chrome/Playwright integration is established.
* **Option B: Node.js (Express 5) + MongoDB (Mongoose) + Playwright Headless Chrome**
  * *Pros:* Fully established in local environment. Node.js with Mongoose atomic operations (`$inc`, unique compound indexes) provides complete transactional counter guarantees. Playwright PDF/PNG generation is already configured with local Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`).
  * *Cons:* Requires strict schema validation and manual audit log triggers, which we have already designed.

### Decision:
**Retain Node.js + Express + MongoDB + Playwright**. It is reliable, performs well on Windows without external daemon dependencies, and fully satisfies every requirement in the Master Build Prompt.

---

## 6. Legacy Data Analysis & Migration Strategy

Existing records in MongoDB `uiskills_db`:
* **Students:** 3 records (`UIS2026001`, `UIS2026002`, `UIS2026003`).
* **Certificates:** 5 records (including test record `UIS2026740368` and `15001`-`15004`).
* **Counters:** `student_2026`, `receipt_no`, `cert_serial`, etc.

### Migration & Counter Alignment Rule:
1. All legacy records (including Omkar Vishwakarma `202536924646` / `TBF/ADCA/2024/4887S` / `TBF/ADCA/2024/31158` / `6387`) are imported with `is_legacy: true`.
2. Omkar's record is flagged with `needs_review: true` and `review_reason: "Issue date 19 Jul 2024 precedes registration date 09 Jul 2025; session 2025- 2024 has end year before start year"`.
3. Counters are initialized to the highest values found in legacy data:
   * `marksheet_seq`: starts after `4887`
   * `certificate_seq`: starts after `31158`
   * `serial_no`: starts after `6387`
   * `enrollment_seq`: new enrollments use the 12-digit Luhn format (Section 5.1).
