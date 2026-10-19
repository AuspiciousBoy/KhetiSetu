# KhetiSetu Application Security Architecture & Threat Model

> **Application Name:** KhetiSetu  
> **Tagline:** "Khet Se Bazaar Tak, Ek Hi Setu."  
> **Classification:** Production-Grade Agricultural Enterprise Software  
> **Standard Compliance:** OWASP API Security Top 10 (2023), NIST SP 800-63B, OWASP ASVS 4.0  

---

## 1. Executive Summary & Security Posture

KhetiSetu connects farmers directly with retail consumers, wholesale agribusinesses, agricultural meteorology feeds, and AI post-harvest quality evaluation models. Because the platform handles real financial transactions, inventory commitments, logistics dispatches, and sensitive agricultural identities, security is built into every architectural layer—not treated as an afterthought.

---

## 2. Threat Model Matrix (Asset • Attack • Impact • Mitigation)

| Threat | Target Asset | Attack Vector | Potential Impact | KhetiSetu Mitigation Architecture |
|---|---|---|---|---|
| **Account Takeover & Credential Stuffing** | User Accounts, Session Tokens | Automated password spray via dictionaries | Unauthorized harvest manipulation, financial theft | Argon2id memory-hard hashing (m=64MB, t=3, p=2), progressive delay on failed attempts, 15-minute account lockout after 5 consecutive failures, audit logging. |
| **Broken Object-Level Authorization (BOLA)** | Orders, Produce Batches, Profiles | ID enumeration (`/api/v1/orders/:id`) | Buyer/farmer data exfiltration, invoice manipulation | Authoritative identity strictly derived from verified JWT. Strict `checkOwnership` middleware validates resource owner ID matches `req.user.id`. Accessing another user's order yields 403/404. |
| **Privilege Escalation** | Admin Capabilities, System Controls | Manipulating role payload in registration/profile | Full database takeover, arbitrary delisting | Public registration restricts roles to `['FARMER', 'CONSUMER', 'BUSINESS']`. Admin endpoints guarded by strict RBAC middleware (`authorize('ADMIN')`). Role change only accessible via audited admin endpoint. |
| **Mass Assignment** | Database Models (`User`, `Product`) | Injecting unknown attributes (`isAdmin`, `role`) | Privilege grant, balance tampering | Strict Zod validation schemas discard all undeclared parameters (`validate(schema)`). Model creation only maps allowlisted attributes. |
| **NoSQL Injection** | MongoDB Collections | Injecting `$gt`, `$where`, `$regex`, dot keys | Authentication bypass, data dumping | Custom `mongoSanitizer` middleware recursively strips keys beginning with `$` or containing `.`. Mongoose strict schema enforcement prohibits unstructured query operators. |
| **Cross-Site Scripting (XSS)** | Client Context, DOM | Stored HTML in produce descriptions, AI replies | Session token hijacking | Tokens stored strictly in React memory (never `localStorage`). Content-Security-Policy with strict origins. User input escaped. Zero use of raw un-sanitized `dangerouslySetInnerHTML`. |
| **Cross-Site Request Forgery (CSRF)** | Authenticated API Endpoints | Malicious third-party site triggering mutations | Unauthorized order dispatch or profile changes | Strict CORS allowlist (rejects arbitrary origins), `SameSite=Strict` cookies in production, custom headers (`X-Requested-With`, `Authorization`). |
| **Server-Side Request Forgery (SSRF)** | Internal Network, Cloud Metadata | Manipulating external image URLs or weather params | AWS metadata exfiltration (169.254.169.254) | No arbitrary remote fetching. Weather coordinates validated strictly as numeric latitude/longitude. Image uploads must pass direct multipart upload inspection. |
| **Malicious File Upload** | Server Filesystem, AI Service | Renamed PHP shell scripts, SVG XML bombs | Remote code execution, server takeover | Memory-storage magic-byte inspection (validates actual binary signatures `FF D8 FF`, `89 50 4E 47`). Reject executable signatures. Server-generated random UUID filenames; storage outside web root. Max 5MB. |
| **DoS & Resource Exhaustion** | Backend API, Memory, Gemini Quotas | Huge JSON bodies, rapid endpoint flooding | Service downtime, API quota exhaustion | Express body limit set to strict `10kb`. Dedicated rate limiters (global: 300/15m, login: 10/15m, AI: 10/1m, uploads: 15/10m). |
| **AI Prompt Injection** | Gemini 1.5 Flash Model | User prompt hijacking system instructions | Hallucinated pricing, toxic recommendations | Delimited system instructions separated from user content. Strict Zod schema validation on structured AI outputs. Output is never executed as shell, query or code. |
| **AI Data Leakage** | Farmer PII, Bank Data | Transmitting private user data to third-party LLM | Privacy violation, compliance penalty | Zero PII transmission. Only sanitized agronomy context (crop name, general district, soil type) is passed to Gemini. No phone numbers, passwords, or financial keys. |
| **Price & Order Manipulation** | Financial Balances, Orders | Client sends client-calculated `subtotal` or `0.01` | Revenue loss, fraudulent orders | Server is 100% authoritative. Subtotals, tax, delivery fees, and grand totals are calculated server-side from database prices. Client price inputs are ignored. |
| **Inventory Overselling & Race Conditions** | Produce Batches, Stock | Simultaneous purchases exceeding stock | Negative inventory, unfulfillable orders | Atomic database operations: `Product.findOneAndUpdate({ _id, availableQuantity: { $gte: qty } }, { $inc: { availableQuantity: -qty } })`. Returns error if stock is insufficient. |
| **Webhook Spoofing** | Payment Gateway Verification | Faked "payment_success" webhook | Fraudulent order marked paid | Cryptographic HMAC signature verification (`PAYMENT_WEBHOOK_SECRET`). Idempotent event processing by gateway payment ID. |

