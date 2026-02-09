# Product creation form (Step 1 of wizard)

## Purpose
First step of the product wizard. User enters product details; on Save the payload is built for a future POST (API not implemented yet).

## Form controls and validation

| Field (formControlName) | Type | Required | Validation | Notes |
|-------------------------|------|----------|------------|--------|
| productName | text | Yes | maxLength 500 | Trim on submit |
| productId | text | Yes | maxLength 10; only a-zA-Z0-9_- | Unique ID; show "already exists" error key `exists` |
| description | textarea | No | maxLength 2000 | Trim on submit |
| marketingName | text | No | maxLength 500 | |
| dateRange.effectiveDate | date | Yes | Not in past; valid date | |
| dateRange.expiryDate | date | No | Must be > effectiveDate; valid date | |
| status | select | Yes | One of status list | Default: DESIGN. Options from ref-data PRODUCTSTATUS (mock for now) |
| productVersionId | text | Yes | Pattern: major version e.g. 1.0, 2.0 → /^(?!00)\d+\.0{1,}$/ | Default "1.0" |
| country | select | Yes | Options from country list (mock for now) | On change, reload currency list for premium/limits |
| premiumCurrency | select | Yes | Options from currency list (mock for now) | |
| limitsCurrency | select | Conditional | Required only when "Define limits and premium currency" is ON | Toggle shows second currency dropdown; same options as premium |

## Date range validator (single validator on dateRange group)
- effectiveDate: required, not past date, must be valid date.
- expiryDate: if filled, must be valid date and > effectiveDate.
- Error keys: dateRangeInvalid, effectiveDateInvalid, expiryDateInvalid, isEffectiveDatePast.

## ProductId validator
- Allow only: letters, numbers, underscore, hyphen. Regex: [^a-zA-Z0-9_-].
- Error key: invalidCharacters. Message e.g. "Product ID allows only letters, numbers, underscore and hyphen."

## Dropdowns
- Status, Country, Premium currency, Limits currency: use a "Select" placeholder as first option (empty or space).
- Status options: mock list with at least { code: 'DESIGN', description: 'Design' }, { code: 'FINAL', description: 'Final' }.
- Country/currency: mock a few options (e.g. code + description). When country changes, filter or reload currency list (mock).

## Toggle: "Define limits and premium currency"
- When OFF: single Premium currency required; no limitsCurrency field.
- When ON: add limitsCurrency control, required; show both dropdowns.

## Mapping form value → ProductRequest (for later API)
- productId, productVersionId, requestId ('1' or uuid).
- header: productName, productVersionName, shortName (same as productName), marketingName, description (trimmed), status: { value: statusCode, category: 'PRODUCTSTATUS' }, premiumCurrency: { value: code, category: 'CURRENCY' }, country: [countryCode], effectiveDate, expiryDate.
- If limits toggle ON: header.limitsCurrency: { value: code, category: 'CURRENCY' }; else null.
- rating: { premiumRatingFactors: [] }.

## Labels (use as-is or adjust)
- Product name, Product ID, Marketing name, Product description.
- Effective date *, Expiry date.
- Status, Product version.
- Country, Premium currency, Limits currency.
- Tooltip Product ID: "A unique 10-digit number that helps identify the product. It cannot be a duplicate of an existing product ID."
- Tooltip Status: "Delete: removed. Design: in progress. Final: finalized. Withdrawn: no longer available."
- Toggle: "Define limits and premium currency". Helper: "Turn on to manually input different currencies for premiums and limits (e.g. global products in USD)."
- Buttons: Back, Save, Next.
- Errors: "Product name is required", "Max length is 500", "Product ID is required", "Max length is 10", "Product ID already exists", "Invalid product version (e.g. 1.0, 2.0)", "Country is required", "Premium Currency is required", "Limits Currency is required", "Effective Date shouldn't be past date", "Expiry Date should be greater than Effective date", "Please enter / select valid date."

## Navigation
- Back: go back to product list (e.g. /products).
- Save: build ProductRequest from form, then for now just log it or set it in state; optionally show success message and navigate to next step (e.g. product update/overview).
- Next: advance to next step in wizard (stepCount: 1); only enable after first successful Save or as per your flow.