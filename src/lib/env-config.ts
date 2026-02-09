/**
 * Resolves base URLs for a given environment (sit | uat).
 * Used by API routes only; env selection comes from cookie/header.
 */

import {
  type EnvKey,
  ENV_COOKIE_NAME,
  ENV_KEYS,
  isValidEnvKey,
} from "./env-constants";

export { ENV_COOKIE_NAME, ENV_KEYS, isValidEnvKey };
export type { EnvKey };

export function getEnvKeyFromRequest(cookieOrHeader: string | null | undefined): EnvKey {
  const raw = (cookieOrHeader ?? "").trim().toLowerCase();
  return isValidEnvKey(raw) ? raw : "sit";
}

export interface EnvAuth {
  authUrl: string | null;
  authApiVersion: string;
  resource: string | null;
  appId: string | null;
  appKey: string | null;
  impersonateId: string;
  /** Optional APIM subscription key; if set, sent as Ocp-Apim-Subscription-Key on policy/document API calls */
  apimSubscriptionKey: string | null;
}

/**
 * Get auth credentials for the given env. Token is fetched from the env-specific auth URL with env-specific app id/key.
 * SIT falls back to legacy UAT_AUTH_* if SIT_EMEA_AUTH_* are not set. UAT uses UAT_EMEA_AUTH_*.
 */
export function getEnvAuth(envKey: EnvKey): EnvAuth {
  if (envKey === "uat") {
    return {
      authUrl:
        process.env.UAT_EMEA_AUTH_URL ??
        process.env.UAT_AUTH_URL_UAT ??
        null,
      authApiVersion:
        process.env.UAT_EMEA_AUTH_API_VERSION ??
        process.env.UAT_AUTH_API_VERSION ??
        "1",
      resource:
        process.env.UAT_EMEA_AUTH_RESOURCE ??
        process.env.UAT_AUTH_RESOURCE_UAT ??
        process.env.UAT_AUTH_RESOURCE ??
        null,
      appId:
        process.env.UAT_EMEA_AUTH_APP_ID ??
        process.env.UAT_AUTH_APP_ID_UAT ??
        process.env.UAT_AUTH_APP_ID ??
        null,
      appKey:
        process.env.UAT_EMEA_AUTH_APP_KEY ??
        process.env.UAT_AUTH_APP_KEY_UAT ??
        process.env.UAT_AUTH_APP_KEY ??
        null,
      impersonateId:
        process.env.UAT_EMEA_IMPERSONATE_ID ??
        process.env.UAT_POLICY_IMPERSONATE_ID ??
        "",
      apimSubscriptionKey:
        process.env.UAT_EMEA_APIM_SUBSCRIPTION_KEY ??
        process.env.UAT_APIM_SUBSCRIPTION_KEY ??
        null,
    };
  }
  // sit: prefer SIT_EMEA_AUTH_*, then legacy UAT_*
  return {
    authUrl:
      process.env.SIT_EMEA_AUTH_URL ??
      process.env.UAT_AUTH_URL ??
      null,
    authApiVersion:
      process.env.SIT_EMEA_AUTH_API_VERSION ??
      process.env.UAT_AUTH_API_VERSION ??
      "1",
    resource:
      process.env.SIT_EMEA_AUTH_RESOURCE ??
      process.env.UAT_AUTH_RESOURCE ??
      null,
    appId:
      process.env.SIT_EMEA_AUTH_APP_ID ??
      process.env.UAT_AUTH_APP_ID ??
      null,
    appKey:
      process.env.SIT_EMEA_AUTH_APP_KEY ??
      process.env.UAT_AUTH_APP_KEY ??
      null,
    impersonateId:
      process.env.SIT_EMEA_IMPERSONATE_ID ??
      process.env.UAT_POLICY_IMPERSONATE_ID ??
      "",
    apimSubscriptionKey:
      process.env.SIT_EMEA_APIM_SUBSCRIPTION_KEY ??
      process.env.UAT_APIM_SUBSCRIPTION_KEY ??
      null,
  };
}

export interface EnvUrls {
  /** URL2 – policy API base (digital.policy.catalyst) */
  apiBaseUrl: string | null;
  /** URL3 – document API base (digital.system.document) */
  documentApiBaseUrl: string | null;
  /** URL – catalyst product (digital.system.catalyst-product), optional */
  catalystProductUrl: string | null;
}

/**
 * Get base URLs for the given env. Falls back to legacy UAT_* vars for "sit" if SIT_EMEA_* are not set.
 */
export function getEnvUrls(envKey: EnvKey): EnvUrls {
  if (envKey === "uat") {
    return {
      apiBaseUrl:
        process.env.UAT_EMEA_API_BASE_URL ??
        process.env.UAT_API_BASE_URL_UAT ??
        null,
      documentApiBaseUrl:
        process.env.UAT_EMEA_DOCUMENT_API_BASE_URL ??
        process.env.UAT_DOCUMENT_API_BASE_URL_UAT ??
        null,
      catalystProductUrl:
        process.env.UAT_EMEA_CATALYST_PRODUCT_URL ??
        process.env.UAT_CATALYST_PRODUCT_URL_UAT ??
        null,
    };
  }
  // sit: prefer SIT_EMEA_*, then legacy UAT_* for backward compatibility
  return {
    apiBaseUrl:
      process.env.SIT_EMEA_API_BASE_URL ??
      process.env.UAT_API_BASE_URL ??
      null,
    documentApiBaseUrl:
      process.env.SIT_EMEA_DOCUMENT_API_BASE_URL ??
      process.env.UAT_DOCUMENT_API_BASE_URL ??
      null,
    catalystProductUrl:
      process.env.SIT_EMEA_CATALYST_PRODUCT_URL ??
      process.env.UAT_CATALYST_PRODUCT_URL ??
      null,
  };
}

export { ENV_LABELS } from "./env-constants";

export function getAvailableEnvKeys(): EnvKey[] {
  return ENV_KEYS.filter((key) => {
    const urls = getEnvUrls(key);
    return urls.apiBaseUrl != null || urls.documentApiBaseUrl != null;
  });
}
