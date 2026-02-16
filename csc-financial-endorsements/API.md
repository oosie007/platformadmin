# CSC Financial Endorsements – API

## Endpoint

- **URL:** `PATCH {policyApiBaseUrl}/policy/endorsements?isPreview={true|false}[&saveQuote=true]`
- **Method:** `PATCH`
- **Query:**
  - `isPreview` (required): `true` for quote/preview only; `false` to apply the endorsement.
  - `saveQuote` (optional, for preview): `true` when `isPreview=true` to save the quote and get `endorsementQuoteId` for submit.
- **Headers:** Same as other policy API calls: `Authorization: Bearer ...`, `apiversion: 2` (or env-configured), and optional `Ocp-Apim-Subscription-Key`.

**Base URL:** Use the same base as the policy API (e.g. **URL2** in the Monzo UAT Postman collection: `SIT_EMEA_API_BASE_URL` / `UAT_EMEA_API_BASE_URL`). Full path is `{base}/policy/endorsements`. Optional override: `SIT_EMEA_ENDORSEMENT_API_BASE_URL` / `UAT_EMEA_ENDORSEMENT_API_BASE_URL` if the endorsement API is hosted elsewhere.

## Headers

- `X-Canvas-Module: CSC` (required)
- Usual auth (e.g. `Authorization: Bearer ...`) as in the rest of the app.

## Body

Single JSON object: **EndorseRequest**. See [types.ts](./types.ts) for the full shape. Key fields:

- **Identifiers:** `policyNumber`, `effectiveDate`, `applicationDate`, `language`, `countryCode`
- **Optional:** `requestId`, `endorsementQuoteId`, `impersonateId`, `province`, `zipCode`
- **Changes:** `people`, `insured`, `insuredObjects`, `plan`, `rating`, `customAttributes`, `domainAttributes`, etc., as built from the policy-detail edits.
- **Set on submit from Summary form:**
  - `endorsementReason` – string (from endorsement reason dropdown).
  - `description` – string (notes field).
  - `configuration` – `{ documentForcePrint?: boolean; documentSuppress?: boolean }` (see FORM-SPEC).
  - `sendCorrespondence` – boolean.

## Preview vs submit

| Usage | isPreview | Effect |
|-------|-----------|--------|
| Summary page load | `true` | Returns endorsement quote; premium comparison (active vs endorsement vs next bill); no policy change. |
| Save / Submit | `false` | Applies the endorsement; policy is updated. |

Same request body shape for both; only the query parameter and intent differ.

## Response (success)

**EndorseResponse** – see [types.ts](./types.ts). Main fields:

- `policyNumber`, `effectiveDate`, `applicationDate`, `status`, `currency`
- `premiums`: `active`, `endorsement`, `adjustment`, `nextBill` (each with premium, tax, commission, totalPremium, paymentFrequency, etc.)
- `insureds`, `insuredObjects` (with coverages and attributes as applicable)

## Error response

- **HTTP 4xx/5xx** with body shape:
  ```json
  {
    "errors": {
      "SOME_CODE": ["Human-readable error message."]
    }
  }
  ```
- Client should display the first error message (e.g. first key’s first element). Example: `const firstKey = Object.keys(errors)[0]; const message = errors[firstKey][0];`

## Example (minimal submit body)

```json
{
  "policyNumber": "XBUCHCA00017371",
  "effectiveDate": "2024-10-21",
  "applicationDate": "2024-10-21",
  "language": "en",
  "countryCode": "CH",
  "endorsementReason": "Post-Conversion Policy Update",
  "description": "Customer requested update",
  "configuration": { "documentForcePrint": false, "documentSuppress": false },
  "sendCorrespondence": true
}
```

For preview or full submit, the body will typically include `insured`, `insuredObjects`, or other change payloads built from the policy UI.
