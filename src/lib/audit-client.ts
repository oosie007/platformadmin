/**
 * Client-side audit logger. Sends entries to the audit API (writes to local file).
 * Fire-and-forget; does not block the UI.
 */

export type AuditOutcome = "success" | "failure" | "info";

export interface AuditPayload {
  action: string;
  outcome: AuditOutcome;
  details?: string | Record<string, unknown>;
  context?: string;
  subject?: string;
}

export function logAudit(payload: AuditPayload): void {
  if (typeof window === "undefined") return;
  fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  }).catch(() => {
    // ignore network errors for audit
  });
}
