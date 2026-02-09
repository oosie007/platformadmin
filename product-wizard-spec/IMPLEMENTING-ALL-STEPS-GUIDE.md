# How to Implement All Wizard Steps (Forms & Validation)

This guide shows how to implement each step of the Product Creation wizard with real forms and validation, using the same pattern as **Step 1 (Product details)**.

---

## 1. Shared pattern (copy from Step 1)

Every step should follow this stack and flow:

| Layer | What to use | Example (Step 1) |
|-------|-------------|-------------------|
| **Form state** | `react-hook-form` | `useForm<FormValues>({ resolver, defaultValues })` |
| **Validation** | `zod` + `@hookform/resolvers/zod` | `zodResolver(mySchema)` |
| **UI** | shadcn components | `Input`, `Select`, `Label`, `Textarea`, `Switch`, `Card`, `Button`, `Table` |
| **Data** | Mocks first, API later | `src/lib/product-wizard-mocks.ts`; later replace with `fetch` in a service |
| **Submit** | Build payload, call mock/API, then `onNext()` or navigate | `onSubmit` → build request → `console.log` or API → `onSaveSuccess?.(id)` / `onNext?.()` |

### Step-by-step for any new step

1. **Define types** (in `product-wizard-spec/` or `src/lib/`) for the form values and the API request body.
2. **Define a zod schema** for validation (required, max length, patterns, cross-field rules).
3. **Create a form component** (e.g. `AvailabilityForm.tsx`) that:
   - Uses `useForm` with `zodResolver(schema)` and `defaultValues`.
   - Renders fields with `register()`, `watch()`, `setValue()`, and `errors` from `formState`.
   - Has **Back** (link to `/products` or previous step), **Save** (submit), **Next** (call `onNext()`).
4. **Add mock data** (e.g. in `product-wizard-mocks.ts`) for dropdowns and lists.
5. **Wire the component** in `src/app/products/[id]/[[...step]]/page.tsx` for the right `routeSegment`.
6. **Leave a clear API hook**: e.g. `onSubmit` that builds the request and calls a `saveAvailability(productId, payload)` stub; later replace the stub with a real API call.

---

## 2. Step 2 – Product overview (update)

- **Route:** `update` → `/products/:id/update`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 2

**UI:** Form to edit product header (same fields as Step 1) plus:

- Version selector (if multiple versions)
- Lock / read-only indicator if needed
- Read-only sections: availability summary, policy config summary

**Implementation:**

- Reuse the same fields as `ProductDetailsForm` (productName, productId, description, marketingName, dates, status, productVersionId, country, premium currency, limits toggle).
- Add a **version** dropdown (mock list of versions for the product).
- Add two **read-only cards**: “Availability summary” and “Policy config summary” (placeholder text or mock list until those steps are implemented).
- **Validation:** Same as Step 1 (reuse schema or a shared one).
- **Types:** Reuse `ProductRequest.header` / `ProductHeader` from `product-create.types.ts`.
- **API placeholder:** `updateProductHeader(productId, payload)` → mock then real PATCH.

---

## 3. Step 3 – Availability

- **Route:** `availability` → `/products/:id/availability`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 3
- **Reference:** `product-wizard-spec/canvas wizard spec reference/availability/`

**UI:**

- **List view:** Table of availability records; toolbar with “Create availability” and search/filter.
- **Create view:** Form (can be same route with a query or a sub-route like `availability/create`).

**Create-availability form fields (from spec):**

- **Country** (pre-filled from product; dropdown)
- **Availability by states** (toggle)
- **States** (multi-select, when US; mock state list)
- **Blacklist zip codes** (textarea or chip input; comma/newline separated)

**Validation (zod):**

- `country`: required
- `availabilityByStates`: boolean
- `states`: array of strings (optional; required when availabilityByStates is true and country is US)
- `blacklistZipCodes`: optional array of strings (e.g. max length per code, max items)

**Types:** Define e.g. `StandardAvailability`: `{ country: string; states: string[]; locale: string; blacklistZipCodes: string[] }` (align with spec/Canvas types).

**API placeholder:** `createAvailability(productId, payload)` / `getAvailabilityList(productId)`.

---

## 4. Step 4 – Policy configuration

- **Route:** `policyconfiguration` → `/products/:id/policyconfiguration`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 4
- **Reference:** `product-wizard-spec/canvas wizard spec reference/policy-configuration/`

**UI:** Large form + table:

