# Legal Document RAG Integration Specification

## 1. Overview

While the **Regulatory Crawler** provides immediate diffs for new circulars, corporate impact analyses frequently require historical statutory context (e.g. cross-referencing *Luật Hải quan số 54/2014/QH13* or *Nghị định 08/2015/NĐ-CP* to assess sanctions or statutory exemptions).

ImpactLens integrates with an external **Legal Document RAG Assistant** through a resilient adapter pattern:
- **Adapter Interface:** `LegalEvidenceProvider`
- **Implementations:**
  - `ExternalRagEvidenceProvider` (calls external Legal RAG REST API)
  - `MockLegalEvidenceProvider` (deterministic zero-cost mock for local development and CI)

---

## 2. Environment Configuration

```bash
# Optional External Legal RAG Endpoint
LEGAL_RAG_API_URL=http://localhost:8000/api/v1/rag
LEGAL_RAG_API_KEY=rag_sec_live_example_key
LEGAL_RAG_TIMEOUT_MS=5000
```

> **Security Guardrail:**
> `LEGAL_RAG_API_KEY` is strictly managed server-side in `apps/api`. It is **never** sent to the client browser or exposed via public GraphQL/REST payloads.

---

## 3. Query Contract: `POST /rag/query`

### 3.1 Request Payload
```json
{
  "query": "Thủ tục nộp bổ sung chứng từ đối với doanh nghiệp có vốn đầu tư nước ngoài gia công xuất khẩu",
  "documentFilters": {
    "documentNumbers": ["39/2026/TT-BTC", "08/2015/NĐ-CP", "54/2014/QH13"],
    "jurisdiction": "VIETNAM",
    "effectiveOnly": true
  },
  "topK": 3,
  "minRelevanceScore": 0.75
}
```

### 3.2 Response Payload
```json
{
  "passages": [
    {
      "citationId": "EV-RAG-101",
      "documentTitle": "Luật Hải quan số 54/2014/QH13",
      "documentNumber": "54/2014/QH13",
      "hierarchyPath": "Chương II > Mục 1 > Điều 29",
      "article": "Điều 29",
      "clause": "Khoản 2",
      "textExcerpt": "Người khai hải quan có trách nhiệm khai đầy đủ, chính xác, trung thực các tiêu chí thông tin trên tờ khai hải quan và nộp, xuất trình chứng từ thuộc hồ sơ hải quan theo quy định.",
      "relevanceScore": 0.91,
      "sourceUrl": "https://thuvienphapluat.vn/van-ban/Xuat-nhap-khau/Luat-Hai-quan-2014-238478.aspx"
    }
  ]
}
```

---

## 4. Resilience & Graceful Degradation Strategy

ImpactLens is engineered to operate autonomously even when the external Legal RAG system is offline or degraded:

```
                      +------------------------------------+
                      |    Initiate Evidence Retrieval     |
                      +------------------------------------+
                                         |
                                         v
                         [Is External RAG Available?]
                                 /          \
                          YES   /            \  NO / TIMEOUT
                               v              v
               +----------------------+  +--------------------------------+
               |  Fetch RAG Passages  |  |  Log Warning: RAG Unavailable  |
               +----------------------+  +--------------------------------+
                               |                         |
                               v                         v
               +----------------------------------------------------------+
               |  Check Ingested Regulatory Change Evidences              |
               |  - Are circular excerpts sufficient for applicability?   |
               +----------------------------------------------------------+
                                         |
                      +------------------+------------------+
                      |                                     |
               [Sufficient]                           [Insufficient]
                      |                                     |
                      v                                     v
         +-------------------------+           +--------------------------+
         | Proceed with Analysis   |           | Yield Status:            |
         | Note: "RAG unconsulted" |           | REQUIRES_HUMAN_REVIEW    |
         +-------------------------+           +--------------------------+
```

### Safety Principles
1. **Never Invent Legal Facts:** If RAG is unavailable and local evidence is insufficient, ImpactLens marks the assessment as `INSUFFICIENT_EVIDENCE` or `REQUIRES_HUMAN_REVIEW`. It **never** hallucinates a statutory provision to bridge the gap.
2. **Deterministic Timeouts:** HTTP requests to the external RAG system are capped at `LEGAL_RAG_TIMEOUT_MS` (default 5000ms) with zero blocking of critical transaction paths.
3. **Health Check Visibility:** `GET /api/readiness` reports Legal RAG status as `HEALTHY`, `DEGRADED`, or `DISABLED` without failing the overall platform readiness.
