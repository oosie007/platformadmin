# Full Product Creation Wizard – All Steps

Base path for product: `/products` (list) and `/products/:id/...` for wizard steps.
Create flow: `/products/create` (step 1) then redirect to `/products/:productId/update` (overview).

---

## Step 0 (entry)
- **Route:** `/products` or `/products/create`
- **Purpose:** Product list; "Create Product" navigates to step 1.
- **Step 1 route:** `create` (under stepper) → Product details form.

---

## Step 1 – Product details (CREATE)
- **Route:** `create` (e.g. `/products/create` or `/products/:id/create`)
- **Component:** CreateProductComponent
- **UI:** Single form (see product-create-form.spec.md).
- **Fields:** productName, productId, description, marketingName, dateRange (effectiveDate, expiryDate), status, productVersionId, country, premiumCurrency, limitsCurrency (optional toggle), Back / Save / Next.
- **On Save:** Build ProductRequest, call create API (or mock), then navigate to `/products/:productId/update`.

---

## Step 2 – Product overview (UPDATE) – after create
- **Route:** `update` → `/products/:id/update`
- **Component:** ProductOverviewComponent
- **UI:** Form to edit product header (same fields as create + version selector, lock, etc.). Read-only sections for availability, policy config summary. Back / Save & next.
- **Config:** Labels from app context `pages.productOverview.labels`. Form mirrors ProductRequest.header.

---

## Step 3 – Availability
- **Route:** `availability` → `/products/:id/availability`
- **Component:** AvailabilityComponent
- **UI:** Table of availability records; actions: Create availability, Edit. Toolbar with search/filter.
- **Sub-step – Create availability**
  - **Route:** `availability/create` → `/products/:id/availability/create`
  - **Component:** CreateAvailabilityComponent
  - **Fields:** country (pre-filled from product), availability by states (toggle), states (multi-select for US), blacklist zip codes. Request shape: StandardAvalability { country, states[], locale, blacklistZipCodes[] }.
- **Types:** availability.component.ts uses RootAvailability, Standard, Standards, State; create uses StandardAvalability, State_list. See types/availability.

---

## Step 4 – Policy configuration
- **Route:** `policyconfiguration` → `/products/:id/policyconfiguration`
- **Component:** PolicyConfigurationComponent
- **UI:** Large form + table (minimum premium by state/country). Many ref-data dropdowns.
- **Config:** `pages.product.policy-configuration.stateColumn`, `countryColumn`, `labels` (PolicyConfigurationLabels).
- **Key form areas:** Policy type, refund type, term end (e.g. PERPETUAL), renewal type, cooling period, tax charge, commission routine, rounding types, renewal notice period, non-renewal notification date; table for minimum premium per state/country. Uses ProductRequest.lifeCycle and availability data.
- **Types:** policy-configuration.model.ts, types/policy-configuration (CommissionRoutine etc.), types/minimum-premium.

---

## Step 5 – State configuration
- **Route:** `stateconfiguration` → `/products/:id/stateconfiguration`
- **Component:** StateConfigurationComponent
- **UI:** Table of state-configuration rows (e.g. state, effective/expiry dates, renewal notification). Edit inline or row actions. Only relevant for US country.
- **Config:** `pages.product.state-configuration.listOptions`, `labels`; perpetual variant: `pages.product.stateConfigurationPerptual.*`.
- **Types:** state-configuration/models (StateConfiguration, StateConfigurationLabels).

---

## Step 6 – Coverage variants (with sub-steps)
- **Route:** `coveragevariant` → `/products/:id/coveragevariant`
- **Component:** CoverageVariantComponent – table of coverage variants; create, clone, edit allocation.
- **Sub-steps (stepper):**
  1. **Coverage variant details** – `coveragevariant` – table + create/edit coverage variant (id, name, allocation %, etc.).
  2. **Insured type** – `coveragevariant/insuredType` – InsuredTypeSelectionComponent – select insured types for variant.
  3. **Coverage factors** – `coveragevariant/coverageFactors` – CoverageFactorsComponent – age band, gender, etc.
  4. **Subcoverages** – `coveragevariant/sub-coverage` – SubcoverageComponent – link sub-coverages.
  5. **Coverage variant levels** – `coveragevariant/coverage-variant-level-overview` – overview of levels; drill to level config.
  6. **Exclusions** – `coveragevariant/exclusions` – ExclusionComponent.
  7. **Include fixed coverages** – `coveragevariant/inclusions` – InclusionComponent.

Additional coverage-variant routes (drill-down): insuredObject, insuredCombination, insuredObjectCombination, miVariantLevel, spouseVariantLevel, childVariantLevel, adultVariantLevel, objectVariantLevel, eventVariantLevel, edit, createcoveragevariant, linkCoverageVariant, coverageFactors, coverage-variant-level, exclusions, inclusions. Config: `pages.product.coverage-variant.*`, `pages.product.mi-variant.*`, `pages.product.coverage-factors.*`, etc.
- **Types:** types/coverage (CoverageVariant, CreateCoverageVariant, etc.), types/coverage-variant-level, types/exclusion.

---

## Step 7 – Product attributes
- **Route:** `product-attributes` → `/products/:id/product-attributes`
- **Component:** ProductAttributesComponent
- **UI:** Table of product attributes; add/edit drawer (Formly schema), delete modal. Search/filter. Predefined vs custom attributes.
- **Config:** `pages.product.productAttributes.schema`, `columns`, `labels`, `messages`, `listOptions`, `disableFeature`.
- **Types:** product-attributes/model/product-attribute (ProductAttribute, ProductAttributeLabels, etc.).

---

## Step 8 – Ratings
- **Route:** `ratingfactor` → `/products/:id/ratingfactor`
- **Component:** RatingFactorComponent (rating-factor.component.ts in home/rating-factor)
- **UI:** Rating factors list; link to coverage variants; premium rating factors configuration. Can also use RatingFactorsComponent at `ratingfactor-old` (rating-factors.component.ts) – drawer forms for add/edit rating factor (name, allow custom, associated attribute, answer values). Types: types/rating (RatingData, RatingFactorModel, RatingItemModel, MultiRatingModel).

---

## Step 9 – Premium allocation
- **Route:** `premium-allocation` → `/products/:id/premium-allocation`
- **Component:** PremiumAllocationComponent
- **UI:** Form: breakDownType (COVGVAR / STDCOVER); table/grid of coverage variants with allocation %. Validator: total allocation = 100%.
- **Config:** `pages.productPremiumAllocation.labels`.
- **Types:** types/product (PremiumAllocationColumns, BreakDownType), types/premium-allocation (PremiumAllocationLabels), types/coverage (CoverageVariant, coveragespremiumregistration).

---

## Step 10 – Documents
- **Route:** `documents` → `/products/:id/documents`
- **Component:** DocumentsV2Component
- **UI:** Table of documents; Add document (drawer with Formly schema), Edit, Download, Delete.
- **Config:** `pages.product.documents-v2.schema`, `columns`, `labels`, `form` (edit schema).
- **Types:** documents-v2/model/documents-v2 (Documents, DocumentsV2Labels).