---

## 3. Authentication & Session Architecture

### Argon2id Password Hashing
- **Memory Cost:** 64 MB (65,536 KiB)
- **Time Cost (Iterations):** 3
- **Parallelism:** 2 threads
- **Salt:** 16 cryptographically secure random bytes

### Token Rotation & Session Lifecycle
```
Client                          KhetiSetu Server                     Database
  |                                    |                                |
  |-- POST /auth/login --------------->|                                |
  |                                    |-- Verify Argon2id ------------>|
  |                                    |-- Create Refresh Family ------>|
  |<-- 200 OK (AccessToken in body, ---|                                |
  |    RefreshToken in HttpOnly Cookie)|                                |
  |                                    |                                |
  |-- POST /auth/refresh ------------->|                                |
  |   (Cookie: refreshToken)           |-- Check Token & Family ------->|
  |                                    |-- Mark Old Token Revoked ----->|
  |                                    |-- Issue New Rotated Token ---->|
  |<-- 200 OK (New AT & New Cookie) ---|                                |
```

#### Reuse Detection Guarantee
If a revoked refresh token is presented again (indicating token compromise or man-in-the-middle capture), the server immediately revokes all tokens in that `family`, terminating every session in the chain and forcing full re-authentication.

---

## 4. Authorization Model (RBAC + Object-Level Ownership)

### Roles:
- **`FARMER`**: Can manage own farm profile, create harvest batches, trigger AI quality assessments, publish marketplace listings, view own farm fulfillment orders, and access weather/mandi intelligence.
- **`CONSUMER`**: Can browse public listings, manage shopping cart, place retail orders, view own order tracking milestones, and consult Kheti AI.
- **`BUSINESS`**: Can browse wholesale B2B listings, place commercial consignments, view supplier lot provenance, and schedule logistics.
- **`ADMIN`**: Privileged operational console. Can audit security logs, moderate produce listings, manage user accounts, assign logistics vehicles, and inspect server health.

---

## 5. File Upload Security Controls

1. **Memory Inspection Before Disk Write:** Uploads are streamed to RAM (`multer.memoryStorage()`) where the first 12 bytes are inspected against magic-byte tables (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46` for WEBP).
2. **Server-Generated Filenames:** Files are renamed to random UUIDs (`crypto.randomUUID().jpg`). User-provided filenames are completely discarded to prevent directory traversal (`../../etc/passwd`) or file overwrites.
3. **Storage Outside Web Root:** Files are stored in a dedicated directory outside the application source code tree.

---

## 6. AI Guardrails & Prompt Safety

1. **System Prompt Isolation:** System directives are configured via official SDK `systemInstruction` parameters, preventing user messages from overriding core rules.
2. **No Hallucinated Pricing:** Kheti AI is explicitly instructed never to fabricate live mandi prices or legal requirements. Numerical price forecasting is computed via mathematical Weighted Moving Average (WMA), and only summarized in plain text by AI.
3. **Structured Output Enforcement:** Gemini Quality Assessment outputs are strictly parsed and validated against Zod schemas before being accepted.
4. **Mandatory Disclaimers:** All AI quality assessments display prominent disclaimers explaining that visual inspection is not a laboratory chemical or food-safety certification.

---

## 7. Incident Response Plan

1. **Detection:** Real-time monitoring of 4xx/5xx spikes, rate-limit hits, or `REFRESH_TOKEN_REUSE_DETECTED` audit events.
2. **Containment:**
   - Invalidate user session families in `RefreshToken` collection.
   - Lock compromised user accounts via `isLocked: true`.
   - Update CORS allowlist or block offending IP ranges at reverse proxy/WAF.
3. **Remediation & Forensics:** Inspect immutable `AuditLog` collection filtering by `requestId` or `actorId` to determine the blast radius.

---

## 8. Compliance & Hardening Verification

- Centralized Error Handler never leaks database stack traces or Mongo internals in production.
- PII and credentials (passwords, tokens, keys) are masked before logs are written.
- All dependencies verified with 0 vulnerabilities (`npm audit`).
- Zero secrets committed to source control; `.env` is ignored by `.gitignore`.
