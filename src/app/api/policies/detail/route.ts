import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";
import { appendAuditEntry } from "@/lib/audit-server";

interface TokenResponse {
  access_token?: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const policyNumber = req.nextUrl.searchParams.get("policyNumber");

  if (!policyNumber) {
    return NextResponse.json(
      { error: "Missing required query parameter 'policyNumber'" },
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
          `Environment "${envKey}" is not fully configured. Set auth (AUTH_URL, AUTH_RESOURCE, AUTH_APP_ID, AUTH_APP_KEY) and API base URL for the selected environment in .env.local.`,
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
          error:
            "Failed to obtain access token from UAT authorization endpoint.",
          status: tokenRes.status,
          body,
        },
        { status: 502 }
      );
    }

    const tokenJson = (await tokenRes.json()) as TokenResponse;
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authorization endpoint did not return access_token." },
        { status: 502 }
      );
    }

    // Step 2: call policy search / detail API.
    // For now we reuse the search endpoint but filter by policy number.
    // If there is a dedicated "get policy details" endpoint, point to it here.
    const searchBody = {
      impersonateID: auth.impersonateId,
      language: "en",
      searchvalue: policyNumber,
      person: {},
      searchType: "ByPolicyNumber",
      resultType: "Detailed",
    };

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
    const searchRes = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(searchBody),
    });

    const raw = await searchRes.text();

    if (!searchRes.ok) {
      const envHint =
        searchRes.status === 401
          ? ` Environment: ${envKey}. If you switched env, ensure the env cookie is sent and auth resource/API base match.`
          : "";
      appendAuditEntry({
        action: "api.policies.detail",
        outcome: "failure",
        context: envKey,
        subject: policyNumber,
        details: { status: searchRes.status },
      });
      return NextResponse.json(
        {
          error: `UAT policy detail lookup returned ${searchRes.status} ${searchRes.statusText || ""}. ${(raw.length > 200 ? raw.slice(0, 200) + "…" : raw).trim()}${envHint}`.trim(),
          status: searchRes.status,
          body: raw,
          envKey,
        },
        { status: 502 }
      );
    }

    // Try to parse JSON and return only the first matching detail record
    try {
      const json = JSON.parse(raw) as any;
      const details: any[] = Array.isArray(json?.details)
        ? json.details
        : Array.isArray(json?.policies)
        ? json.policies
        : Array.isArray(json)
        ? json
        : [];

      if (!details.length) {
        appendAuditEntry({
          action: "api.policies.detail",
          outcome: "failure",
          context: envKey,
          subject: policyNumber,
          details: { reason: "no details found", status: 404 },
        });
        return NextResponse.json(
          {
            error: `No policy details found for policyNumber '${policyNumber}'.`,
          },
          { status: 404 }
        );
      }

      appendAuditEntry({
        action: "api.policies.detail",
        outcome: "success",
        context: envKey,
        subject: policyNumber,
      });
      return NextResponse.json(details[0]);
    } catch {
      // Fallback to raw text if parsing fails
      return NextResponse.json({ raw }, { status: 200 });
    }
  } catch (error) {
    console.error("UAT policy detail error", error);
    appendAuditEntry({
      action: "api.policies.detail",
      outcome: "failure",
      subject: policyNumber,
      details: { error: error instanceof Error ? error.message : "Unexpected error" },
    });
    return NextResponse.json(
      { error: "Unexpected error while calling UAT policy detail API." },
      { status: 500 }
    );
  }
}