- **Form:** Policy type, refund type, term end (e.g. PERPETUAL), renewal type, cooling period, tax charge, commission routine, rounding types, renewal notice period, non-renewal notification date (use dropdowns from ref data; mock options).
- **Table:** Minimum premium by state/country (columns: state/country, value; editable cells or row edit).

**Validation:**

- Required dropdowns; numeric min/max for amounts and periods; table: at least one row or allow empty depending on business rules.

**Types:** From spec: policy-configuration model, CommissionRoutine, minimum-premium types. Define zod schema that matches.

**API placeholder:** `savePolicyConfiguration(productId, payload)`.

---

## 5. Step 5 – State configuration

- **Route:** `stateconfiguration` → `/products/:id/stateconfiguration`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 5
- **Reference:** `product-wizard-spec/canvas wizard spec reference/state-configuration/`

**UI:** Table of state-configuration rows:

- Columns: state, effective date, expiry date, renewal notification (and any other from spec).
- Row actions: Edit (inline or drawer), Delete.
- Only show / enable when product country is US (can hide step or show “Not applicable” for non-US).

**Validation:** Per row: valid dates, expiry > effective; required state.

**Types:** StateConfiguration, StateConfigurationLabels from spec/reference.

**API placeholder:** `getStateConfiguration(productId)`, `saveStateConfiguration(productId, rows)`.

---

## 6. Step 6 – Coverage variants (and sub-steps)

- **Routes:** `coveragevariant`, `coveragevariant/insuredType`, `coveragevariant/coverageFactors`, `coveragevariant/sub-coverage`, `coveragevariant/coverage-variant-level-overview`, `coveragevariant/exclusions`, `coveragevariant/inclusions`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 6
- **Reference:** `product-wizard-spec/canvas wizard spec reference/coverageVariant/`

**6a – Coverage variant details (`coveragevariant`)**

- **UI:** Table of coverage variants; “Create” / “Edit” opens a form/drawer.
- **Form fields:** Coverage variant ID, name, type (e.g. Core), allocation %, standard coverage codes (multi-select), description, prerequisite variants (dropdown/multi-select). Align with types in spec (CoverageVariant, CreateCoverageVariant).
- **Validation:** Required id, name, type; allocation 0–100; etc.

**6b – Insured type (`coveragevariant/insuredType`)**

- **UI:** Select insured types for the current variant (checkboxes or multi-select).
- **Validation:** At least one selected if required by business rule.

**6c – Coverage factors (`coveragevariant/coverageFactors`)**

- **UI:** Form or table: age band, gender, other factors (from spec/reference).
- **Validation:** Per factor: required/optional as per spec.

**6d – Subcoverages (`coveragevariant/sub-coverage`)**

- **UI:** Link sub-coverages (list + add/remove).
- **Validation:** As per spec.

**6e – Coverage variant levels (`coveragevariant/coverage-variant-level-overview`)**

- **UI:** Table of levels; drill to level config (can be a simple table first).
- **Validation:** Level values as per spec.

**6f – Exclusions (`coveragevariant/exclusions`)**

- **UI:** List/grid of exclusions; add/edit/delete (from reference ExclusionComponent).
- **Validation:** Required fields per exclusion.

**6g – Include fixed coverages (`coveragevariant/inclusions`)**

- **UI:** List of fixed coverage inclusions; add/edit/delete.
- **Validation:** As per spec.

**Types:** types/coverage, types/coverage-variant-level, types/exclusion (from spec/reference). Define zod schemas for each form.

**API placeholders:** e.g. `getCoverageVariants(productId)`, `saveCoverageVariant(productId, variantId, payload)`, and similar for each sub-step.

---

## 7. Step 7 – Product attributes

- **Route:** `product-attributes` → `/products/:id/product-attributes`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 7
- **Reference:** `product-wizard-spec/canvas wizard spec reference/product-attributes/`

**UI:**

- Table of product attributes (columns from spec: name, type, value, etc.).
- “Add” / “Edit” opens a drawer with a form (can be schema-driven later; start with a fixed set of fields).
- Delete with confirmation modal.
- Search/filter on the table.

**Validation:** Per attribute: name required, type and value per config. Use ProductAttribute types from reference.

**API placeholder:** `getProductAttributes(productId)`, `saveProductAttribute(productId, payload)`, `deleteProductAttribute(productId, attributeId)`.

---

## 8. Step 8 – Ratings

