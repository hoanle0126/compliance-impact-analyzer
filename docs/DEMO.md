# ImpactLens Portfolio Demonstration Script (3–5 Minutes)

## Presentation Objective
Demonstrate how **ImpactLens** acts as an enterprise compliance decision-support system that processes Vietnamese customs circular updates against structured company profile facts, produces deterministic applicability evaluations, maps multi-departmental operational disruptions, and enforces human-in-the-loop governance—all with zero legal hallucination.

---

## Pre-requisites & Local Environment
- **Web UI:** `http://localhost:3201`
- **REST API & Swagger:** `http://localhost:4201/api/docs`
- **Sample Persona Accounts:**
  - `analyst@impactlens.local` / `Password123!` (Analyst role)
  - `reviewer@impactlens.local` / `Password123!` (Reviewer role)
  - `admin@impactlens.local` / `Password123!` (System Admin)

---

## 1. Executive Dashboard (0:00 – 0:45)
1. **Navigate to:** `http://localhost:3201/`
2. **Key Talking Points:**
   - *"Notice the top KPIs: Active Circulars under monitoring, High-Priority Impacts, Pending Review Sign-offs, and Open Action Items."*
   - *"The system status banner shows our offline deterministic Mock AI mode is active—ensuring 100% test reproducibility with zero external API dependencies or token costs."*
   - *"Notice the Role Switcher in the top navigation header: we can seamlessly demonstrate workflow transitions between Senior Analyst and Compliance Officer."*

---

## 2. Regulatory Change Inspection & Legal Diff (0:45 – 1:30)
1. **Click:** **Regulatory Changes** on the sidebar (`/regulatory-changes`).
2. **Click:** **Inspect Provisions** for *Thông tư 39/2026/TT-BTC* (`/regulatory-changes/:id`).
3. **Key Talking Points:**
   - *"Here is the enacted circular from the Ministry of Finance amending customs dossier regulations."*
   - *"Notice the side-by-side legal clause diff for Điều 8:"*
     - **Khoản 1 (Documentation):** Old law required Document A; new law mandates Document A + Document B.
     - **Khoản 2 (Record Retention):** Archive retention period extended from 2 years to 5 years.
     - **Khoản 3 (IT & Digitalization):** Enacts a new mandatory requirement for electronic document storage.
   - *"Below the diff, notice the Authoritative Legal Citations ([EV-001]) extracted from the official gazette."*

---

## 3. Flagship Scenario: Positive Match on "Demo Import Manufacturing Co." (1:30 – 2:45)
1. **Click:** **Impact Analyses** on sidebar (`/analyses`).
2. **Click:** **Run Impact Analysis** button.
3. **In the Modal:**
   - Target Enterprise: Select `DEMO IMPORT MANUFACTURING CO. (FDI_ENTERPRISE)`.
   - Regulatory Document: Select `Thông tư 39/2026/TT-BTC`.
   - Click **Run Analysis Now**.
4. **On the Analysis Report Screen (`/analyses/:id`):**
   - **Badge:** `POTENTIALLY_APPLIES` (Confidence: `HIGH`).
   - **Impact Priority Score:** `75/100` (Severity: `MEDIUM`, Urgency: `MEDIUM`).
   - **Walk through the 5-Pillar Framework:**
     - **1. WHAT:** Clear summary of the 3 legal changes enacted in Điều 8.
     - **2. WHO:** Explains which enterprise categories are captured (Importers of raw materials, FDI manufacturing).
     - **3. WHY:** Displays the exact deterministic applicability rules triggered (`RULE_IMPORTER_DOC_REQ`, `businessActivities CONTAINS IMPORT`).
     - **4. SO WHAT:** Shows affected departments (`CUSTOMS`, `DOCUMENTATION`, `RECORD_RETENTION`, `IT_DATA`) and statutory obligations.
     - **5. NOW WHAT:** Action plan assigning operational tasks to `CUSTOMS_MANAGER` and `IT_INFRASTRUCTURE`.
5. **Click Legal Citation `[EV-001]`:**
   - Opens the **Evidence Drawer**.
   - Displays official document number, hierarchy path (`Chương II > Điều 8`), exact statutory excerpt, and gazette source URL.
   - *"The LLM is strictly constrained to this evidence; it cannot fabricate external articles."*

---

## 4. Human-in-the-Loop Review & Sign-Off (2:45 – 3:30)
1. **Switch Role:** Click **Reviewer** in the top header.
2. **Click:** **Approve Assessment** button.
3. **In the Compliance Officer Review Modal:**
   - Confirm Decision: `Approve Assessment`.
   - Rationale: *"Verified compliance findings against Circular 39 Điều 8. Actions delegated to Customs and IT teams."*
   - Click **Confirm Approval**.
4. **Result:**
   - Status badge transitions to `Workflow: APPROVED`.
   - Audit trail records reviewer identity, timestamp, and comments in `/audit`.

---

## 5. Negative Match Scenario: "Demo Local Service Co." (3:30 – 4:15)
1. **Click:** **Impact Analyses** $\to$ **Run Impact Analysis**.
2. **Target Enterprise:** Select `DEMO LOCAL SERVICE CO. (DOMESTIC_ENTERPRISE)`.
3. **Click:** **Run Analysis Now**.
4. **Key Talking Points:**
   - **Status:** `DOES_NOT_APPLY`.
   - **Priority Score:** `0/100`.
   - **Explanation:** *"Organization activities are limited to domestic consulting. No import declarations, customs dossiers, or cross-border logistics are conducted."*
   - *"This proves the system is not a naive keyword matcher—it evaluates verified operational profile facts to protect organizations from compliance alert fatigue."*

---

## 6. Incomplete Profile Scenario: "Demo Unknown Trading Co." (4:15 – 5:00)
1. **Click:** **Impact Analyses** $\to$ **Run Impact Analysis**.
2. **Target Enterprise:** Select `DEMO UNKNOWN TRADING CO.`.
3. **Click:** **Run Analysis Now**.
4. **Key Talking Points:**
   - **Status:** `INSUFFICIENT_INFORMATION`.
   - **Missing Information Alert:** Specifically flags: *"Whether the organization performs import activities."*
   - *"Critical Legal Safety Principle: When data is missing, ImpactLens refuses to guess or assume. It transparently requests human verification before asserting legal liability."*
