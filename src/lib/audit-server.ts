/**
 * Server-only audit logger. Writes to a local file (logs/audit.log).
 * Use from API routes only; do not import in client code.
 */

import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "audit.log");

export type AuditOutcome = "success" | "failure" | "info";

export interface AuditEntry {
  timestamp: string;
  action: string;
  outcome: AuditOutcome;
  details?: string | Record<string, unknown>;
  context?: string;
  /** Optional: e.g. policy number, search query */
  subject?: string;
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatEntry(entry: Omit<AuditEntry, "timestamp">): string {
  const line: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(line) + "\n";
}

/**
 * Append one audit entry to logs/audit.log. Creates logs dir if needed.
 */
export function appendAuditEntry(entry: Omit<AuditEntry, "timestamp">): void {
  try {
    ensureLogDir();
    const line = formatEntry(entry);
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

/**
 * Read the last N lines from the audit log. Returns parsed entries (newest first).
 */
export function readRecentAuditEntries(tail = 200): AuditEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.trim());
    const lastLines = lines.slice(-tail);
    const entries: AuditEntry[] = [];
    for (const line of lastLines) {
      try {
        const parsed = JSON.parse(line) as AuditEntry;
        if (parsed.timestamp) entries.push(parsed);
      } catch {
        // skip malformed lines
      }
    }
    return entries.reverse();
  } catch (err) {
    console.error("[audit] Failed to read audit log:", err);
    return [];
  }
}
