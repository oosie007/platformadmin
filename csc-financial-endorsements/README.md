# CSC Financial Endorsements – Spec Package

This folder contains the requirements, API contract, form spec, and types for **CSC Financial Endorsements**: the flow that lets users make policy changes (insureds, objects, coverages, etc.) and then submit them via an endorsement API after filling a short form (reason, correspondence, notes).

## Flow (high level)

1. **Policy** – User views/edits a policy (e.g. `/:region/policy/:id`).
2. **Changes** – User makes changes (add/remove/edit insureds, insured objects, coverage levels, etc.). State is held in an “endorsement base” (e.g. `EndorseState`).
3. **Review Changes** – User navigates to the Summary step (`/:region/policy/:id/summary`).
4. **Summary form** – User sees a preview (from endorsement API with `isPreview=true`) and fills:
   - **Endorsement reason** (required, from reference data `ENDORSEREASON`)
   - **Correspondence** (required: Default / Suppress all / Force print only)
   - **Notes** (optional)
5. **Submit** – On Save, the app calls the same endorsement API with `isPreview=false` and the form values applied to the request. On success, show success message and navigate back.

## Files in this folder

| File | Purpose |
|------|--------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Detailed requirements, form behaviour, validation, errors. |
| [API.md](./API.md) | Endpoint, method, headers, request/response, preview vs submit, errors. |
| [FORM-SPEC.md](./FORM-SPEC.md) | Form fields, validation, reference data, correspondence → `configuration` mapping. |
| [types.ts](./types.ts) | TypeScript types for `EndorseRequest`, `EndorseResponse`, and related structures. |
| [csc-summary-form-config.json](./csc-summary-form-config.json) | `reactiveFormConfig` for the Summary form (endorseReason, correspondence, notes). |
| [constants.ts](./constants.ts) | Labels and summary strings used on the Summary page. |
| [routes.txt](./routes.txt) | Route paths and which page/component they represent. |

## Source in Canvas repo

- **App:** `chubb-studio-canvas-dev/apps/customer-service`
- **Summary (form) component:** `components/summary/summary.component.ts` (and `.html`)
- **Endorsement API call:** `services/policy-details.service.ts` (`endorsePolicy`)
- **Form config in app:** `apps/canvas/src/assets/configuration.json` → `pages.cscSummary.context.reactiveFormConfig`
- **Types:** `apps/customer-service/src/app/types/customer-service-models.ts`

Use this package to reimplement the Financial Endorsements flow in another project (same or different stack).
