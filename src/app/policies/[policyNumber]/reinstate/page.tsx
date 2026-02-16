"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Reinstate reason codes (Postman: CANCELLEDINERROR). */
const REINSTATE_REASONS = [
  { value: "CANCELLEDINERROR", label: "Cancelled in error" },
  { value: "CUSTOMER_REQUEST", label: "Customer request" },
  { value: "OTHER", label: "Other" },
];

interface PolicyBasic {
  policyNumber?: string;
  effectiveDate?: string;
  country?: { id?: string; label?: string };
}

export default function PolicyReinstatePage() {
  const params = useParams();
  const router = useRouter();
  const policyNumber =
    typeof params.policyNumber === "string"
      ? decodeURIComponent(params.policyNumber)
      : "";

  const [policy, setPolicy] = useState<PolicyBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchPolicy = useCallback(async () => {
    if (!policyNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/policies/detail?policyNumber=${encodeURIComponent(policyNumber)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || `Failed to load policy (${res.status})`);
      }
      const data = (await res.json()) as PolicyBasic & { basicInfo?: PolicyBasic };
      const bi = data.basicInfo ?? data;
      setPolicy({
        policyNumber: bi.policyNumber ?? data.policyNumber ?? policyNumber,
        effectiveDate: bi.effectiveDate ?? (data as { effectiveDate?: string }).effectiveDate,
        country: bi.country ?? (data as { country?: { id?: string; label?: string } }).country,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policy");
      setPolicy({ policyNumber, effectiveDate: undefined, country: undefined });
    } finally {
      setLoading(false);
    }
  }, [policyNumber]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSubmit = async () => {
    if (!policyNumber || !reasonCode.trim()) {
      setSubmitError("Reason is required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const effectiveDate =
      policy?.effectiveDate ?? new Date().toISOString().slice(0, 10);
    const countryCode =
      (policy?.country?.id ?? policy?.country?.label ?? "CH").toString().slice(0, 2) || "CH";
    try {
      const res = await fetch("/api/policies/reinstate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policyNumber,
          countryCode,
          language: "en",
          isAsyncEnabled: true,
          effectiveDate,
          reasonCode: reasonCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data.error as string) ?? `Reinstate failed (${res.status})`);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/policies/${encodeURIComponent(policyNumber)}`);
      }, 1500);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Reinstate failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!policyNumber) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/policies">Back to policies</Link>
          </Button>
        </div>
        <p className="text-muted-foreground">Missing policy number.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/policies/${encodeURIComponent(policyNumber)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to policy
            </Link>
          </Button>
        </div>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading policy…
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/policies/${encodeURIComponent(policyNumber)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to policy
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/policies/${encodeURIComponent(policyNumber)}`}>Cancel</Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <RotateCcw className="h-7 w-7" />
          Reinstate policy
        </h1>
        <p className="mt-1 font-mono text-muted-foreground">{policyNumber}</p>
      </div>

      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle>Review reinstate</CardTitle>
          <CardDescription>
            Confirm the policy and reason below. This will reinstate the cancelled policy (POST /policy/policies/reinstate).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex gap-2 flex-wrap">
              <span className="text-muted-foreground shrink-0">Policy:</span>
              <span className="font-mono">{policy?.policyNumber ?? policyNumber}</span>
              {policy?.effectiveDate && (
                <span className="text-muted-foreground">· Effective {policy.effectiveDate}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">You can still complete the form below and try to submit.</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reinstate details</CardTitle>
          <CardDescription>Complete the required fields before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reinstate-reason">Reason *</Label>
            <Select value={reasonCode || undefined} onValueChange={setReasonCode}>
              <SelectTrigger id="reinstate-reason">
                <SelectValue placeholder="Select the reason" />
              </SelectTrigger>
              <SelectContent>
                {REINSTATE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {submitError && (
            <div className="space-y-1">
              <p className="text-sm text-destructive">{submitError}</p>
              {(submitError.includes("workflow") || submitError.includes("journey")) && (
                <p className="text-xs text-muted-foreground">
                  This usually means no reinstate workflow is defined for this policy’s journey in the current environment (e.g. SIT). Try another environment or contact the backend team.
                </p>
              )}
            </div>
          )}
          {submitSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Policy reinstated successfully. Redirecting…</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={submitting || !reasonCode.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Reinstate policy"
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/policies/${encodeURIComponent(policyNumber)}`}>Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
