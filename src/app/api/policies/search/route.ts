import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME, type EnvAuth } from "@/lib/env-config";
import { appendAuditEntry } from "@/lib/audit-server";

/** Advanced policy search: search by person (demography). Backend expects searchvalue, searchType (e.g. "ByDemography"), resultType (e.g. "Short"), person with all fields (use "" for unused). */
export interface PolicySearchRequestBody {
  impersonateId?: string;
  language?: string;
  /** Sent as "searchvalue" (lowercase) to backend. */
  searchvalue?: string;
  /** e.g. "ByDemography" */
  searchType?: string;
  /** e.g. "Short" or "Detailed" */
  resultType?: string;
  person?: {
    dateOfBirth?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    gender?: string;
    nationality?: string;
    personalId?: string;
    personalIdType?: string;
    phoneNumber?: string;
    cellPhone?: string;
  };
}

interface TokenResponse {
  access_token?: string;
  [key: string]: unknown;
}

/** Decode JWT payload (no verification; for dev debug only). Returns aud, iss, exp if present. */
function decodeTokenPayload(token: string): { aud?: string; iss?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const aud = payload.aud;
    return {
      aud: typeof aud === "string" ? aud : Array.isArray(aud) ? String(aud[0]) : undefined,
      iss: typeof payload.iss === "string" ? payload.iss : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}

/** Remove keys with undefined/null/empty string to keep payload clean. Preserves 0 and false. */
function cleanPayload<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v)) {
      out[k] = v;
    } else if (typeof v === "object" && v !== null) {
      const cleaned = cleanPayload(v as Record<string, unknown>);
      if (Object.keys(cleaned).length > 0) out[k] = cleaned;
    } else {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const q = req.nextUrl.searchParams.get("q")?.trim() || null;
  const searchTypeParam = req.nextUrl.searchParams.get("searchType") || null;

  if (!date && !q) {
    return NextResponse.json(
      { error: "Provide either 'date' (YYYY-MM-DD) or 'q' (policy number, customer name, or email)." },
      { status: 400 }
    );
  }

  const envKey = getEnvKeyFromRequest(req.cookies.get(ENV_COOKIE_NAME)?.value);
  const urls = getEnvUrls(envKey);
  const auth = getEnvAuth(envKey);
  const policyBaseUrl = urls.apiBaseUrl;

  if (!auth.authUrl || !auth.resource || !auth.appId || !auth.appKey || !policyBaseUrl) {
    return NextResponse.json(
      {
        error:
          `Environment "${envKey}" is not fully configured. Set auth and API base URL for the selected environment in .env.local.`,
      },
      { status: 500 }
    );
  }

  const byDate = !!date;
  const querySearchType = searchTypeParam ||
    process.env.POLICY_SEARCH_TYPE_QUERY ||
    "CustomerName";
  const searchType = byDate
    ? "ByPolicyEffectiveDate"
    : (querySearchType === "ByCustomerName" ? "CustomerName" : querySearchType === "ByPolicyNumber" ? "PolicyNumber" : querySearchType);
  const searchvalue = byDate ? (date ?? "") : (q ?? "");

  const searchBody = {
    impersonateID: auth.impersonateId,
    language: "en",
    searchvalue,
    searchType,
    resultType: "Detailed",
  };

  return runPolicySearch(req, envKey, auth, policyBaseUrl, searchBody, byDate ? date ?? undefined : q ?? undefined);
}

