import { NextRequest, NextResponse } from "next/server";
import { getEnvKeyFromRequest, getEnvUrls, getEnvAuth, ENV_COOKIE_NAME } from "@/lib/env-config";

/** Suspend/unsuspend request body (Postman: Monzo UAT – 13.Suspend Policy / 14.UnSuspend Policy). */
export interface SuspendRequestBody {
  policyNumber: string;
  action: "Suspend" | "Activate";
  effectiveDate: string;
  applicationDate: string;
  reason: string;
  shouldGenerateDocument?: boolean;
  impersonateId?: string;
  countryCode: string;
  language: string;
  isAsyncEnabled?: boolean;
  shouldCommit?: boolean;
}

export async function PATCH(req: NextRequest) {
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

  let body: SuspendRequestBody & Record<string, unknown>;
  try {
    body = (await req.json()) as SuspendRequestBody & Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.policyNumber || !body.action) {
    return NextResponse.json(
      { error: "policyNumber and action are required." },
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

    const suspendUrl = `${policyBaseUrl.replace(/\/$/, "")}/policy/policies/suspend`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      [versionHeaderName]: String(policyApiVersion),
      Authorization: `Bearer ${accessToken}`,
    };
    if (auth.apimSubscriptionKey) {
      headers["Ocp-Apim-Subscription-Key"] = auth.apimSubscriptionKey;
    }

    const payload: SuspendRequestBody = {
      policyNumber: body.policyNumber,
      action: body.action === "Activate" ? "Activate" : "Suspend",
      effectiveDate: body.effectiveDate ?? body.applicationDate ?? new Date().toISOString().slice(0, 10),
      applicationDate: body.applicationDate ?? body.effectiveDate ?? new Date().toISOString().slice(0, 10),
      reason: body.reason ?? "GEN_POL",
      shouldGenerateDocument: body.shouldGenerateDocument ?? false,
      impersonateId: body.impersonateId ?? auth.impersonateId ?? "",
      countryCode: body.countryCode ?? "CH",
      language: body.language ?? "en",
      isAsyncEnabled: body.isAsyncEnabled ?? true,
      shouldCommit: body.shouldCommit ?? true,
    };

    const suspendRes = await fetch(suspendUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    const raw = await suspendRes.text();
    if (!suspendRes.ok) {
      let errorMessage = raw || suspendRes.statusText;
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
        { error: errorMessage, status: suspendRes.status, envKey },
        { status: suspendRes.status >= 400 && suspendRes.status < 600 ? suspendRes.status : 502 }
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
    console.error("Suspend API error", err);
    return NextResponse.json(
      { error: "Unexpected error while calling suspend API.", envKey },
      { status: 500 }
    );
  }
}
