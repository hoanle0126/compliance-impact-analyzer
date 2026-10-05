# Deterministic Applicability Engine Specification

## 1. Core Philosophy: Why Deterministic Rules?

In legal and customs compliance, determining whether a corporate entity falls within the scope of a new statutory instrument (such as a Ministry of Finance Circular or General Department of Customs Directive) is a **high-stakes classification problem**. 

Asking an unconstrained Large Language Model (LLM) *"Does this regulation apply to this company?"* introduces significant failure modes:
1. **Unpredictability & Non-determinism:** The same input might evaluate to "Applies" on Monday and "Exempt" on Tuesday.
2. **Hallucination of Profile Attributes:** The model might assume an enterprise engages in temporary import or has a bonded warehouse when the profile contains no such fact.
3. **Black-box Reasoning:** Compliance officers cannot audit the exact decision boundary or explain to executive leadership why an alert was triggered.

ImpactLens solves this with a **Deterministic Rule Engine** running in TypeScript (`@impactlens/applicability-engine`). The engine executes deterministic rules against verified profile facts first. The LLM is only utilized downstream to synthesize natural language summaries and operational action plans within strictly bounded schemas.

---

## 2. Applicability Rule Structure

An `ApplicabilityRule` defines deterministic criteria that link regulatory topics to organization characteristics:

```typescript
export interface ApplicabilityRule {
  id: string;
  name: string;
  description: string;
  topic: ComplianceTopic;
  priority: number; // Higher numbers evaluate earlier
  enabled: boolean;
  conditions: RuleConditionGroup;
  outcomeOnMatch: ApplicabilityStatus;
  reasonTemplate: string;
}

export interface RuleConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (RuleCondition | RuleConditionGroup)[];
}

export interface RuleCondition {
  field: string;           // e.g. "businessActivities", "organizationType", "facts.USES_IMPORTED_RAW_MATERIALS"
  operator: RuleOperator;  // EQUALS, CONTAINS, IN, EXISTS, etc.
  value: any;
}
```

### Supported Operators
The rule engine implements safe evaluation without arbitrary `eval()`:
- `EQUALS` / `NOT_EQUALS`: Strict type-safe equality for primitives and booleans.
- `IN` / `NOT_IN`: Checks whether a scalar profile field is included in a target list.
- `CONTAINS`: Checks whether an array profile field (e.g. `businessActivities`) contains a specified item.
- `EXISTS` / `NOT_EXISTS`: Verifies presence or absence of a profile fact or facility type.
- `STARTS_WITH`: Prefix matching for HS commodity codes (e.g. HS Chapter `85` for electronics).
- `RANGE`: Numerical bounds evaluation for thresholds (e.g. employee count or capital tiers).

---

## 3. Evaluation Order & Rule Hierarchy

1. **Pre-Filter by Regulatory Topic:**
   Only rules tagged with compliance topics present in the regulatory change (e.g. `CUSTOMS_PROCEDURE`, `DOCUMENT_REQUIREMENT`, `RECORD_RETENTION`) are loaded.
2. **Priority Ordering:**
   Rules are sorted by priority in descending order:
   - Specific Exclusion Rules (`priority: 1000`) $\to$ `DOES_NOT_APPLY`
   - Explicit Statutory Inclusions (`priority: 800`) $\to$ `APPLIES`
   - Conditional Topic Matches (`priority: 500`) $\to$ `POTENTIALLY_APPLIES`
   - Missing Required Field Handlers (`priority: 100`) $\to$ `INSUFFICIENT_INFORMATION`
3. **Compound Logical Aggregation:**
   - Any rule concluding `DOES_NOT_APPLY` with high certainty immediately registers a negative match factor.
   - If positive rules match, the overall status becomes `APPLIES` or `POTENTIALLY_APPLIES`.
   - If required fields for evaluation are missing from the profile, the engine immediately yields `INSUFFICIENT_INFORMATION`.

---

## 4. Evaluation Outcomes

| Status | Meaning | Action Taken |
| :--- | :--- | :--- |
| `APPLIES` | Profile verified to match all statutory conditions without ambiguity. | Automatically creates impact assessment and high-priority action items. |
| `POTENTIALLY_APPLIES` | Profile activities align with regulatory scope; applicability depends on specific transactional or commodity details. | Flags for operational review and impact quantification. |
| `DOES_NOT_APPLY` | Organization operations, jurisdictions, or business model are strictly excluded. | Generates negative clearance report; no operational disruption. |
| `INSUFFICIENT_INFORMATION` | Profile lacks required facts (e.g. import status or HS codes unknown). | Identifies exact missing questions; requests profile enrichment before concluding. |
| `REQUIRES_REVIEW` | Borderline regulatory interpretation requiring qualified legal specialist advice. | Queued in Compliance Officer Review Queue. |

---

## 5. Profile Fact Matching & Confidence Provenance

Profile facts are strongly typed assertions stored in the `ProfileFact` table:
- `factType`: e.g. `USES_IMPORTED_RAW_MATERIALS`, `OPERATES_BONDED_WAREHOUSE`, `IS_FDI_MANUFACTURING`.
- `valueJson`: Structured boolean, string, or JSON payload (`true`, `"HIGH"`, `["8542.31", "8542.32"]`).
- `source`: `USER_PROVIDED` (verified by client), `IMPORTED` (ERP/Customs feed), `DERIVED` (inferred from prior declarations), `UNKNOWN`.
- `confidence`: `VERIFIED`, `PROVISIONAL`, `INFERRED`, `UNCONFIRMED`.

The engine prioritizes `VERIFIED` facts. If a rule relies on an `INFERRED` or `PROVISIONAL` fact, the engine downgrades the overall assessment confidence score from `HIGH` to `MEDIUM` or `LOW` and adds an explicit assumption to the assessment report.

---

## 6. Transparent Explainability Framework

Every evaluation yields a human-readable and machine-traceable explanation:

```json
{
  "status": "POTENTIALLY_APPLIES",
  "confidence": "HIGH",
  "matchedRules": [
    {
      "ruleId": "RULE_IMPORTER_DOC_REQ",
      "ruleName": "Importer Document Requirement Rule",
      "matchedReason": "Organization business activities [IMPORT, MANUFACTURING, EXPORT] contains required activity IMPORT, and organization type FDI_ENTERPRISE matches."
    }
  ],
  "reasoningFactors": [
    "Company is an active registered importer of record in Vietnam.",
    "Target circular amends customs declaration dossier requirements (Điều 8 Khoản 1).",
    "FDI manufacturing operations utilize imported raw materials."
  ],
  "missingInformation": [],
  "decisionTrace": [
    "Step 1: Extracted regulatory topics: [CUSTOMS_PROCEDURE, DOCUMENT_REQUIREMENT, RECORD_RETENTION].",
    "Step 2: Evaluated Rule RULE_IMPORTER_DOC_REQ: Condition 'businessActivities CONTAINS IMPORT' returned TRUE.",
    "Step 3: Condition 'customsProfile.isImporter EQUALS true' returned TRUE.",
    "Step 4: Concluded status POTENTIALLY_APPLIES with HIGH confidence."
  ]
}
```
In the frontend UI, this powers the **3. WHY (Applicability Factors & Rules)** section of the flagship 5-Pillar report.
