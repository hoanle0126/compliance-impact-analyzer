# Regulatory Crawler (RegTracker) Integration Specification

## 1. Overview

The **Regulatory Crawler & Version Tracking System (RegTracker)** monitors official legal portals (such as the National Legal Gazette *Công Báo*, Vietnam Customs Portal, and Ministry of Finance). When an amendment, circular, or decree is promulgated, RegTracker synthesizes a structured legal `ChangeSet` and dispatches it via webhook to **Compliance Impact Analyzer (ImpactLens)**.

ImpactLens exposes a dedicated integration endpoint:
```
POST /api/integrations/regulatory-change
```

---

## 2. Webhook Authentication & Integrity (HMAC SHA-256)

To prevent spoofed regulatory alerts, the webhook endpoint supports cryptographic signature verification using HMAC SHA-256:
- **Header:** `X-RegTracker-Signature`
- **Secret Key:** Loaded from `REGTRACKER_WEBHOOK_SECRET`
- **Signature Computation:**
  $$\text{HexDigest}\left(\text{HMAC-SHA256}\left(\text{secret}, \; \text{rawRequestBody}\right)\right)$$

If `REGTRACKER_WEBHOOK_SECRET` is configured in `.env`, any incoming webhook with a missing or mismatched signature is rejected with HTTP `401 Unauthorized`.

---

## 3. Webhook Payload Schema

### Event: `document.changed`
```json
{
  "event": "document.changed",
  "eventId": "evt_reg_20261005_001",
  "timestamp": "2026-10-05T08:30:00Z",
  "document": {
    "title": "Thông tư sửa đổi, bổ sung quy định về hồ sơ hải quan và quản lý chứng từ hàng hóa xuất nhập khẩu",
    "documentNumber": "39/2026/TT-BTC",
    "documentType": "CIRCULAR",
    "issuingAuthority": "Bộ Tài chính",
    "sourceUrl": "https://customs.gov.vn/legal/39-2026-tt-btc",
    "enactedAt": "2026-10-01T00:00:00Z",
    "effectiveAt": "2026-11-15T00:00:00Z"
  },
  "previousVersion": {
    "versionNumber": "2018.1",
    "effectiveAt": "2018-04-20T00:00:00Z"
  },
  "newVersion": {
    "versionNumber": "2026.1",
    "effectiveAt": "2026-11-15T00:00:00Z"
  },
  "changes": [
    {
      "changeType": "MODIFIED",
      "hierarchyPath": "Chương II > Điều 8 > Khoản 1",
      "article": "Điều 8",
      "clause": "Khoản 1",
      "oldContent": "Doanh nghiệp nhập khẩu nộp tài liệu A khi thực hiện thủ tục hải quan.",
      "newContent": "Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B khi thực hiện thủ tục hải quan."
    },
    {
      "changeType": "MODIFIED",
      "hierarchyPath": "Chương II > Điều 8 > Khoản 2",
      "article": "Điều 8",
      "clause": "Khoản 2",
      "oldContent": "Hồ sơ được lưu trong thời hạn 2 năm.",
      "newContent": "Hồ sơ được lưu trong thời hạn 5 năm."
    },
    {
      "changeType": "ADDED",
      "hierarchyPath": "Chương II > Điều 8 > Khoản 3",
      "article": "Điều 8",
      "clause": "Khoản 3",
      "oldContent": null,
      "newContent": "Tài liệu phải được lưu dưới dạng điện tử."
    }
  ],
  "evidences": [
    {
      "documentNumber": "39/2026/TT-BTC",
      "documentTitle": "Thông tư sửa đổi quy định hồ sơ hải quan",
      "sourceUrl": "https://customs.gov.vn/legal/39-2026-tt-btc",
      "hierarchyPath": "Chương II > Điều 8",
      "article": "Điều 8",
      "textExcerpt": "Điều 8. 1. Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B... 2. Hồ sơ lưu trong 5 năm... 3. Lưu dưới dạng điện tử.",
      "retrievalSource": "REGULATORY_CHANGE",
      "verified": true
    }
  ]
}
```

---

## 4. Processing Pipeline in ImpactLens

Upon receiving the payload, ImpactLens executes the following sequence inside a transactional boundary:

1. **Idempotency Check:** Checks if `eventId` or `(documentNumber, newVersion.versionNumber)` was previously received. If already present, returns the existing record without duplicate processing.
2. **Persistence:**
   - Creates or updates `RegulatoryChange`
   - Creates `RegulatoryChangeItem` records for each clause diff
   - Automatically tags detected topics (`CUSTOMS_PROCEDURE`, `DOCUMENT_REQUIREMENT`, `RECORD_RETENTION`, `DATA_REQUIREMENT`)
   - Links authoritative `LegalEvidence` items
3. **Automated Impact Scheduling:**
   - Queries all active client organizations.
   - Evaluates fast topic filtering.
   - Enqueues BullMQ background analysis jobs for applicable entities (e.g. registered importers for customs changes).

---

## 5. Webhook Response Format

### Success Response (HTTP 201 Created)
```json
{
  "success": true,
  "regulatoryChangeId": "reg_39_2026_tt_btc",
  "documentNumber": "39/2026/TT-BTC",
  "enqueuedAnalysesCount": 3,
  "message": "Regulatory change ingested successfully and impact evaluations enqueued."
}
```
