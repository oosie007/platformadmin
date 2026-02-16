/**
 * CSC Financial Endorsements – types and helpers.
 * Types match csc-financial-endorsements/types.ts; form mapping per FORM-SPEC.md.
 */

import type {
  EndorseRequest,
  EndorseConfiguration,
} from "../../csc-financial-endorsements/types";

export type {
  EndorseRequest,
  EndorseResponse,
  EndorseConfiguration,
  EndorseResponsePremium,
  EndorseResponseNextBillInfo,
} from "../../csc-financial-endorsements/types";

/** Minimal policy shape (from policy detail API) to build EndorseRequest */
export interface PolicyDetailForEndorse {
  basicInfo?: {
    policyNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
    country?: { id?: string; label?: string };
    currency?: { id?: string };
    [key: string]: unknown;
  };
  people?: unknown[];
  insureds?: unknown[];
  insObjsResp?: unknown[];
  customAttributes?: unknown[];
  [key: string]: unknown;
}

/** Fields that the policy API returns as { id?, label? } but the endorsement API expects as string. */
const PERSON_OBJECT_FIELDS = [
  "title",
  "gender",
  "occupation",
  "maritalStatus",
  "education",
  "industry",
  "personalIdType",
  "nationality",
] as const;

function toValue(obj: unknown): string | undefined {
  if (obj == null) return undefined;
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  if (typeof o.id === "string") return o.id;
  if (typeof o.label === "string") return o.label;
  if (typeof o.code === "string") return o.code;
  if (typeof o.description === "string") return o.description;
  if (typeof o.value === "string") return o.value;
  if (typeof o.name === "string") return o.name;
  if (typeof o.key === "string") return o.key;
  // Only use "any string" for small ref-like objects (≤4 keys), so we don't collapse person/address into first name
  const keys = Object.keys(o);
  if (keys.length <= 4) {
    for (const val of Object.values(o)) {
      if (typeof val === "string" && val.trim().length > 0) return val;
    }
  }
  return undefined;
}

/** True if object looks like a reference (id/label/code etc.), not a full entity like person or address. */
function isRefLike(o: Record<string, unknown>): boolean {
  const refKeys = ["id", "label", "code", "description", "value", "name", "key"];
  const hasRefKey = refKeys.some((k) => typeof o[k] === "string");
  const keyCount = Object.keys(o).length;
  return hasRefKey && keyCount <= 6;
}

/** Recursively replace only reference-like objects with their string value. Never collapse person/address. */
function flattenRefObject(obj: unknown): unknown {
  if (obj == null) return obj;
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => flattenRefObject(item));
  }
  if (typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    if (isRefLike(o)) {
      const str = toValue(o);
      if (str !== undefined) return str;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      const normalized = flattenRefObject(v);
      if (normalized !== undefined) out[k] = normalized;
    }
    return out;
  }
  return obj;
}

