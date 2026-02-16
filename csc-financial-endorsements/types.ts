/**
 * Types for CSC Financial Endorsements flow.
 * Use for the Summary form, endorsement API request/response, and state.
 */

/** Attribute name/value pair used in policy/endorsement payloads */
export interface PolicyDetailAttribute {
  attrName: string;
  attrValue: string;
  isRatingFactor?: boolean;
}

export interface EndorseReqPolicyDetailAttr extends PolicyDetailAttribute {
  deleteAction?: boolean;
}

/** Premium block in endorsement response */
export interface EndorseResponsePremium {
  premium?: number | null;
  tax: number | null;
  commission: number | null;
  totalPremium: number;
  paymentFrequency?: string | null;
  premiumChange?: number | null;
  billedImmediately?: boolean;
  bspId?: string | number | null;
}

export interface EndorseResponseNextBillInfo {
  tax: number;
  commission: number;
  totalPremium: number;
  billStartDate: string;
  billEndDate: string;
  permium?: number | null;
  netPremium?: number;
}

/** Coverage line in endorsement response */
export interface EndorseResponseCoverage {
  coverageId: string;
  coverageLevelId: string;
  coverage: string;
  coverageType: string;
  limitValue: number;
  limitType: string;
  deductible: number;
  included: string;
  premium: number;
  tax: number;
  discount?: number | null;
  discountType?: string | null;
  nonDiscountedPremium?: number | null;
  commission: number;
  totalPremium: number;
  discountIndicator?: string | null;
  nonDiscountedPremiumExclTax: number | null;
  nonDiscountedCommission?: number | null;
  nonDiscountedTax?: number | null;
}

export interface EndorseResponseInsured {
  accountId: string;
  insuredType: string;
  isGroup: boolean;
  customAttributes: PolicyDetailAttribute[];
  coverages: EndorseResponseCoverage[];
}

export interface EndorseInsuredObjectParty {
  partyType?: string | null;
  partySubtype?: string;
  partyAge?: number;
  customAttributes: EndorseReqPolicyDetailAttr[];
  deleteAction?: boolean;
}

export interface EndorseResponseInsuredObject {
  objectId: string;
  objectType: string;
  isGroup: boolean;
  sumInsured?: number;
  domainAttributes: PolicyDetailAttribute[];
  customAttributes: PolicyDetailAttribute[];
  allowedParties: EndorseInsuredObjectParty[];
  coverages: EndorseResponseCoverage[];
}

/** Response from PATCH .../endorsements (preview or submit) */
export interface EndorseResponse {
  policyNumber: string;
  effectiveDate: string;
  applicationDate: string;
  status: string;
  endorsementQuoteId?: string | null;
  currency: string;
  premiums: {
    active?: EndorseResponsePremium;
    endorsement?: EndorseResponsePremium;
    adjustment?: EndorseResponsePremium;
    nextBill?: EndorseResponseNextBillInfo;
  };
  insureds?: EndorseResponseInsured[] | null;
  insuredObjects: EndorseResponseInsuredObject[];
}

/** Correspondence/config set from Summary form */
export interface EndorseConfiguration {
  documentForcePrint?: boolean;
  documentSuppress?: boolean;
}

/**
 * Request body for PATCH .../endorsements.
 * All change payloads (insured, insuredObjects, people, etc.) are built
 * from the policy-detail UI. Summary form only sets endorsementReason,
 * description (notes), configuration, and sendCorrespondence.
 */
export interface EndorseRequest {
  requestId?: string | null;
  endorsementQuoteId?: string | null;
  policyNumber: string;
  effectiveDate: string;
  applicationDate: string;
  impersonateId?: string;
  province?: string;
  zipCode?: string;
  language: string;
  countryCode: string;
  insuredGroup?: string;
  insuredObjectGroup?: string;
  people?: unknown[];
  insured?: unknown;
  insuredObjects?: unknown[];
  plan?: { planCode: string; overrideCov?: boolean };
  rating?: unknown[] | null;
  customAttributes?: unknown[];
  domainAttributes?: unknown[];
  /** Set from Summary form – endorsement reason dropdown */
  endorsementReason?: string;
  /** Set from Summary form – correspondence choice */
  configuration?: EndorseConfiguration;
  /** Set from Summary form – correspondence choice */
  sendCorrespondence: boolean;
  note?: string;
  /** Set from Summary form – notes field */
  description?: string;
}

/** Summary of what changed (for display list on Summary page) */
export interface EndorseMetaInfo {
  insuredIndv: EndorseInsuredState[];
  objects: InsuredObjectUpdateDetail[];
  coverageLevelChanges: {
    covgId: string;
    levelId: string;
    insId: string;
    insType: { id: string; desc: string };
    value: string;
    accountId: string;
  }[];
  others: string[];
  policyType: string;
}

export interface EndorseInsuredState {
  accountId: string;
  endType: string;
  fields?: string[];
  formalName: string;
  insuredType: { id: string; description: string };
  additionalInfo?: unknown;
  newObjectDesc?: string;
}

export interface InsuredObjectUpdateDetail {
  objectId: string;
  type: string;
  fields?: string[];
  objectType: string;
  newObjectDesc?: string;
}

/** Full endorsement state (request + change metadata) */
export interface EndorseState {
  data: EndorseRequest[];
  changesAvailable: boolean;
  meta: EndorseMetaInfo;
  pendingActions: unknown[];
}
