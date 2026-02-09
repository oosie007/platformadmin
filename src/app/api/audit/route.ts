import { NextRequest, NextResponse } from "next/server";
import { appendAuditEntry, readRecentAuditEntries, type AuditOutcome } from "@/lib/audit-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      action?: string;
      outcome?: string;
      details?: string | Record<string, unknown>;
      context?: string;
      subject?: string;
    };
    const action = typeof body.action === "string" ? body.action : "unknown";
    const outcome = (typeof body.outcome === "string" && ["success", "failure", "info"].includes(body.outcome)
      ? body.outcome
      : "info") as AuditOutcome;

    appendAuditEntry({
      action,
      outcome,
      details: body.details,
      context: body.context,
      subject: body.subject,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/audit] POST error", err);
    return NextResponse.json({ error: "Failed to write audit entry" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tail = Math.min(
      Math.max(1, parseInt(req.nextUrl.searchParams.get("tail") ?? "200", 10) || 200),
      2000
    );
    const entries = readRecentAuditEntries(tail);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[api/audit] GET error", err);
    return NextResponse.json({ error: "Failed to read audit log" }, { status: 500 });
  }
}
