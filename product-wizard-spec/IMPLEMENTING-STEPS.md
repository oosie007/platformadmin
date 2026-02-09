# Implementing the rest of the Product Wizard steps

## Current state

- **Step 1 (Product details)** is fully implemented: form, validation, mock data, and `ProductRequest` build. Route: `/products/new/create` (or `/products/create` which redirects there).
- **Step 2 (Product overview)** is a placeholder with spec description; **Steps 3–10** are placeholders with titles and descriptions from FULL-PRODUCT-WIZARD-SPEC. The stepper and Back/Next work for all steps; only the **form content** for steps 2–10 is missing.

## Full implementation guide

**See [IMPLEMENTING-ALL-STEPS-GUIDE.md](./IMPLEMENTING-ALL-STEPS-GUIDE.md)** for:

- The **shared pattern** (react-hook-form, zod, shadcn, mocks) used in Step 1 and to follow for every step.
- **Per-step instructions** for Steps 2–10: fields, validation, types, UI, and where to plug in APIs.
- **Suggested order** of implementation (e.g. Overview → Premium allocation → Availability → …).
- A **checklist** per step (types, schema, component, mocks, wiring, API placeholder).

## Quick reference: route → component

In `src/app/products/[id]/[[...step]]/page.tsx` you map `effectiveSegment` to a component:

| Route segment | Step | Component to implement |
|---------------|------|-------------------------|
| `create` | 1. Product details | ✅ `ProductDetailsForm` |
| `update` | 2. Product overview | `ProductOverviewForm` (or similar) |
| `availability` | 3. Create availability | `AvailabilityForm` (list + create form) |
| `policyconfiguration` | 4. Policy configuration | `PolicyConfigurationForm` |
| `stateconfiguration` | 5. State configuration | `StateConfigurationForm` |
| `coveragevariant` | 6a. Coverage variant details | `CoverageVariantDetailsForm` |
| `coveragevariant/insuredType` | 6b. Insured type | `InsuredTypeForm` |
| `coveragevariant/coverageFactors` | 6c. Coverage factors | `CoverageFactorsForm` |
| … (other coveragevariant sub-routes) | 6d–6g | Respective form components |
| `product-attributes` | 7. Product attributes | `ProductAttributesForm` |
| `ratingfactor` | 8. Ratings | `RatingFactorForm` |
| `premium-allocation` | 9. Premium allocation | `PremiumAllocationForm` |
| `documents` | 10. Documents | `DocumentsForm` |

## Stepper display

The stepper is scrollable (max height so all steps are visible) and step labels wrap. No change needed for implementing new steps.

## Reference material

- **Spec:** [FULL-PRODUCT-WIZARD-SPEC.md](./FULL-PRODUCT-WIZARD-SPEC.md) – routes, purpose, UI, config keys, types per step.
- **Canvas reference:** `product-wizard-spec/canvas wizard spec reference/` – Angular components and types to mirror (availability, policy-configuration, state-configuration, coverageVariant, product-attributes, rating-factor, premium-allocation, documents-v2).
- **Step 1 example:** `src/components/product-details-form.tsx` and `src/lib/product-wizard-mocks.ts`.
