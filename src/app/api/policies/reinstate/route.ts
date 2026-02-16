import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";

/** Reinstate request body (Postman: Monzo UAT – 29.Reinstatement). POST .../policy/policies/reinstate */
export interface ReinstateRequestBody {
  policyNumber: string;
  impersonateId?: string;
  countryCode: string;
  language: string;
  isAsyncEnabled?: boolean;
  effectiveDate: string;
  reasonCode: string;
}

export async function POST(req: NextRequest) {
  const envKey = getEnvKeyFromRequest(req.cookies.get(ENV_COOKIE_NAME)?.value);
  const urls = getEnvUrls(envKey);
  const auth = getEnvAuth(envKey);
  const policyBaseUrl = urls.apiBaseUrl;

  if (!auth.authUrl || !auth.resource || !auth.appId || !auth.appKey || !policyBaseUrl) {
    return NextResponse.json(
      { error: `Environment "${envKey}" is not fully configured. Set auth and API base URL in .env.local.`, envKey },
      { status: 500 }
    );
  }

  let body: ReinstateRequestBody & Record<string, unknown>;
  try {
    body = (await req.json()) as ReinstateRequestBody & Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.policyNumber) {
    return NextResponse.json({ error: "policyNumber is required." }, { status: 400 });
  }

  if (!body.impersonateId && auth.impersonateId) {
    body = { ...body, impersonateId: auth.impersonateId };
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
      return NextResponse.json(
        { error: "Failed to obtain access token.", envKey },
        { status: 502 }
      );
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string; accessToken?: string };
    const accessToken = tokenJson.access_token ?? tokenJson.accessToken ?? undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token in auth response.", envKey },
        { status: 502 }
      );
    }

    const policyApiVersion =
      envKey === "sit"
        ? process.env.SIT_POLICY_API_VERSION ?? process.env.POLICY_API_VERSION ?? "2"
        : process.env.UAT_POLICY_API_VERSION ?? process.env.POLICY_API_VERSION ?? "2";
    const versionHeaderName = process.env.POLICY_API_VERSION_HEADER ?? "apiversion";

    const reinstateUrl = `${policyBaseUrl.replace(/\/$/, "")}/policy/policies/reinstate`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      [versionHeaderName]: String(policyApiVersion),
      Authorization: `Bearer ${accessToken}`,
    };
    if (auth.apimSubscriptionKey) {
      headers["Ocp-Apim-Subscription-Key"] = auth.apimSubscriptionKey;
    }

    const payload = {
      policyNumber: body.policyNumber,
      impersonateId: body.impersonateId ?? auth.impersonateId ?? "",
      countryCode: body.countryCode ?? "CH",
      language: body.language ?? "en",
      isAsyncEnabled: body.isAsyncEnabled ?? true,
      effectiveDate: body.effectiveDate ?? new Date().toISOString().slice(0, 10),
      reasonCode: body.reasonCode ?? "CANCELLEDINERROR",
    };

    const reinstateRes = await fetch(reinstateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const raw = await reinstateRes.text();

    /** Extract a clean error message from backend body (may be plain JSON or "RNS Activation Call Failed with - {...}"). */
    function extractReinstateError(text: string): string {
      let parsed: { message?: string; errors?: Record<string, unknown[]> } | null = null;
      try {
        parsed = JSON.parse(text) as { message?: string; errors?: Record<string, unknown[]> };
      } catch {
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as { message?: string; errors?: Record<string, unknown[]> };
          } catch {
            // ignore
          }
        }
      }
      if (parsed?.errors?.JourneyId?.[0] && typeof parsed.errors.JourneyId[0] === "object" && "message" in (parsed.errors.JourneyId[0] as object)) {
        return (parsed.errors.JourneyId[0] as { message?: string }).message ?? parsed?.message ?? text;
      }
      if (typeof parsed?.message === "string") return parsed.message;
      return text;
    }

    if (!reinstateRes.ok) {
      const errorMessage = extractReinstateError(raw || reinstateRes.statusText);
      return NextResponse.json(
        { error: errorMessage, status: reinstateRes.status, envKey },
        { status: reinstateRes.status >= 400 && reinstateRes.status < 600 ? reinstateRes.status : 502 }
      );
    }

    // Backend may return 200 but body indicates failure (e.g. "RNS Activation Call Failed")
    if (raw && (raw.includes("Activation Call Failed") || raw.includes("BadRequest") || raw.includes("One or more errors"))) {
      return NextResponse.json(
        { error: extractReinstateError(raw), status: 400, envKey },
        { status: 502 }
      );
    }

    let json: unknown;
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = { raw };
    }
    return NextResponse.json(json);
  } catch (err) {
    console.error("Reinstate API error", err);
    return NextResponse.json(
      { error: "Unexpected error while calling reinstate API.", envKey },
      { status: 500 }
    );
  }
}
