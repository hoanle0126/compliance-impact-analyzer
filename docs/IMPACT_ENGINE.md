# Impact Engine & Prioritization Specification

## 1. Overview

The **Impact Engine** (`@impactlens/impact-engine`) is responsible for translating verified legal modifications into concrete, actionable enterprise impacts. 

Once the **Applicability Engine** confirms that a regulatory amendment applies (or potentially applies) to an organization, the Impact Engine analyzes four key questions:
1. **Which operational functions and departments are disrupted?**
2. **How severe is the exposure?** (Financial penalties, cargo seizure, shipment delays, license revocation)
3. **What specific statutory obligations are created, amended, or repealed?**
4. **What exact operational tasks must be executed, by whom, and by what deadline?**

---

## 2. Operational Impact Dimensions

Compliance impacts are classified across 8 standardized corporate dimensions:

| Dimension | Description | Typical Vietnamese Customs Trigger |
| :--- | :--- | :--- |
| `CUSTOMS` | Physical customs declaration, clearance channels (Luồng Xanh/Vàng/Đỏ), HS classification, customs valuation. | Additional documentation required at border gate; revised declaration forms. |
| `DOCUMENTATION` | Paperwork, certificates of origin (C/O), commercial invoices, permits, contracts. | New mandatory document attached to dossier (e.g. Circular 39 Điều 8 Khoản 1). |
| `RECORD_RETENTION` | Statutory duration and format for archiving customs documents, inspection books, and liquidation records. | Extension of mandatory archive period from 2 to 5 years (Điều 8 Khoản 2). |
| `IT_DATA` | Digital customs platforms (VNACCS/VCIS), electronic signature, electronic document storage, EDI data formats. | Mandating electronic archive format and digitized customs dossiers (Điều 8 Khoản 3). |
| `FINANCE` | Import/export duties, value-added tax (VAT), special consumption tax, customs broker fees. | Changes in duty calculation methods or payment deadlines. |
| `SUPPLY_CHAIN` | Logistics lead times, freight forwarder coordination, shipping routes, carrier notifications. | Delays in border clearance due to physical document inspection. |
| `OPERATIONS` | Warehouse operations, inventory reconciliation, factory production scrap reporting. | Liquidation reporting for processing and manufacturing-for-export enterprises. |
| `LEGAL` | Legal liability, administrative penalty exposure, contract revisions with overseas suppliers. | Non-compliance penalty under Decree 128/2020/NĐ-CP on customs infractions. |

---

## 3. Severity Scoring Model

Severity is evaluated deterministically across 5 tiers: `NONE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

```typescript
export enum ImpactSeverity {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
```

### Deterministic Severity Criteria
The engine calculates severity by aggregating four weighted risk factors:
1. **Legal Obligation Level (Weight: 35%):**
   - Mandatory statutory duty (e.g. "Doanh nghiệp phải nộp...") $\to$ Score: 85-100
   - Procedural option or conditional requirement $\to$ Score: 50-70
   - Informational notice $\to$ Score: 10-30
2. **Penalty & Sanction Exposure (Weight: 30%):**
   - Infraction risks customs clearance suspension or administrative fines under Decree 128/2020/NĐ-CP $\to$ Score: 90-100
   - Minor procedural defect $\to$ Score: 20-40
3. **Operational Disruption Breadth (Weight: 20%):**
   - Affects core daily import declaration operations $\to$ Score: 80
   - Affects periodic annual liquidation reporting $\to$ Score: 40
4. **Proximity of Effective Date (Weight: 15%):**
   - Effective immediately or $\le 30$ days $\to$ Score: 100
   - $31 - 90$ days $\to$ Score: 60
   - $> 90$ days $\to$ Score: 30

---

## 4. Priority Formula

To avoid arbitrary "everything is high priority" syndrome, ImpactLens calculates a transparent, deterministic Priority Score on a 0–100 scale:

$$\text{Priority Score} = \min\left(100, \; \text{round}\left(\text{Severity Score} \times \text{Confidence Multiplier} \times \text{Urgency Factor} \times \text{Breadth Factor}\right)\right)$$

Where:
- **Severity Score:** Raw composite severity (0–100).
- **Confidence Multiplier:** `1.0` for `VERIFIED` facts / `HIGH` confidence, `0.75` for `MEDIUM`, `0.50` for `LOW`.
- **Urgency Factor:** Multiplier scaling from `0.8` (distant deadline) to `1.2` (urgent deadline $\le 15$ days).
- **Breadth Factor:** Ratio of affected corporate departments ($1.0 + 0.05 \times \text{number of affected areas}$).

---

## 5. Compliance Obligations & Action Plan Generation

### 5.1 Compliance Obligation Entity
An obligation represents an immutable statutory duty imposed by the law:
- `title`: Short legal obligation title (e.g. *"Submit Document B in Customs Dossier"*).
- `obligationType`: `FILE`, `REPORT`, `RETAIN_RECORDS`, `UPDATE_PROCESS`, `OBTAIN_LICENSE`, `VERIFY`.
- `responsibleDepartment`: `CUSTOMS`, `DOCUMENTATION`, `IT`, `LEGAL`, `FINANCE`.
- `effectiveFrom`: Statutory effective date of the circular.
- `evidence`: Official citation reference (e.g. `[EV-001]`).

### 5.2 Recommended Action Item Entity
Recommended actions are operational directives for internal execution:
- `title`: Concise task description.
- `action`: Specific operational guidance (e.g. *"Audit current customs declaration checklist to include Document B before 2026-11-01"*).
- `priority`: `HIGH`, `MEDIUM`, `LOW`.
- `suggestedOwner`: Department head or role owner (`CUSTOMS_MANAGER`, `IT_INFRASTRUCTURE`, `LEGAL_COUNSEL`).
- `dueDate`: Calculated operational deadline (set 10–14 days prior to statutory enforcement to allow workflow readiness).
- `status`: Interactive lifecycle (`TO_DO`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`).

---

## 6. Authoritative Evidence & LLM Output Validation

### The "Never Trust AI Citations" Boundary
The LLM is strictly prohibited from inventing evidence references.
1. The backend assembles available verified evidence items (`EV-001`, `EV-002`, `EV-003`).
2. The LLM prompt explicitly restricts citations:
   > *"You may cite ONLY the following evidence IDs: [EV-001, EV-002, EV-003]. Never cite external laws or invent citation IDs."*
3. The response is parsed with Zod schema validation.
4. If an output references an invalid ID (e.g. `EV-999`), the engine strips the reference, flags `VALIDATION_WARNING`, and alerts the human reviewer.
