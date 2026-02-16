import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";
import { appendAuditEntry } from "@/lib/audit-server";

export async function PATCH(req: NextRequest) {
  const isPreviewParam = req.nextUrl.searchParams.get("isPreview");
  const isPreview = isPreviewParam === "true";

  const envKey = getEnvKeyFromRequest(req.cookies.get(ENV_COOKIE_NAME)?.value);
  const urls = getEnvUrls(envKey);
  const auth = getEnvAuth(envKey);
  const policyBaseUrl = urls.apiBaseUrl;

  if (!auth.authUrl || !auth.resource || !auth.appId || !auth.appKey || !policyBaseUrl) {
    return NextResponse.json(
      {
        error: `Environment "${envKey}" is not fully configured. Set auth and API base URL for the selected environment in .env.local.`,
        envKey,
      },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
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
      const text = await tokenRes.text();
      return NextResponse.json(
        {
          error: "Failed to obtain access token for endorsement API.",
          status: tokenRes.status,
          envKey,
        },
        { status: 502 }
      );
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string; accessToken?: string };
    const accessToken =
      tokenJson.access_token ?? tokenJson.accessToken ?? undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token in auth response.", envKey },
        { status: 502 }
      );
    }

    // Endorsement API: same base as policy API (URL2 in Postman). Path: /policy/endorsements (see Monzo UAT Postman collection).
    const endorsementBase = urls.endorsementApiBaseUrl ?? policyBaseUrl;
    const endorsementUrl = `${endorsementBase.replace(/\/$/, "")}/policy/endorsements?isPreview=${isPreview}${isPreview ? "&saveQuote=true" : ""}`;

    const policyApiVersion =
      envKey === "sit"
        ? process.env.SIT_POLICY_API_VERSION ?? process.env.POLICY_API_VERSION ?? "2"
        : process.env.UAT_POLICY_API_VERSION ?? process.env.POLICY_API_VERSION ?? "2";
    const versionHeaderName = process.env.POLICY_API_VERSION_HEADER ?? "apiversion";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      [versionHeaderName]: String(policyApiVersion),
      Authorization: `Bearer ${accessToken}`,
    };
    if (auth.apimSubscriptionKey) {
      headers["Ocp-Apim-Subscription-Key"] = auth.apimSubscriptionKey;
    }

    const endorseRes = await fetch(endorsementUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const raw = await endorseRes.text();

    if (!endorseRes.ok) {
      let errorMessage: string = raw || endorseRes.statusText;
      try {
        const parsed = JSON.parse(raw) as {
          errors?: Record<string, string[]>;
          message?: string;
          statusCode?: number;
        };
        if (parsed?.errors && typeof parsed.errors === "object") {
          const firstKey = Object.keys(parsed.errors)[0];
          errorMessage = firstKey ? parsed.errors[firstKey]?.[0] ?? errorMessage : errorMessage;
        } else if (typeof parsed?.message === "string") {
          errorMessage = parsed.message;
        }
      } catch {
        // use raw
      }
      if (endorseRes.status === 404) {
        errorMessage =
          "Endorsement API returned 404. The endpoint may not be available in this environment (e.g. SIT). " +
          (errorMessage ? `Upstream: ${errorMessage}` : "");
      }
      const errorPayload = { error: errorMessage, status: endorseRes.status, envKey };
      appendAuditEntry({
        action: "api.policies.endorsements",
        outcome: "failure",
        context: envKey,
        subject: (body as { policyNumber?: string })?.policyNumber,
        details: { isPreview, status: endorseRes.status },
      });
      return NextResponse.json(errorPayload, { status: endorseRes.status >= 400 && endorseRes.status < 600 ? endorseRes.status : 502 });
    }

    let json: unknown;
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = { raw };
    }

    appendAuditEntry({
      action: "api.policies.endorsements",
      outcome: "success",
      context: envKey,
      subject: (body as { policyNumber?: string })?.policyNumber,
      details: { isPreview },
    });
    return NextResponse.json(json);
  } catch (err) {
    console.error("Endorsement API error", err);
    appendAuditEntry({
      action: "api.policies.endorsements",
      outcome: "failure",
      details: { error: err instanceof Error ? err.message : "Unexpected error" },
    });
    return NextResponse.json(
      { error: "Unexpected error while calling endorsement API.", envKey },
      { status: 500 }
    );
  }
}
