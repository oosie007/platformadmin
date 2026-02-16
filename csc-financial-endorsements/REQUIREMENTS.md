# CSC Financial Endorsements – Detailed Requirements

## Purpose

Financial Endorsements in CSC (Customer Service Center) allow agents to apply policy changes (e.g. add/remove insureds or insured objects, change coverage levels) and then submit them as an endorsement. The Summary step shows a premium/quote preview and collects endorsement reason, correspondence preference, and notes before calling the endorsement API.

## User flow

1. **Policy details** – User opens a policy (by region and policy id). They can view/edit basic info, coverages, insured maintenance (individuals/objects), rating factors, etc. All edits are accumulated in an in-memory (and optionally cached) “endorsement state” (`EndorseState`).
2. **Review Changes** – User clicks “Review Changes” (or equivalent). They are navigated to the Summary route (`/:region/policy/:id/summary`).
3. **Summary page** – On load, the app calls the endorsement API with **preview** (`isPreview=true`) and the current endorsement request. The response is used to show:
   - Effective date, application date
   - Current (active) premium vs new (endorsement) premium, next bill, adjustment
   - A list of “what changed” (from `EndorseState.meta`: e.g. “Insured object X added”, “Insured Y deleted”, “Coverage level Z changed to …”).
4. **Form** – User must complete:
   - **Endorsement reason** (required) – dropdown, options from reference data category `ENDORSEREASON`.
   - **Correspondence** (required) – dropdown: Default, Suppress all correspondence, Force print only.
   - **Notes** (optional) – free text.
5. **Save** – On submit:
   - The current endorsement request is taken from state.
   - Form values are applied: `endorsementReason`, `description` (notes), `configuration` and `sendCorrespondence` derived from the correspondence choice.
   - API is called with **submit** (`isPreview=false`).
   - On success: show “Policy Endorsement Success!”, clear any local cache for this policy, navigate back (e.g. `location.back()`).
   - On error: show the first error message from the API response (`errors[firstKey][0]`).

## Form behaviour and validation

- **Endorsement reason:** Required. Options loaded from reference-data API (category `ENDORSEREASON`). Display can use `description`; backend may expect code or description (current Canvas implementation uses description and strips optional prefix with `.split(':').pop()?.trim()`).
- **Correspondence:** Required. Exactly three options:
  - Default
  - Suppress all correspondence
  - Force print only
- **Notes:** Optional. Stored in request as `description` (and optionally `note`).
- Validation: both dropdowns required; notes optional. Submit is disabled until form is valid (both required fields filled).

## Correspondence → request mapping

| Selection | configuration | sendCorrespondence |
|-----------|---------------|---------------------|
| Default | `{ documentForcePrint: false, documentSuppress: false }` | true |
| Suppress all correspondence | `{ documentForcePrint: false, documentSuppress: true }` | false |
| Force print only | `{ documentForcePrint: true, documentSuppress: false }` | false |

## Error handling

- **Preview or submit API error:** Response body may be `{ errors: { [key: string]: string[] } }`. Show the first error message (e.g. first key’s first element). Use a toast or inline message; do not navigate away on error.
- **Reference data (ENDORSEREASON) load failure:** Show a generic “Unable to fetch reference data” (or similar) and leave endorsement reason dropdown empty/disabled until retry.
- **Policy not found / invalid:** Handled at policy load or guard level; Summary assumes policy and endorsement state are already loaded.

## State and dependencies

- **EndorseState** holds:
  - `data: EndorseRequest[]` – at least one request (e.g. `data[0]`) used for preview and submit.
  - `changesAvailable: boolean`
  - `meta: EndorseMetaInfo` – used to build the “summary of changes” list (insured/object/coverage level add/delete/edit).
- Summary page needs:
  - Current policy (e.g. for display and breadcrumbs).
  - Current endorsement request from `EndorseState.data[0]`.
  - Reference data for endorsement reasons (category `ENDORSEREASON`).

## Out of scope for this spec

- Exact policy-detail UI (tabs, sections, insured maintenance screens). Only the Summary form and endorsement API are specified here.
- Authentication, region resolution, and policy loading; the new project should reuse or reimplement those as needed.