/** Normalize one address: every field that is an object (type, country, etc.) becomes a string. */
function normalizeAddress(addr: unknown): Record<string, unknown> {
  if (addr == null || typeof addr !== "object") return {};
  const a = addr as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(a)) {
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const str = toValue(v);
      if (str !== undefined) out[k] = str;
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item != null && typeof item === "object" && !Array.isArray(item)
          ? (flattenRefObject(item) as Record<string, unknown>)
          : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Normalize an array: if it contains objects, convert to string[] using toValue; otherwise keep as-is. */
function normalizeArray(arr: unknown[]): unknown[] {
  const hasObjects = arr.some((item) => item != null && typeof item === "object" && !Array.isArray(item));
  if (!hasObjects) return arr;
  return arr
    .map((item) => {
      if (item == null) return null;
      if (typeof item === "string") return item;
      if (typeof item === "object" && !Array.isArray(item)) return toValue(item) ?? null;
      return item;
    })
    .filter((x): x is string => typeof x === "string");
}

/** Normalize people[] so title, gender, nationality, sensivityCode, etc. are primitives (endorsement API expects strings/string[], not objects). Returns [] when empty so backend never gets null (Parameter 'source'). */
function normalizePeople(people: unknown[] | undefined): Record<string, unknown>[] {
  if (!Array.isArray(people) || people.length === 0) return [];
  return people.map((p) => {
    if (p == null || typeof p !== "object") return {};
    const rec = p as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (k === "addresses") {
        out[k] = Array.isArray(v) ? v.map(normalizeAddress) : [];
      } else if (Array.isArray(v)) {
        out[k] = normalizeArray(v);
      } else if (v != null && typeof v === "object" && !Array.isArray(v)) {
        const str = toValue(v);
        if (str !== undefined) out[k] = str;
        // else omit: don't send objects the API can't parse
      } else if (PERSON_OBJECT_FIELDS.includes(k as (typeof PERSON_OBJECT_FIELDS)[number])) {
        const str = toValue(v);
        if (str !== undefined) out[k] = str;
        else if (v != null) out[k] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  });
}

/** Keys that the backend may iterate over; ensure they are [] not null to avoid "Parameter 'source'" errors. */
const COLLECTION_KEYS = new Set([
  "people", "addresses", "insuredObjects", "customAttributes", "domainAttributes", "rating",
  "coverages", "contactDetails", "sensivityCode", "suppressionCode", "roles", "coverageVariants",
  "allowedParties",
]);

/** Recursively replace null/undefined collection fields with [] so backend never gets null (Parameter 'source'). */
function ensureNoNullCollections(obj: unknown, depth: number = 0): unknown {
  if (depth > 15) return obj;
  if (obj == null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => ensureNoNullCollections(item, depth + 1));
  }
  const o = obj as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v == null && COLLECTION_KEYS.has(k)) {
      out[k] = [];
    } else if (v != null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = ensureNoNullCollections(v, depth + 1);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) => ensureNoNullCollections(item, depth + 1));
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Build minimal EndorseRequest from policy detail for preview/submit. Deep-flattens all ref objects so the API never receives { id, label } where it expects a string. */
export function buildMinimalEndorseRequest(
  policy: PolicyDetailForEndorse | null,
  impersonateId: string
): EndorseRequest | null {
  const pn = policy?.basicInfo?.policyNumber;
  if (!pn) return null;
  const bi = policy.basicInfo!;
  const effectiveDate = bi.effectiveDate ?? new Date().toISOString().slice(0, 10);
  const countryCode = (bi.country?.id ?? bi.country?.label ?? "CH") as string;
  const raw = {
    policyNumber: pn,
    effectiveDate,
    applicationDate: effectiveDate,
    language: "en",
    countryCode: countryCode.length === 2 ? countryCode : "CH",
    impersonateId: impersonateId || undefined,
    sendCorrespondence: true,
    people: normalizePeople(policy.people ?? []),
    insured: policy.insureds?.[0] ?? undefined,
    insuredObjects: Array.isArray(policy.insObjsResp) ? policy.insObjsResp : [],
    rating: Array.isArray((policy as { rating?: unknown[] }).rating) ? (policy as { rating: unknown[] }).rating : [],
    customAttributes: Array.isArray(policy.customAttributes) ? policy.customAttributes : [],
    domainAttributes: Array.isArray((policy as { domainAttributes?: unknown[] }).domainAttributes) ? (policy as { domainAttributes: unknown[] }).domainAttributes : [],
  };
  const flattened = flattenRefObject(raw) as EndorseRequest;
  return ensureNoNullCollections(flattened) as EndorseRequest;
}

/** Correspondence dropdown value → configuration + sendCorrespondence (FORM-SPEC.md) */
export function correspondenceToRequest(
  value: string
): { configuration: EndorseConfiguration; sendCorrespondence: boolean } {
  const v = (value ?? "").trim().toLowerCase();
  if (v.includes("suppress")) {
    return {
      configuration: { documentForcePrint: false, documentSuppress: true },
      sendCorrespondence: false,
    };
  }
  if (v.includes("force print")) {
    return {
      configuration: { documentForcePrint: true, documentSuppress: false },
      sendCorrespondence: false,
    };
  }
  return {
    configuration: { documentForcePrint: false, documentSuppress: false },
    sendCorrespondence: true,
  };
}

/** Strip optional prefix from endorsement reason (e.g. "CODE: Description" → "Description") */
export function normalizeEndorsementReason(value: string): string {
  const s = (value ?? "").trim();
  const afterColon = s.split(":").pop()?.trim();
  return afterColon ?? s;
}
