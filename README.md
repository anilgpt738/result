# Usha Institute Of Computer Education - Complete CMS & Management System

> **Official Portal & Centralized Institute Management System (CMS)**  
> **Authorized Training Center (ATC):** `IN/UP/MAU/29172`  
> **Campus Address:** Hanuman Mandir ke pass, Pahasa Bazar, Mau, Uttar Pradesh 221705  
> **Director:** Anil Kumar Gupta  
> **Official UPI VPA:** `7275043143@ybl`  

---

## 1. Project Overview & Architecture
This platform is a unified, production-ready educational management system built using **Node.js + Express 5 + MongoDB (Mongoose 9)** with zero native browser alerts, strict role-based access control, secure UPI and cash transaction reconciliation, server-side document rendering, and bilingual (English/Hindi) support.

### Design System: "Torchlight Editorial"
- **Colors:** Deep Navy (`#0B1230`, `#14204B`), Warm Gold (`#C9A45C`, hover `#B58F45`), Ivory (`#FAF7F0`), Ice (`#F0F4F9`), Slate (`#0F172A`, `#475569`).
- **Typography:** Fraunces/Playfair Display for headings, Inter for UI, Noto Sans Devanagari for Hindi, JetBrains Mono for codes/amounts.
- **Tokens File:** [`public/css/torchlight-tokens.css`](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/public/css/torchlight-tokens.css)
- **Shared Components:** [`public/js/usha-components.js`](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/public/js/usha-components.js) (Zero `alert()`, `confirm()` or `prompt()`).

---

## 2. Assumptions & Defaults
As instructed by Section 0 of the Master Specification, the following sensible defaults were adopted:
1. **ADCA & DCA Fee Split:**
   - **ADCA (12 Months, ₹7,000 total):** Registration Fee: ₹300, 12 Monthly Installments: ₹500/mo (₹6,000), Exam & Material Fee: ₹700. Total = ₹7,000.
   - **DCA (6 Months, ₹4,000 total):** Registration Fee: ₹300, 6 Monthly Installments: ₹500/mo (₹3,000), Exam & Material Fee: ₹700. Total = ₹4,000.
   - **BCC (3 Months, ₹2,500 total):** Registration Fee: ₹250, 3 Installments: ₹750/mo. Total = ₹2,500.
   - **Tally Prime (4 Months, ₹4,000 total):** Registration Fee: ₹400, 4 Installments: ₹900/mo. Total = ₹4,000.
   - **DCS:** Saved with status `Draft` and `isActive: false` (not displayed to public).
2. **Document Artwork:**
   - Government and ministry logos are NOT hardcoded into HTML/CSS. They only appear naturally if present inside background artwork uploaded by the institute (`public/assets/backgrounds/`).
   - Official background images (`cert-bg.jpeg` and `marks-bg.jpeg`) and logos (`logo.png`, `seal.png`, `signature.png`) are served 100% locally from `public/assets/`.
3. **Number Formats:**
   - Enrollment: `UIS{YEAR}{5-digit seq}` (e.g. `UIS2026740368`)
   - Certificate: `TBF/{COURSE}/{YEAR}/{SEQ}`
   - Marksheet: `TBF/{COURSE}/{YEAR}/{SEQ}`
   - Receipt: `RCP-{YEAR}-{6-digit seq}`
   - ID Card: `UIC-{YEAR}-{5-digit seq}`
4. **Notifications:**
   - Strictly ZERO automated email, SMS, or WhatsApp external dependencies. Dashboards, fee ledgers, and printable due slips are the sole notification mediums.

---

## 3. Local Installation & Windows Setup

### Prerequisites
- Windows 10/11 or Windows Server
- Node.js v18+ or v20+ (LTS)
- Local MongoDB running on `mongodb://127.0.0.1:27017`
- Google Chrome or Microsoft Edge installed (for Puppeteer / PDF generation)

### Installation
```powershell
cd "c:\Users\Anil Gupta\Videos\Captures\Usha Institute"
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Default `.env` values:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/uiskills_db
JWT_SECRET=usha_institute_secure_jwt_token_secret_key_2026_x87y21
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=UshaAdmin@2026#Secure
UPI_ID=7275043143@ybl
UPI_NAME="Usha Institute Of Computer Education"
```

---

## 4. Database Commands & Scripts

- **Start Development Server:**
  ```powershell
  npm run dev
  ```
- **Start Production Server:**
  ```powershell
  npm start
  ```
- **Run Seeder (Super Admin, Courses, Settings):**
  ```powershell
  npm run db:seed
  ```
- **Reset Database (Clean drop & re-seed):**
  ```powershell
  npm run db:reset
  ```
- **Backup Database (JSON export to `/backups`):**
  ```powershell
  npm run db:backup
  ```
- **Import Students from CSV:**
  ```powershell
  npm run db:import-students
  ```
- **Execute Visual Tests & Capture Screenshots:**
  ```powershell
  npm test
  ```

---

## 5. Technical Documentation & Deployment Guides

Comprehensive audit and operational documentation is located in the [`docs/`](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/docs/) directory:
- [**System Architecture & Specifications**](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/docs/ARCHITECTURE.md) (`docs/ARCHITECTURE.md`): Component layers, data flow, Mongoose models, and Luhn/rounding engines.
- [**Application Security Audit**](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/docs/SECURITY_AUDIT.md) (`docs/SECURITY_AUDIT.md`): OWASP Top 10 hardening, NoSQL injection sanitization, DPDP compliance, and file upload protection.
- [**Performance Optimization Report**](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/docs/PERFORMANCE_AUDIT.md) (`docs/PERFORMANCE_AUDIT.md`): 5 high-impact optimizations across caching, compound indexing, and search guarding.
- [**Database Migration Guide**](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/docs/DATABASE_MIGRATION.md) (`docs/DATABASE_MIGRATION.md`): Step-by-step instructions for migrating to MongoDB Atlas cloud.
- [**Hostinger Production Deployment Guide**](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/docs/DEPLOYMENT_HOSTINGER.md) (`docs/DEPLOYMENT_HOSTINGER.md`): Complete guide for Hostinger VPS setup, Node.js, PM2, Nginx reverse proxy, and Let's Encrypt SSL.

### Deployment via PM2 (Production / Hostinger VPS)
```bash
npm install -g pm2
pm2 start server.js --name "usha-cms" --time
pm2 save
pm2 startup
```

### Deployment via Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## 6. Verification & Test Artifacts
All pages have been verified on `http://localhost:5000` and automated screenshot artifacts are stored in [`tests/screens/`](file:///c:/Users/Anil%20Gupta/Videos/Captures/Usha%20Institute/tests/screens/):
- `01_design_system.png` - Design tokens, typography, and color palette
- `02_home.png` - Homepage portal with bilingual toggle
- `03_courses.png` - Standard courses catalog and syllabus
- `04_apply.png` - Online admission application form
- `05_certificate.png` - Golden certificate verification
- `06_result.png` - Statement of marks verification
- `07_admit_card.png` - Exam admit card generator
- `08_fee_payment.png` - UPI QR code payment and UTR submission
- `09_student_login.png` - Student account portal
- `10_admin_console.png` - Director CMS control center
- `11_id_card.png` - CR80 digital ID card verification
"# result" 
