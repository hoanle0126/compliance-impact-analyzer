# ImpactLens Architecture Specification

## 1. System Overview

**Compliance Impact Analyzer (ImpactLens)** is an enterprise compliance intelligence and decision-support system designed to determine the precise operational, legal, and documentary impact of regulatory updates on corporate entities.

ImpactLens is built on the fundamental premise that **compliance systems must not invent legal conclusions**. Rather than piping raw legal documents into an unconstrained conversational AI and blindly trusting its output, ImpactLens utilizes a **hybrid deterministic-probabilistic architecture**:

1. **Deterministic Applicability Engine:** Evaluates structured regulatory metadata against verified company profile facts and customs profile attributes.
2. **Authoritative Evidence Linking:** Cites only verified, official legal excerpts with hierarchical paths (`Chương > Điều > Khoản > Điểm`).
3. **Structured Impact & Obligation Synthesis:** Maps changes to distinct operational dimensions (Customs, Documentation, Record Retention, IT/Data, Finance, Supply Chain).
4. **Transparent Explainability Framework:** Presents findings via the **5-Pillar Framework** (WHAT, WHO, WHY, SO WHAT, NOW WHAT).
5. **Human-in-the-Loop Governance:** Enforces a multi-stage review workflow (Draft $\to$ Analyzed $\to$ In Review $\to$ Approved/Rejected) with complete audit trail and profile/analysis versioning.

```
                      +------------------------------------------+
                      |         Regulatory Update Source         |
                      | (Circulars, Decrees, RegTracker Webhook) |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       Regulatory Change Normalizer       |
                      | - Topic Tagging (Customs, Taxes, Duty)   |
                      | - Clause Hierarchy & Diff Extraction     |
                      +------------------------------------------+
                                           |
                                           v
+--------------------------+  +------------------------------------------+
|  Organization Profile    |  |     Deterministic Applicability Engine   |
| - Verified Facts         |->| - Condition Matchers (EQUALS, CONTAINS)  |
| - Customs Status (FDI)   |  | - Strict Reason Codes & Factor Trace     |
| - Products & HS Codes    |  +------------------------------------------+
+--------------------------+                       |
                                                   v
                                      [APPLIES / DOES_NOT_APPLY /
                                      INSUFFICIENT_INFORMATION]
                                                   |
                                                   v
                      +------------------------------------------+
                      |       Authoritative Legal Evidence       |
                      | - Exact Legal Citations ([EV-001])       |
                      | - RegTracker / Legal RAG Integration     |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       Impact & Prioritization Engine     |
                      | - Operational Dimension Mapping          |
                      | - Severity Matrix & Urgent Deadlines     |
                      | - Action Plan Generation                 |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       Human Review & Approval Queue      |
                      | - Compliance Officer Sign-off            |
                      | - Override Audit Trail & Immutable Ver.  |
                      +------------------------------------------+
```

---

## 2. Monorepo & Technology Stack

The project is structured as a **pnpm monorepo** using strict TypeScript and isolated infrastructure:

```
├── apps/
│   ├── api/                     # NestJS 11 REST API, Prisma ORM, BullMQ, Swagger
│   └── web/                     # Next.js 15 App Router, Tailwind CSS, shadcn/ui
├── packages/
│   ├── shared/                  # Common TypeScript interfaces, DTOs, Enums
│   ├── applicability-engine/    # Deterministic rule engine & condition evaluators
│   ├── impact-engine/           # Impact scoring, obligation synthesis, LLM abstraction
│   └── integrations/            # RegTracker & Legal RAG adapters
├── docs/                        # Architecture, engine specs, security, API guides
├── docker-compose.yml           # Isolated PostgreSQL (55433) & Redis (6383)
└── package.json                 # Monorepo root scripts & pnpm workspace
```

### Core Technologies
- **Backend:** NestJS 11, Node.js 22 LTS, TypeScript 5.7.
- **Frontend:** Next.js 15 (React 19), Tailwind CSS, Lucide icons, Dark Enterprise Theme.
- **Database & Storage:** PostgreSQL 16 (Port 55433), Prisma ORM 6.4 with transactional consistency.
- **Queue & Caching:** Redis 7 (Port 6383), BullMQ for asynchronous analysis execution.
- **Testing:** Vitest for unit & integration tests, Supertest for API integration, Playwright for end-to-end browser workflows.
- **AI Providers:** Pluggable `LlmProvider` supporting OpenAI, Gemini, Anthropic Claude, and deterministic zero-cost `MockLlmProvider`.

---

## 3. Core Subsystems

### 3.1 Regulatory Change Input & Normalization
Regulatory updates from the Vietnamese Ministry of Finance / General Department of Vietnam Customs (e.g. *Thông tư 39/2026/TT-BTC*) are ingested through manual entry, JSON payload, or the `/api/integrations/regulatory-change` webhook.
Each update contains:
- Legal Metadata: Document number, title, issuing authority, enactment date, effective date.
- Clause Diffs: Hierarchy path (`Chương II > Điều 8 > Khoản 1`), previous legal wording, new enacted wording, and modification type (`MODIFIED`, `ADDED`, `REPEALED`).
- Compliance Topics: Tagged with deterministic keywords and verified taxonomies (`CUSTOMS_PROCEDURE`, `DOCUMENT_REQUIREMENT`, `RECORD_RETENTION`, `DATA_REQUIREMENT`).

