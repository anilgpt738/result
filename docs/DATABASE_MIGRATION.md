# Database Migration Guide: Local to MongoDB Atlas
## Usha Institute of Computer Education

---

### 1. Overview
This guide provides the complete, production-verified procedure for migrating the Usha Institute database from the local MongoDB instance (`mongodb://127.0.0.1:27017/uiskills_db`) to a managed MongoDB Atlas cloud cluster (or Hostinger VPS MongoDB service).

---

### 2. Migration Options

#### Method A: Direct Cloud Re-seed (Recommended for Clean Deployment)
If deploying fresh to production:
1. Obtain your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/uiskills_db?retryWrites=true&w=majority
   ```
2. Update `.env` with the cloud connection string.
3. Run the automated master seeding script:
   ```bash
   node config/seed-database.js
   ```
4. This atomically populates:
   - Superadmin account (`superadmin`) and administrator (`admin`)
   - Institutional profile, affiliation text, center code (`IN/UP/MAU/29172`)
   - 5 standard accredited courses (ADCA, DCA, BCC, TALLY, DCS)
   - Annual Examination 2026 with multi-date timetable slots
   - Canonical student records (`UIS2026001`, `UIS2026002`, `UIS2026003`)
   - Numbering sequence counters (`student_2026`, `receipt_no`, `cert_serial`)

---

#### Method B: Full Dump and Restore (`mongodump` & `mongorestore`)
If existing operational data needs to be preserved and transferred:

1. **Export Local Database**:
   ```bash
   mongodump --db=uiskills_db --out=./db_backup
   ```

2. **Restore to MongoDB Atlas**:
   ```bash
   mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/uiskills_db?retryWrites=true&w=majority" ./db_backup/uiskills_db
   ```

3. **Verify Collections & Indices**:
   Connect via `mongosh` or MongoDB Compass and confirm the following collections are present:
   - `users`
   - `students`
   - `courses`
   - `exams`
   - `results`
   - `certificates`
   - `payments`
   - `counters`
   - `settings`
   - `batches`
   - `attendances`

4. **Verify Connectivity in Application**:
   Run the test suite against the cloud URI:
   ```bash
   node tests/master_acceptance_suite.js
   ```
