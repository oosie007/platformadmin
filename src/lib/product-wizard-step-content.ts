/**
 * Step descriptions and purpose from FULL-PRODUCT-WIZARD-SPEC.
 * Used for placeholder step pages and accessibility.
 */

export const WIZARD_STEP_CONTENT: Record<
  string,
  { title: string; description: string; specRef: string }
> = {
  create: {
    title: "Product details",
    description:
      "Enter product name, ID, description, marketing name, date range (effective/expiry), status, product version, country, premium currency, and optional limits currency. Save to create the product, then continue to overview.",
    specRef: "Step 1 – Product details (CREATE)",
  },
  update: {
    title: "Product overview",
    description:
      "Edit product header (same fields as create plus version selector, lock). Read-only sections for availability and policy config summary. Back / Save & next.",
    specRef: "Step 2 – Product overview (UPDATE)",
  },
  availability: {
    title: "Create availability",
    description:
      "Table of availability records; create and edit. Create form: country (pre-filled from product), availability by states (toggle), states (multi-select for US), blacklist zip codes.",
    specRef: "Step 3 – Availability",
  },
  policyconfiguration: {
    title: "Policy configuration",
    description:
      "Large form and table: policy type, refund type, term end, renewal type, cooling period, tax charge, commission routine, rounding types, renewal notice period; minimum premium per state/country.",
    specRef: "Step 4 – Policy configuration",
  },
  stateconfiguration: {
    title: "State configuration",
    description:
      "Table of state-configuration rows (state, effective/expiry dates, renewal notification). Edit inline or row actions. Only relevant for US country.",
    specRef: "Step 5 – State configuration",
  },
  coveragevariant: {
    title: "Coverage variant details",
    description:
      "Table of coverage variants; create, clone, edit allocation. Configure coverage variant id, name, type, allocation %, standard coverage codes, description, prerequisite variants.",
    specRef: "Step 6 – Coverage variants",
  },
  "coveragevariant/insuredType": {
    title: "Insured type",
    description: "Select insured types for the coverage variant.",
    specRef: "Step 6 – Coverage variants (sub-step)",
  },
  "coveragevariant/coverageFactors": {
    title: "Coverage factors",
    description: "Configure age band, gender, and other coverage factors for the variant.",
    specRef: "Step 6 – Coverage variants (sub-step)",
  },
  "coveragevariant/sub-coverage": {
    title: "Subcoverages",
    description: "Link sub-coverages to the coverage variant.",
    specRef: "Step 6 – Coverage variants (sub-step)",
  },
  "coveragevariant/coverage-variant-level-overview": {
    title: "Coverage variant levels",
    description: "Overview of coverage variant levels; drill to level config.",
    specRef: "Step 6 – Coverage variants (sub-step)",
  },
  "coveragevariant/exclusions": {
    title: "Exclusions",
    description: "Configure exclusions for the coverage variant.",
    specRef: "Step 6 – Coverage variants (sub-step)",
  },
  "coveragevariant/inclusions": {
    title: "Include fixed coverages",
    description: "Configure fixed coverage inclusions for the variant.",
    specRef: "Step 6 – Coverage variants (sub-step)",
  },
  "product-attributes": {
    title: "Product attributes",
    description:
      "Table of product attributes; add/edit drawer (schema-driven), delete modal. Search/filter. Predefined vs custom attributes.",
    specRef: "Step 7 – Product attributes",
  },
  ratingfactor: {
    title: "Ratings",
    description:
      "Rating factors list; link to coverage variants; premium rating factors configuration. Add/edit rating factor (name, allow custom, associated attribute, answer values).",
    specRef: "Step 8 – Ratings",
  },
  "premium-allocation": {
    title: "Premium allocation",
    description:
      "Form: breakDownType (COVGVAR / STDCOVER); table/grid of coverage variants with allocation %. Total allocation must equal 100%.",
    specRef: "Step 9 – Premium allocation",
  },
  documents: {
    title: "Documents",
    description:
      "Table of documents; Add document (drawer with schema), Edit, Download, Delete.",
    specRef: "Step 10 – Documents",
  },
};

export function getStepContent(routeSegment: string): {
  title: string;
  description: string;
  specRef: string;
} {
  return (
    WIZARD_STEP_CONTENT[routeSegment] ?? {
      title: routeSegment || "Step",
      description: "This step is not yet implemented. See FULL-PRODUCT-WIZARD-SPEC for details.",
      specRef: "FULL-PRODUCT-WIZARD-SPEC",
    }
  );
}