- **Route:** `ratingfactor` → `/products/:id/ratingfactor`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 8
- **Reference:** `product-wizard-spec/canvas wizard spec reference/rating-factor/`

**UI:**

- List of rating factors; link to coverage variants; premium rating factors configuration.
- Add/Edit drawer: name, allow custom, associated attribute, answer values (from reference RatingFactorComponent / RatingFactorsComponent).

**Validation:** Name required; answer values format as per types (RatingFactorModel, RatingItemModel, MultiRatingModel).

**API placeholder:** `getRatingFactors(productId)`, `saveRatingFactor(productId, payload)`.

---

## 9. Step 9 – Premium allocation

- **Route:** `premium-allocation` → `/products/:id/premium-allocation`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 9
- **Reference:** `product-wizard-spec/canvas wizard spec reference/premium-allocation/`

**UI:**

- **Form:** `breakDownType` (dropdown: COVGVAR / STDCOVER).
- **Table/grid:** Coverage variants with allocation % per row.
- **Validator:** Sum of allocation % = 100%.

**Validation (zod):**

- `breakDownType`: required, enum.
- Rows: each allocation number 0–100; `.refine(() => sum === 100, "Total allocation must equal 100%")`.

**Types:** PremiumAllocationLabels, BreakDownType, CoverageVariant from spec.

**API placeholder:** `getPremiumAllocation(productId)`, `savePremiumAllocation(productId, payload)`.

---

## 10. Step 10 – Documents

- **Route:** `documents` → `/products/:id/documents`
- **Spec:** FULL-PRODUCT-WIZARD-SPEC § Step 10
- **Reference:** `product-wizard-spec/canvas wizard spec reference/documents-v2/`

**UI:**

- Table of documents (columns: name, type, date, etc.).
- “Add document” (drawer with form/schema), “Edit”, “Download”, “Delete”.

**Validation:** Add form: name required, type and file/url as per spec. Use Documents, DocumentsV2Labels types.

**API placeholder:** `getDocuments(productId)`, `uploadDocument(productId, file, metadata)`, `deleteDocument(productId, docId)`.

---

## 3. Where to wire each step

In **`src/app/products/[id]/[[...step]]/page.tsx`**, the content area currently does:

- `effectiveSegment === "create"` → `<ProductDetailsForm ... />`
- `effectiveSegment === "update"` → Overview placeholder
- Else → `<WizardStepPlaceholder ... />`

To implement a step, replace the placeholder branch for that segment with your new component, e.g.:

```tsx
// Add imports
import { AvailabilityForm } from "@/components/availability-form";
import { PremiumAllocationForm } from "@/components/premium-allocation-form";
// ... etc.

// In the content area, add branches (order doesn’t matter if you use if/else or a map):
{effectiveSegment === "availability" && (
  <AvailabilityForm productId={id} onNext={handleNext} />
)}
{effectiveSegment === "premium-allocation" && (
  <PremiumAllocationForm productId={id} onNext={handleNext} />
)}
// ... etc.
```

Keep **Back** and **Next** (and **Save** where needed) inside each form component so behaviour matches Step 1.

---

## 4. Suggested order of implementation

1. **Step 2 (Product overview)** – Reuse Step 1 fields + version + read-only sections; good to validate the pattern.
2. **Step 9 (Premium allocation)** – Single form + one table and one validator (total = 100%); good zod practice.
3. **Step 3 (Availability)** – One form (create availability); then add list + edit.
4. **Step 5 (State configuration)** – One table with inline/drawer edit.
5. **Step 10 (Documents)** – Table + add/edit/delete + file upload mock.
6. **Step 7 (Product attributes)** – Table + drawer form.
7. **Step 8 (Ratings)** – List + drawer form.
8. **Step 4 (Policy configuration)** – Large form + table (most ref data).
9. **Step 6 (Coverage variants)** – All sub-steps (most complex).

---

## 5. Checklist per step

- [ ] Types for form and API payload (in spec or `src/lib/`)
- [ ] Zod schema with required/max/pattern/cross-field rules
- [ ] Form component (react-hook-form + shadcn)
- [ ] Mock data for dropdowns/lists in `product-wizard-mocks.ts` or step-specific mock file
- [ ] Back / Save / Next (or Save & next) in the component
- [ ] Wire in `[id]/[[...step]]/page.tsx` for the step’s `routeSegment`
- [ ] API placeholder (e.g. `saveX(productId, payload)`) and a short comment where to call the real API later

Using this, you can implement all steps and their forms and validation in a consistent way across the wizard.
