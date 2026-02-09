import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";
import { appendAuditEntry } from "@/lib/audit-server";

interface TokenResponse {
  access_token?: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || null;
  const searchTypeParam = req.nextUrl.searchParams.get("searchType") || null;

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q' (search term for customer name, email, etc.)." },
      { status: 400 }
    );
  }

  const envKey = getEnvKeyFromRequest(req.cookies.get(ENV_COOKIE_NAME)?.value);
  const urls = getEnvUrls(envKey);
  const auth = getEnvAuth(envKey);
  const apiBaseUrl = urls.apiBaseUrl;

  if (!auth.authUrl || !auth.resource || !auth.appId || !auth.appKey || !apiBaseUrl) {
    return NextResponse.json(
      {
        error:
          `Environment "${envKey}" is not fully configured. Set auth and API base URL for the selected environment in .env.local.`,
      },
      { status: 500 }
    );
  }

  try {
    const tokenRes = await fetch(auth.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiVersion: auth.authApiVersion,
        Resource: auth.resource,
        App_ID: auth.appId,
        App_Key: auth.appKey,
      },
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      return NextResponse.json(
        {
          error: "Failed to obtain access token from authorization endpoint.",
          status: tokenRes.status,
          body,
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

    const policyApiVersion =
      envKey === "sit"
        ? process.env.SIT_POLICY_API_VERSION ||
          process.env.POLICY_API_VERSION ||
          "2"
        : process.env.UAT_POLICY_API_VERSION ||
          process.env.POLICY_API_VERSION ||
          "2";
    const versionHeaderName =
      process.env.POLICY_API_VERSION_HEADER || "apiversion";

    const searchUrl = `${apiBaseUrl}/policy/customers/search`;
    // Match Postman: impersonateId, searchType (e.g. "AccountID"), searchValue (camelCase).
    // API enum CustomerSearchType expects "AccountID" (not "ByEmail" / "ByAccountId").
    const searchType =
      searchTypeParam ||
      process.env.CUSTOMERS_SEARCH_TYPE ||
      "AccountID";
    const searchBody = {
      impersonateId: auth.impersonateId,
      language: "en",
      searchType,
      searchValue: q,
    };

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
      console.log("[customers/search]", envKey, "searchUrl:", searchUrl, "q:", q, "searchType:", searchType);
    }

    const searchRes = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(searchBody),
    });

    const raw = await searchRes.text();

    if (!searchRes.ok) {
      const bodyPreview = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
      const envHint =
        searchRes.status === 401
          ? envKey === "sit"
            ? ` (SIT: check SIT_EMEA_AUTH_RESOURCE and SIT_EMEA_APIM_SUBSCRIPTION_KEY in .env.local)`
            : ` (UAT: check UAT_EMEA_AUTH_RESOURCE and UAT_EMEA_APIM_SUBSCRIPTION_KEY in .env.local)`
          : "";
      appendAuditEntry({
        action: "api.customers.search",
        outcome: "failure",
        context: envKey,
        subject: q,
        details: { status: searchRes.status, bodyPreview: raw.slice(0, 200) },
      });
      return NextResponse.json(
        {
          error: `Customers search failed: ${searchRes.status} ${searchRes.statusText || ""}. ${bodyPreview}`.trim() + envHint,
          status: searchRes.status,
          body: raw,
          envKey,
        },
        { status: 502 }
      );
    }

    try {
      const json = JSON.parse(raw);
      const list = (json as { customerSearchList?: unknown[] }).customerSearchList;
      const resultCount = Array.isArray(list) ? list.length : Array.isArray((json as { details?: unknown[] }).details) ? (json as { details: unknown[] }).details.length : Array.isArray((json as { customers?: unknown[] }).customers) ? (json as { customers: unknown[] }).customers.length : "unknown";
      appendAuditEntry({
        action: "api.customers.search",
        outcome: "success",
        context: envKey,
        subject: q,
        details: { resultCount },
      });
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ raw }, { status: 200 });
    }
  } catch (error) {
    console.error("Customers search error", error);
    appendAuditEntry({
      action: "api.customers.search",
      outcome: "failure",
      subject: q ?? undefined,
      details: { error: error instanceof Error ? error.message : "Unexpected error" },
    });
    return NextResponse.json(
      { error: "Unexpected error while calling customers search API." },
      { status: 500 }
    );
  }
}