### 3.2 Organization Profile & Fact System
Organizations are modeled beyond a simple flat schema:
- **Organization Identity:** Legal name, tax ID, jurisdictions, enterprise type (`FDI_ENTERPRISE`, `DOMESTIC_ENTERPRISE`).
- **Customs Profile:** Boolean flags for registered importer, exporter, customs broker, bonded warehouse operator, export processing enterprise (EPE).
- **Business Activities:** Normalized records (`IMPORT`, `EXPORT`, `MANUFACTURING`, `DISTRIBUTION`, `WAREHOUSING`).
- **Profile Facts:** Typed key-value assertions with audit provenance:
  - Source: `USER_PROVIDED`, `IMPORTED`, `DERIVED`, `SYSTEM`, `UNKNOWN`.
  - Confidence: `VERIFIED`, `PROVISIONAL`, `INFERRED`, `UNCONFIRMED`.
  - Example: `USES_IMPORTED_RAW_MATERIALS = true` (`VERIFIED`).
- **Profile Versioning:** Immutable profile snapshots ensuring historical compliance analyses remain reproducible even when corporate operations evolve.

### 3.3 Applicability Engine
The deterministic applicability engine safeguards against AI hallucination:
- Rules check specific preconditions (`organizationType`, `businessActivities`, `facts`, `customsStatus`, `jurisdictions`).
- Supports safe operators: `EQUALS`, `NOT_EQUALS`, `IN`, `NOT_IN`, `CONTAINS`, `EXISTS`, `NOT_EXISTS`, `STARTS_WITH`, `RANGE`.
- Generates 5 distinct outcomes:
  - `APPLIES`: Unambiguous factual match.
  - `POTENTIALLY_APPLIES`: Profile matches regulatory scope, pending specific transaction review.
  - `DOES_NOT_APPLY`: Organization operations strictly outside regulatory purview.
  - `INSUFFICIENT_INFORMATION`: Missing critical profile attributes (e.g. import status unknown).
  - `REQUIRES_REVIEW`: Ambiguous legal threshold requiring legal specialist assessment.
- Decision Trace: Captures every evaluated rule, operator, and input fact for full auditability.

### 3.4 Impact Engine & Prioritization
When an update applies, the Impact Engine analyzes consequences across operational dimensions:
- **Impact Dimensions:** `CUSTOMS`, `DOCUMENTATION`, `RECORD_RETENTION`, `IT_DATA`, `FINANCE`, `SUPPLY_CHAIN`, `OPERATIONS`, `LEGAL`.
- **Severity Scoring:** Deterministic evaluation considering:
  - Legal obligation level (Mandatory filing vs optional procedure)
  - Statutory deadlines (Proximity to effective date)
  - Sanction & penalty exposure under Vietnamese Customs decree
  - Operational disruption breadth
- **Deterministic Priority Formula:**
  $$\text{Priority Score} = \text{Severity Weight} \times \text{Confidence Multiplier} \times \text{Deadline Urgency} \times \text{Operational Breadth}$$
- **Obligations & Actions:**
  - Structured compliance obligations (e.g. `FILE`, `RETAIN_RECORDS`, `UPDATE_PROCESS`).
  - Actionable operational tasks with designated department owners (`CUSTOMS`, `IT`, `LEGAL`, `FINANCE`) and target completion dates.

### 3.5 Authoritative Legal Citations & Safety Validation
The backend enforces a strict rule: **The LLM may only cite legal evidence IDs supplied by the backend**.
- Retrieved evidence items are assigned system IDs (`EV-001`, `EV-002`).
- LLM output is validated against this whitelist; hallucinated citation IDs (`EV-999`) or fabricated article numbers are immediately rejected or purged.
- Deadlines must have verified textual support in cited legal clauses; unsourced dates are stripped and flagged for human review.

### 3.6 Human Review & Workflow Governance
Analyses transition through distinct governance states:
1. `DRAFT`: Initial draft before complete engine evaluation.
2. `ANALYZED`: System processing complete; awaiting compliance specialist sign-off.
3. `NEEDS_REVIEW`: High-risk or low-confidence analysis flagged for mandatory review.
4. `IN_REVIEW`: Assigned compliance reviewer actively investigating findings.
5. `APPROVED`: Formally signed off by authorized compliance officer.
6. `REJECTED`: Assessment rejected with mandatory rationale and corrective instructions.
7. `SUPERSEDED`: Replaced by a newer version triggered by profile or regulatory updates.

---

## 4. Multi-Tenant Isolation & Role-Based Access Control

Security is enforced at the database and application gateway layer:
- **Role Hierarchy:**
  - `SYSTEM_ADMIN`: Global configuration, rules management, all tenant visibility.
  - `COMPLIANCE_MANAGER`: Tenant profile management, analysis initiation, action assignment, review approval.
  - `ANALYST`: Run analyses, draft notes, propose operational action plans.
  - `REVIEWER`: Review analysis outputs, approve or reject compliance assessments.
  - `VIEWER`: Read-only access to tenant analyses, action plans, and regulatory feeds.
- **Tenant Isolation:** Every query on organization-specific resources (profiles, analyses, actions, audit logs) enforces tenant filtering matching the authenticated user's active membership. Cross-tenant access without explicit authorization returns HTTP `403 Forbidden` or `404 Not Found`.
