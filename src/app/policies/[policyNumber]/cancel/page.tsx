"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
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

/** Cancel reason codes (Postman: POL_REP). */
const CANCEL_REASONS = [
  { value: "POL_REP", label: "Policy replacement" },
  { value: "CUSTOMER_REQUEST", label: "Customer request" },
  { value: "NON_PAYMENT", label: "Non-payment" },
  { value: "OTHER", label: "Other" },
];

interface PolicyBasic {
  policyNumber?: string;
  effectiveDate?: string;
  country?: { id?: string; label?: string };
}

export default function PolicyCancelPage() {
  const params = useParams();
  const router = useRouter();
  const policyNumber =
    typeof params.policyNumber === "string"
      ? decodeURIComponent(params.policyNumber)
      : "";

  const [policy, setPolicy] = useState<PolicyBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
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
    if (!policyNumber || !reason.trim()) {
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
      const res = await fetch("/api/policies/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policyNumber,
          effectiveDate,
          countryCode,
          language: "en",
          isRequireRefund: true,
          reason: reason.trim(),
          taxcode: "ALL_TAX",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data.error as string) ?? `Cancel failed (${res.status})`);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/policies/${encodeURIComponent(policyNumber)}`);
      }, 1500);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Cancel failed.");
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
          <XCircle className="h-7 w-7" />
          Cancel policy
        </h1>
        <p className="mt-1 font-mono text-muted-foreground">{policyNumber}</p>
      </div>

      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle>Review cancel</CardTitle>
          <CardDescription>
            Confirm the policy and reason below. This will cancel the policy (POST /policy/policies/cancel).
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
          <CardTitle>Cancel details</CardTitle>
          <CardDescription>Complete the required fields before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason *</Label>
            <Select value={reason || undefined} onValueChange={setReason}>
              <SelectTrigger id="cancel-reason">
                <SelectValue placeholder="Select the reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          {submitSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Policy cancelled successfully. Redirecting…</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={submitting || !reason.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Cancel policy"
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
