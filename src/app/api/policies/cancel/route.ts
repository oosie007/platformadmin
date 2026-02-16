import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";

/** Cancel request body (Postman: Monzo UAT – Cancel policy). POST .../policy/policies/cancel?preview=false */
export interface CancelRequestBody {
  policyNumber: string;
  effectiveDate: string;
  impersonateId?: string;
  countryCode: string;
  language: string;
  isRequireRefund?: boolean;
  reason: string;
  taxcode?: string;
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

  let body: CancelRequestBody & Record<string, unknown>;
  try {
    body = (await req.json()) as CancelRequestBody & Record<string, unknown>;
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

    const cancelUrl = `${policyBaseUrl.replace(/\/$/, "")}/policy/policies/cancel?preview=false`;
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
      effectiveDate: body.effectiveDate ?? new Date().toISOString().slice(0, 10),
      impersonateId: body.impersonateId ?? auth.impersonateId ?? "",
      countryCode: body.countryCode ?? "CH",
      language: body.language ?? "en",
      isRequireRefund: body.isRequireRefund ?? true,
      reason: body.reason ?? "POL_REP",
      taxcode: body.taxcode ?? "ALL_TAX",
    };

    const cancelRes = await fetch(cancelUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const raw = await cancelRes.text();
    if (!cancelRes.ok) {
      let errorMessage = raw || cancelRes.statusText;
      try {
        const parsed = JSON.parse(raw) as { message?: string; errors?: Record<string, string[]> };
        if (typeof parsed?.message === "string") errorMessage = parsed.message;
        else if (parsed?.errors && typeof parsed.errors === "object") {
          const firstKey = Object.keys(parsed.errors)[0];
          errorMessage = firstKey ? parsed.errors[firstKey]?.[0] ?? errorMessage : errorMessage;
        }
      } catch {
        // use raw
      }
      return NextResponse.json(
        { error: errorMessage, status: cancelRes.status, envKey },
        { status: cancelRes.status >= 400 && cancelRes.status < 600 ? cancelRes.status : 502 }
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
    console.error("Cancel API error", err);
    return NextResponse.json(
      { error: "Unexpected error while calling cancel API.", envKey },
      { status: 500 }
    );
  }
}