export async function POST(req: NextRequest) {
  const envKey = getEnvKeyFromRequest(req.cookies.get(ENV_COOKIE_NAME)?.value);
  const urls = getEnvUrls(envKey);
  const auth = getEnvAuth(envKey);
  const policyBaseUrl = urls.apiBaseUrl;

  if (!auth.authUrl || !auth.resource || !auth.appId || !auth.appKey || !policyBaseUrl) {
    return NextResponse.json(
      {
        error:
          `Environment "${envKey}" is not fully configured. Set auth and API base URL for the selected environment in .env.local.`,
      },
      { status: 500 }
    );
  }

  let body: PolicySearchRequestBody;
  try {
    body = (await req.json()) as PolicySearchRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  // Build backend payload: impersonateId, language, searchvalue (lowercase), searchType, resultType, person (all keys, "" for unused)
  const personKeys = ["dateOfBirth", "firstName", "lastName", "middleName", "gender", "nationality", "personalId", "personalIdType", "phoneNumber", "cellPhone"] as const;
  const personPayload: Record<string, string> = {};
  for (const k of personKeys) {
    personPayload[k] = (body.person?.[k] ?? "").trim();
  }
  const searchBody: Record<string, unknown> = {
    impersonateId: body.impersonateId ?? auth.impersonateId ?? "",
    language: (body.language ?? "en").trim() || "en",
    searchvalue: (body.searchvalue ?? "").trim(),
    searchType: (body.searchType ?? "ByDemography").trim() || "ByDemography",
    resultType: (body.resultType ?? "Short").trim() || "Short",
    person: personPayload,
  };

  const subject = body.person?.firstName ?? body.person?.lastName ?? body.searchvalue ?? "advanced";
  return runPolicySearch(req, envKey, auth, policyBaseUrl, searchBody, subject);
}

async function runPolicySearch(
  _req: NextRequest,
  envKey: string,
  auth: EnvAuth,
  policyBaseUrl: string,
  searchBody: Record<string, unknown>,
  subject: string | undefined
) {
  try {
    const tokenRes = await fetch(auth.authUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiVersion: auth.authApiVersion,
        Resource: auth.resource ?? "",
        App_ID: auth.appId ?? "",
        App_Key: auth.appKey ?? "",
      },
    });

    if (!tokenRes.ok) {
      const bodyText = await tokenRes.text();
      return NextResponse.json(
        {
          error: "Failed to obtain access token from authorization endpoint.",
          status: tokenRes.status,
          body: bodyText,
        },
        { status: 502 }
      );
    }

    const tokenText = await tokenRes.text();
    let tokenJson: TokenResponse;
    try {
      tokenJson = JSON.parse(tokenText) as TokenResponse;
    } catch {
      return NextResponse.json(
        {
          error: "Authorization endpoint did not return valid JSON.",
          status: tokenRes.status,
          bodyPreview: tokenText.slice(0, 500),
        },
        { status: 502 }
      );
    }
    const rawToken =
      tokenJson.access_token ??
      (tokenJson as Record<string, unknown>).accessToken;
    const accessToken: string | undefined =
      typeof rawToken === "string" ? rawToken.trim() : undefined;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Authorization endpoint did not return access_token (or accessToken).",
          responseKeys: Object.keys(tokenJson),
        },
        { status: 502 }
      );
    }

    // Postman Policy Search uses header "apiversion: 2" (lowercase), no query param on URL
    const policyApiVersion =
      envKey === "sit" || envKey === "sit-latam"
        ? process.env.SIT_POLICY_API_VERSION ||
          process.env.POLICY_API_VERSION ||
          "2"
        : process.env.UAT_POLICY_API_VERSION ||
          process.env.POLICY_API_VERSION ||
          "2";
    const versionHeaderName =
      process.env.POLICY_API_VERSION_HEADER || "apiversion";
    const searchUrl = `${policyBaseUrl}/policy/policies/search`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      [versionHeaderName]: policyApiVersion,
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": process.env.POLICY_API_USER_AGENT || "PostmanRuntime/7.43.0",
    };
    if (auth.apimSubscriptionKey) {
      headers["Ocp-Apim-Subscription-Key"] = auth.apimSubscriptionKey;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[policies/search]", envKey, "searchUrl:", searchUrl, "apiversion:", policyApiVersion, "tokenLength:", accessToken?.length ?? 0, "hasApimKey:", !!auth.apimSubscriptionKey);
    }
    const searchRes = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(searchBody),
    });

    const raw = await searchRes.text();

    if (!searchRes.ok) {
      const bodyPreview =
        raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
      const envHint =
        searchRes.status === 401
          ? envKey === "sit"
            ? ` (SIT: check SIT_EMEA_AUTH_RESOURCE matches the SIT policy API audience; if the gateway requires it, set SIT_EMEA_APIM_SUBSCRIPTION_KEY in .env.local)`
            : ` (UAT: check UAT_EMEA_AUTH_RESOURCE and UAT_EMEA_APIM_SUBSCRIPTION_KEY in .env.local)`
          : "";
      const payload: Record<string, unknown> = {
        error: `Policy search failed: ${searchRes.status} ${searchRes.statusText || ""}. ${bodyPreview}`.trim() + envHint,
        status: searchRes.status,
        body: raw,
        envKey,
      };
      if (process.env.NODE_ENV === "development" && searchRes.status === 401) {
        const tokenClaims = accessToken ? decodeTokenPayload(accessToken) : null;
        payload.debug = {
          policyUrl: searchUrl,
          apiversion: policyApiVersion,
          hasApimKey: !!auth.apimSubscriptionKey,
          tokenReceived: !!accessToken,
          resource: auth.resource,
          tokenAudience: tokenClaims?.aud ?? null,
          tokenExp: tokenClaims?.exp ? new Date(tokenClaims.exp * 1000).toISOString() : null,
          requestHeaders: {
            "Content-Type": "application/json",
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            [versionHeaderName]: policyApiVersion,
            Authorization: "Bearer ***",
            "User-Agent": headers["User-Agent"],
            ...(auth.apimSubscriptionKey && { "Ocp-Apim-Subscription-Key": "***" }),
          },
          requestBody: searchBody,
        };
      }
      appendAuditEntry({
        action: "api.policies.search",
        outcome: "failure",
        context: envKey,
        subject,
        details: { status: searchRes.status, bodyPreview: raw.slice(0, 200) },
      });
      return NextResponse.json(payload, { status: 502 });
    }

    // Try to parse JSON but fall back to raw text if parsing fails
    try {
      const json = JSON.parse(raw);
      appendAuditEntry({
        action: "api.policies.search",
        outcome: "success",
        context: envKey,
        subject,
        details: { resultCount: Array.isArray(json?.details) ? json.details.length : "unknown" },
      });
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ raw }, { status: 200 });
    }
  } catch (error) {
    console.error("UAT policy search error", error);
    appendAuditEntry({
      action: "api.policies.search",
      outcome: "failure",
      details: { error: error instanceof Error ? error.message : "Unexpected error" },
    });
    return NextResponse.json(
      { error: "Unexpected error while calling UAT policy APIs." },
      { status: 500 }
    );
  }
}

