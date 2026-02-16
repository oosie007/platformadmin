# CSC Financial Endorsements – Summary Form Spec

## Form purpose

The Summary (Review Changes) page shows the endorsement preview and collects three inputs before submitting the endorsement: **Endorsement reason**, **Correspondence**, and **Notes**. These are applied to the existing endorsement request and sent with `PATCH .../endorsements?isPreview=false`.

## Form fields

| Form control     | Label              | Type     | Required | Placeholder / options |
|------------------|--------------------|----------|----------|------------------------|
| endorseReason    | Endorsement reason | dropdown | Yes      | "Select the reason"    |
| correspondence   | Correspondence     | dropdown | Yes      | "Select the reason"    |
| notes            | Notes              | text     | No       | "Write a note"         |

## Validation

- **endorseReason:** Required. Error message: e.g. "Reason is Required."
- **correspondence:** Required. Error message: e.g. "Correspondence is Required."
- **notes:** Optional; no validation.

Submit button should be disabled until both required fields are valid.

## Reference data – Endorsement reason

- **Category:** `ENDORSEREASON`
- **API:** Same base URL as other CSC reference data; e.g. `GET {baseUrl}/reference-data/ENDORSEREASON` with query params `requestId`, `country`, `language`, and header `X-Canvas-Module: CSC`.
- **Response:** List of items with at least `description` and `code`. Dropdown options can be built as `{ label: item.description, value: item.description }` (or use `code` if the backend expects it). Current Canvas uses `description` and, when saving, may strip a prefix with `.split(':').pop()?.trim()`.

## Correspondence options (static)

Not from reference data; fixed list:

| Label                         | Value (for form)           |
|------------------------------|----------------------------|
| Default                      | default                    |
| Suppress all correspondence  | Suppress all correspondence |
| Force print only             | Force print only           |

Optional tooltip for Correspondence (from Canvas config):

- **Default** – Triggers matching fulfilment rules as configured.
- **Suppress all correspondence** – Overrides rules; no documents or fulfillment generated.
- **Force print only** – Triggers rules but switches channel to "print"; documents go to print queue without emailing the customer.

## Mapping form → EndorseRequest (on Save)

1. **endorsementReason**  
   - Assign to `endorseReq.endorsementReason`.  
   - If the display value includes a prefix (e.g. "CODE: Description"), you may take the part after the last colon: `value.split(':').pop()?.trim()`.

2. **notes**  
   - Assign to `endorseReq.description`.  
   - Optionally also set `endorseReq.note` if your backend uses it.

3. **correspondence**  
   - Map to `configuration` and `sendCorrespondence`:

| Form value (after trim / split)   | configuration | sendCorrespondence |
|------------------------------------|---------------|---------------------|
| Suppress all correspondence        | `{ documentForcePrint: false, documentSuppress: true }` | false |
| Force print only                   | `{ documentForcePrint: true, documentSuppress: false }` | false |
| default (or any other)             | `{ documentForcePrint: false, documentSuppress: false }` | true  |

## Config-driven form (reactiveFormConfig)

The Canvas app drives the Summary form from `pages.cscSummary.context.reactiveFormConfig`. The structure is in [csc-summary-form-config.json](./csc-summary-form-config.json). Each item has:

- `control` – form control name
- `label` – display label
- `type` – `dropdown` or `text`
- `required` – boolean
- `disabled` – boolean
- `placeholder` – string
- `errorMessage` – optional (for required validation)
- `tooltip` – optional (e.g. for Correspondence)

Your new app can consume this JSON to build the form (e.g. reactive form or any form library) so that adding/editing fields only requires config changes.
