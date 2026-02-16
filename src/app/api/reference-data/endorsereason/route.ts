import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";

/** Reference data item for endorsement reason (description/code) */
export interface EndorsereasonItem {
  code?: string;
  description?: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country") ?? "";
  const language = req.nextUrl.searchParams.get("language") ?? "en";
  const requestId = req.nextUrl.searchParams.get("requestId") ?? "";

  const envKey = getEnvKeyFromRequest(req.cookies.get(ENV_COOKIE_NAME)?.value);
  const urls = getEnvUrls(envKey);
  const auth = getEnvAuth(envKey);
  const policyBaseUrl = urls.apiBaseUrl;

  if (!auth.authUrl || !auth.resource || !auth.appId || !auth.appKey || !policyBaseUrl) {
    return NextResponse.json(
      {
        error: `Environment "${envKey}" is not fully configured. Set auth and API base URL in .env.local.`,
        envKey,
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
      return NextResponse.json(
        { error: "Failed to obtain access token for reference data.", envKey },
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

    const baseOrigin = new URL(policyBaseUrl).origin;
    const params = new URLSearchParams();
    if (requestId) params.set("requestId", requestId);
    params.set("country", country || "CH");
    params.set("language", language);
    const refUrl = `${baseOrigin}/reference-data/ENDORSEREASON?${params.toString()}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Canvas-Module": "CSC",
      Authorization: `Bearer ${accessToken}`,
    };
    if (auth.apimSubscriptionKey) {
      headers["Ocp-Apim-Subscription-Key"] = auth.apimSubscriptionKey;
    }

    const refRes = await fetch(refUrl, { headers });

    if (!refRes.ok) {
      const text = await refRes.text();
      let message = "Failed to fetch endorsement reasons.";
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (typeof parsed?.message === "string") message = parsed.message;
      } catch {
        // use default
      }
      if (refRes.status === 404) {
        message = "Endorsement reasons reference data is not available for this environment (404). You can enter a reason manually on the form.";
      }
      return NextResponse.json(
        { error: message, status: refRes.status, envKey },
        { status: refRes.status >= 400 ? refRes.status : 502 }
      );
    }

    const data = await refRes.json();
    const items: EndorsereasonItem[] = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
    return NextResponse.json(Array.isArray(items) ? items : []);
  } catch (err) {
    console.error("Reference data ENDORSEREASON error", err);
    return NextResponse.json(
      { error: "Unexpected error while fetching reference data.", envKey },
      { status: 500 }
    );
  }
}
