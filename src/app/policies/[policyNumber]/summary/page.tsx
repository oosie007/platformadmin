"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildMinimalEndorseRequest,
  correspondenceToRequest,
  normalizeEndorsementReason,
  type PolicyDetailForEndorse,
  type EndorseRequest,
} from "@/lib/csc-endorsements";
import type { EndorseResponse } from "@/lib/csc-endorsements";
import { CscEndorsementLabels } from "../../../../../csc-financial-endorsements/constants";

const ENDORSEMENT_DRAFT_KEY = "platformadmin-endorsement-draft";

/** Fallback when reference data ENDORSEREASON is not available (e.g. 404 in SIT). */
const DEFAULT_ENDORSEMENT_REASONS = [
  { value: "Post-Conversion Policy Update", label: "Post-Conversion Policy Update" },
  { value: "Customer Request", label: "Customer Request" },
  { value: "Correction", label: "Correction" },
  { value: "Address Change", label: "Address Change" },
  { value: "Name Change", label: "Name Change" },
  { value: "Other", label: "Other" },
];

const CORRESPONDENCE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "Suppress all correspondence", label: "Suppress all correspondence" },
  { value: "Force print only", label: "Force print only" },
] as const;

export default function PolicySummaryPage() {
  const params = useParams();
  const router = useRouter();
  const policyNumber =
    typeof params.policyNumber === "string"
      ? decodeURIComponent(params.policyNumber)
      : "";

  const [policy, setPolicy] = useState<PolicyDetailForEndorse | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState<string | null>(null);

  const [preview, setPreview] = useState<EndorseResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [reasonOptions, setReasonOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [reasonOptionsLoading, setReasonOptionsLoading] = useState(true);
  const [reasonOptionsError, setReasonOptionsError] = useState<string | null>(null);

  const [endorseReason, setEndorseReason] = useState("");
  /** When reference data fails, user can type reason manually */
  const [reasonFreeText, setReasonFreeText] = useState("");
  const [correspondence, setCorrespondence] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchPolicy = useCallback(async () => {
    if (!policyNumber) return;
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const res = await fetch(
        `/api/policies/detail?policyNumber=${encodeURIComponent(policyNumber)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || `Failed to load policy (${res.status})`);
      }
      const data = await res.json();
      setPolicy(data as PolicyDetailForEndorse);
    } catch (e) {
      setPolicyError(e instanceof Error ? e.message : "Failed to load policy.");
      setPolicy(null);
    } finally {
      setPolicyLoading(false);
    }
  }, [policyNumber]);

  const fetchPreview = useCallback(async (requestBody: EndorseRequest) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/policies/endorsements?isPreview=true", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error;
        if (typeof msg === "string" && msg.startsWith("{")) {
          try {
            const parsed = JSON.parse(msg) as { message?: string };
            msg = parsed.message ?? msg;
          } catch {
            // use as-is
          }
        }
        throw new Error((typeof msg === "string" ? msg : undefined) || `Preview failed (${res.status})`);
      }
      setPreview(data as EndorseResponse);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed.");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const fetchReasonOptions = useCallback(async () => {
    setReasonOptionsLoading(true);
    setReasonOptionsError(null);
    try {
      const res = await fetch("/api/reference-data/endorsereason?country=CH&language=en", {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || "Failed to load reasons");
      }
      const items = (await res.json()) as Array<{ code?: string; description?: string }>;
      setReasonOptions(
        (Array.isArray(items) ? items : []).map((item) => ({
          value: item.description ?? item.code ?? "",
          label: item.description ?? item.code ?? "—",
        }))
      );
    } catch (e) {
      setReasonOptionsError(e instanceof Error ? e.message : CscEndorsementLabels.fetchRefDataFailureMessage);
      setReasonOptions([]);
    } finally {
      setReasonOptionsLoading(false);
    }
  }, []);

  /** Try to load endorsement draft from sessionStorage (edited state from endorse page) */
  useEffect(() => {
    if (!policyNumber) return;
    try {
      const key = `${ENDORSEMENT_DRAFT_KEY}-${encodeURIComponent(policyNumber)}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw) as PolicyDetailForEndorse;
        if (draft?.basicInfo?.policyNumber) {
          setPolicy(draft);
          setPolicyLoading(false);
          setPolicyError(null);
          return;
        }
      }
    } catch {
      // fall through to fetch
    }
    fetchPolicy();
  }, [policyNumber, fetchPolicy]);

  useEffect(() => {
    fetchReasonOptions();
  }, [fetchReasonOptions]);

  useEffect(() => {
    if (!policy || policyLoading) return;
    const req = buildMinimalEndorseRequest(policy, "");
    if (!req) return;
    fetchPreview(req);
  }, [policy, policyLoading, fetchPreview]);

  const handleSubmit = async () => {
    const req = buildMinimalEndorseRequest(policy ?? null, "");
    if (!req) {
      setSubmitError("Policy data is missing.");
      return;
    }
    const reasonValue = endorseReason.trim() || reasonFreeText.trim();
    if (!reasonValue) {
      setSubmitError("Reason is Required.");
      return;
    }
    if (!correspondence.trim()) {
      setSubmitError("Correspondence is Required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const { configuration, sendCorrespondence } = correspondenceToRequest(correspondence);
    const body: EndorseRequest = {
      ...req,
      endorsementReason: normalizeEndorsementReason(reasonValue),
      description: notes.trim() || undefined,
      configuration,
      sendCorrespondence,
    };

    try {
      const res = await fetch("/api/policies/endorsements?isPreview=false", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = (data.error as string) ?? (data.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : `Submit failed (${res.status})`);
        throw new Error(errMsg);
      }
      setSubmitSuccess(true);
      try {
        sessionStorage.removeItem(`${ENDORSEMENT_DRAFT_KEY}-${encodeURIComponent(policyNumber)}`);
      } catch {
        // ignore
      }
      setTimeout(() => {
        router.push(`/policies/${encodeURIComponent(policyNumber)}`);
      }, 1500);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const formValid = (endorseReason.trim() || reasonFreeText.trim()) && correspondence.trim();

  if (!policyNumber) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/policies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to policies
          </Link>
        </Button>
        <p className="text-muted-foreground">Missing policy number.</p>
      </div>
    );
  }

  if (policyLoading || policyError) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/policies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to policies
          </Link>
        </Button>
        {policyLoading && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading policy…
          </p>
        )}
        {policyError && (
          <p className="text-destructive">{policyError}</p>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Review changes
          </h1>
          <p className="mt-1 font-mono text-muted-foreground">
            {policyNumber}
          </p>
        </div>

        {policy && (
          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle>Changes to apply</CardTitle>
              <CardDescription>
                The following data will be sent with your endorsement. Confirm names and details are correct before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">Policy:</span>
                  <span className="font-mono">{policy.basicInfo?.policyNumber ?? policyNumber}</span>
                  {policy.basicInfo?.effectiveDate && (
                    <span className="text-muted-foreground">· Effective {policy.basicInfo.effectiveDate}</span>
                  )}
                </div>
              </div>
              {Array.isArray(policy.insureds) && policy.insureds.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Insured individuals
                  </p>
                  <ul className="list-none space-y-1.5 rounded-md border border-border bg-muted/20 p-3">
                    {policy.insureds.map((ins, idx) => (
                      <li key={idx} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                        <span className="font-medium">
                          {[ins.firstName, ins.lastName].filter(Boolean).join(" ") || "—"}
                        </span>
                        {ins.insuredType && (
                          <span className="text-muted-foreground">{ins.insuredType}</span>
                        )}
                        {ins.accountId && (
                          <span className="font-mono text-muted-foreground text-xs">ID: {ins.accountId}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(policy.insObjsResp) && policy.insObjsResp.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Insured objects
                  </p>
                  <ul className="list-none space-y-1.5 rounded-md border border-border bg-muted/20 p-3">
                    {policy.insObjsResp.map((obj, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="font-mono">{obj.objectId ?? "—"}</span>
                        {obj.insuredObjType?.label != null && (
                          <span className="text-muted-foreground ml-2">· {obj.insuredObjType.label}</span>
                        )}
                        {(obj.sumInsured != null || obj.totalPremium != null) && (
                          <span className="text-muted-foreground ml-2">
                            · Sum insured: {obj.sumInsured ?? "—"} · Premium: {obj.totalPremium ?? "—"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!policy.insureds?.length && !policy.insObjsResp?.length && (
                <p className="text-sm text-muted-foreground">
                  No insured individuals or objects in this request. Other changes (e.g. rating factors, coverage) are included in the payload.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {previewLoading && (
          <Card className="mb-6 border-border bg-card">
            <CardContent className="flex items-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading endorsement preview…</span>
            </CardContent>
          </Card>
        )}

        {previewError && (
          <Card className="mb-6 border-border bg-card">
            <CardContent className="py-4 space-y-2">
              <p className="text-sm text-destructive">{previewError}</p>
              <p className="text-sm text-muted-foreground">
                You can still complete the form below and try to submit.
              </p>
            </CardContent>
          </Card>
        )}

        {preview && !previewLoading && (
          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle>Premium preview</CardTitle>
              <CardDescription>
                Current vs endorsement vs next bill.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {preview.premiums?.active != null && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {preview.premiums.active.totalPremium != null
                        ? String(preview.premiums.active.totalPremium)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{preview.currency}</p>
                  </div>
                )}
                {preview.premiums?.endorsement != null && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Endorsement</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {preview.premiums.endorsement.totalPremium != null
                        ? String(preview.premiums.endorsement.totalPremium)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{preview.currency}</p>
                  </div>
                )}
                {preview.premiums?.adjustment != null && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Adjustment</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {preview.premiums.adjustment.totalPremium != null
                        ? String(preview.premiums.adjustment.totalPremium)
                        : "—"}
                    </p>
                  </div>
                )}
                {preview.premiums?.nextBill != null && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Next bill</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {preview.premiums.nextBill.totalPremium != null
                        ? String(preview.premiums.nextBill.totalPremium)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{preview.currency}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Endorsement details</CardTitle>
            <CardDescription>
              Complete the required fields before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submitSuccess && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm font-medium text-green-700 dark:text-green-400">
                {CscEndorsementLabels.endorseMentSuccess}
              </div>
            )}

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endorseReason">Endorsement reason *</Label>
                {(reasonOptions.length > 0 || reasonOptionsError) ? (
                  <Select
                    value={endorseReason || reasonFreeText || undefined}
                    onValueChange={(v) => {
                      setEndorseReason(v);
                      setReasonFreeText("");
                    }}
                    disabled={reasonOptionsLoading}
                  >
                    <SelectTrigger id="endorseReason" className="w-full">
                      <SelectValue placeholder="Select the reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {(reasonOptions.length > 0 ? reasonOptions : DEFAULT_ENDORSEMENT_REASONS).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="endorseReason"
                    placeholder="Enter endorsement reason (e.g. Post-Conversion Policy Update)"
                    value={reasonFreeText}
                    onChange={(e) => setReasonFreeText(e.target.value)}
                    className="bg-background"
                  />
                )}
                {reasonOptionsError && (
                  <p className="text-xs text-muted-foreground">
                    {reasonOptionsError} Using common reasons below; select one to continue.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="correspondence">Correspondence *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help text-xs">(?)</span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs">
                      Default – Triggers matching fulfilment rules. Suppress all – No documents or fulfillment. Force print only – Documents to print queue only.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={correspondence} onValueChange={setCorrespondence}>
                  <SelectTrigger id="correspondence" className="w-full">
                    <SelectValue placeholder="Select the reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {CORRESPONDENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Write a note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!formValid || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  CscEndorsementLabels.saveChanges
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/policies/${encodeURIComponent(policyNumber)}`}>
                  Cancel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
