"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditEntry {
  timestamp: string;
  action: string;
  outcome: string;
  details?: string | Record<string, unknown>;
  context?: string;
  subject?: string;
}

export default function SettingsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audit?tail=300", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load audit log");
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Audit logging and application settings.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            All actions and outcomes are logged to a local file. Log file path:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              logs/audit.log
            </code>
            {" "}(relative to the project root). No database is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAudit}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Showing latest {entries.length} entries (newest first).
            </span>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="rounded-lg border border-border bg-muted/20 max-h-[60vh] overflow-auto">
            {entries.length === 0 && !loading && !error && (
              <p className="p-4 text-sm text-muted-foreground text-center">
                No audit entries yet. Perform a search or change the environment to generate log entries.
              </p>
            )}
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border">
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Outcome</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Subject / Context</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{e.action ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.outcome === "success"
                            ? "default"
                            : e.outcome === "failure"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {e.outcome ?? "info"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.subject ?? "—"}
                      {e.context && (
                        <span className="ml-1 text-xs">({e.context})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs max-w-[200px] truncate">
                      {e.details == null
                        ? "—"
                        : typeof e.details === "string"
                          ? e.details
                          : JSON.stringify(e.details)}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TableCell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <td className={className ?? "p-2"}>{children}</td>;
}
