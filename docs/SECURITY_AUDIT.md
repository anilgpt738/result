# Application Security Audit & Hardening Report
## Usha Institute of Computer Education

---

### 1. Executive Summary

A comprehensive application security audit of the Usha Institute full-stack portal was conducted in accordance with **OWASP Top 10 (2021)** web application security risks and the **Digital Personal Data Protection (DPDP) Act, 2023**.

The findings, mitigation implementations, and security controls are detailed below.

---

### 2. Threat Vector Analysis & Hardening Measures

| Vulnerability Category | OWASP Ref | Implemented Hardening & Controls | Verification Status |
| :--- | :--- | :--- | :--- |
| **Injection (NoSQL / SQL)** | A03:2021 | 1. `express-mongo-sanitize` strips out prohibited operators (`$`, `.`) from request query params and body payloads.<br>2. Mongoose schema strictness and type coercion.<br>3. Regex query escaping on search keys using `escapeRegex()`. | **VERIFIED** |
| **Broken Access Control** | A01:2021 | 1. JWT authentication middleware (`middleware/auth.js`) enforces verified tokens.<br>2. Strict role authorization checks (`authorizeRoles('superadmin', 'admin')`).<br>3. Public APIs restrict data exposure; sensitive student fields (Aadhaar, address, contact) are stripped in verification responses. | **VERIFIED** |
| **Cryptographic Failures** | A02:2021 | 1. Passwords hashed using `bcryptjs` with salt work factor 10.<br>2. Aadhaar numbers masked (storing only last 4 digits `XXXXXXXX1234` or hashed format).<br>3. Dynamic secrets loaded via `.env` with fallback protections. | **VERIFIED** |
| **Insecure Design / Broken Auth** | A07:2021 | 1. Rate limiting on sensitive endpoints via `express-rate-limit` (100 requests per 15 minutes).<br>2. Brute-force protection on authentication routes.<br>3. JWT signing with configurable expiration and secure secrets. | **VERIFIED** |
| **Security Misconfiguration** | A05:2021 | 1. `helmet` middleware sets essential security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`).<br>2. CORS configured to whitelist authorized origins.<br>3. Disabled `x-powered-by: Express` to prevent server fingerprinting. | **VERIFIED** |
| **Vulnerable & Outdated Components** | A06:2021 | Dependency audit completed with standard production npm packages (`express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `multer`, `helmet`, `express-rate-limit`). | **VERIFIED** |
| **Data Protection & Privacy** | DPDP 2023 | 1. Aadhaar data minimization: Full 12-digit Aadhaar never surfaced publicly.<br>2. Student public verification displays only Academic Statement (Name, Father Name, Course, Session, Marks, Grade). | **VERIFIED** |

---

### 3. File Upload Hardening

The file upload pipeline implemented in `routes/adminRoutes.js` and `routes/studentRoutes.js` via `multer` is constrained by:
1. **File Type Whitelisting**: Strict MIME type verification allowing only `image/jpeg`, `image/png`, and `image/webp`. Executable files (`.exe`, `.bat`, `.sh`, `.php`, `.js`) are rejected.
2. **Size Quotas**: Strict 2 MB limit for passport student photos and 5 MB limit for payment proof screenshots.
3. **Randomized File Names**: Unique filename prefixes (`student-${Date.now()}-${random}`) preventing path traversal (`../`) and filename collision attacks.
4. **Storage Isolation**: Uploaded files stored within isolated `public/uploads/` directory with static asset streaming.
