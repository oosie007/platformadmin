"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const ENDORSEMENT_DRAFT_KEY = "platformadmin-endorsement-draft";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Minimal policy detail shape for endorse page (matches API response) */
interface PolicyDetail {
  basicInfo?: {
    policyNumber?: string;
    status?: string;
    effectiveDate?: string;
    productName?: string;
    [key: string]: unknown;
  };
  insureds?: Array<{
    firstName?: string;
    lastName?: string;
    insuredType?: string;
    accountId?: string;
    coverageVariants?: Array<{
      coverageVariantDesc?: string;
      coverageVariantId?: string;
      sumInsured?: number;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  insObjsResp?: Array<{
    objectId?: string;
    objectType?: string;
    insuredObjType?: { label?: string };
    sumInsured?: number;
    totalPremium?: number;
    customAttributes?: Array<{ attrName?: string; attrValue?: string }>;
    coverageVariants?: Array<{
      coverageVariantDesc?: string;
      coverageVariantId?: string;
      sumInsured?: number;
      totalPremium?: number;
      [key: string]: unknown;
    }>;
    parties?: Array<{ partyType?: { label?: string }; partySubtype?: string; partyAge?: number }>;
    [key: string]: unknown;
  }>;
  ratingFactors?: Array<{ attributeName?: string; name?: string; value?: unknown }>;
  policyAttributes?: { ratingFactors?: Array<{ attributeName?: string; name?: string; value?: unknown }> };
  policyRatingFactors?: Array<{ type?: string; category?: string; value?: unknown }>;
  customAttributes?: Array<{ attrName?: string; attrValue?: string; isRatingFactor?: boolean }>;
  [key: string]: unknown;
}

export default function PolicyEndorsePage() {
  const params = useParams();
  const router = useRouter();
  const policyNumber =
    typeof params.policyNumber === "string"
      ? decodeURIComponent(params.policyNumber)
      : "";

  const [detail, setDetail] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedObjectId, setExpandedObjectId] = useState<string | null>(null);

  /** Which row is being edited (inline form shown) */
  const [editingInsuredIndex, setEditingInsuredIndex] = useState<number | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<{ list: "api"; index: number } | { list: "policy"; index: number } | null>(null);
  const [editingCoverageIndex, setEditingCoverageIndex] = useState<number | null>(null);
  /** Draft values when editing an insured individual */
  const [insuredDraft, setInsuredDraft] = useState<{ firstName: string; lastName: string; insuredType: string; accountId: string } | null>(null);
  /** Draft values when editing an insured object */
  const [objectDraft, setObjectDraft] = useState<{ sumInsured: string; totalPremium: string } | null>(null);
  /** Draft value when editing a rating factor */
  const [ratingDraftValue, setRatingDraftValue] = useState<string>("");
  /** Draft values when editing a coverage row */
  const [coverageDraft, setCoverageDraft] = useState<{ sumInsured: string; premium: string } | null>(null);

  const fetchDetail = useCallback(async () => {
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
      const data = await res.json();
      setDetail(data as PolicyDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policy.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [policyNumber]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const bi = detail?.basicInfo ?? {};
  const insureds = detail?.insureds ?? [];
  const insObjs = detail?.insObjsResp ?? [];
  const ratingFromApi = detail?.ratingFactors ?? detail?.policyAttributes?.ratingFactors ?? [];
  const ratingFromPolicy = detail?.policyRatingFactors ?? [];
  const customAttrs = detail?.customAttributes ?? [];
  const ratingFromCustom = customAttrs.filter((a) => a.isRatingFactor);
  const ratingList = ratingFromApi.length > 0 ? ratingFromApi : ratingFromCustom;
  const hasRating = ratingList.length > 0 || ratingFromPolicy.length > 0;

  /** Coverage rows with source indices for edit */
  const coverageRows = (() => {
    type Row = {
      kind: "person" | "object";
      name: string;
      variant: string;
      code: string;
      sumInsured?: number;
      premium?: number;
      insIndex?: number;
      insCvIndex?: number;
      objIndex?: number;
      objCvIndex?: number;
    };
    const out: Row[] = [];
    insureds.forEach((ins, insIdx) => {
      (ins.coverageVariants ?? []).forEach((cv, cvIdx) => {
        out.push({
          kind: "person",
          name: ([ins.firstName, ins.lastName].filter(Boolean).join(" ") || ins.insuredType) ?? "—",
          variant: cv.coverageVariantDesc ?? cv.coverageVariantId ?? "—",
          code: (cv as { stdCoverage?: { stdCoverageCode?: string } }).stdCoverage?.stdCoverageCode ?? cv.coverageVariantId ?? "—",
          sumInsured: cv.sumInsured,
          premium: (cv as { totalPremium?: number }).totalPremium,
          insIndex: insIdx,
          insCvIndex: cvIdx,
        });
      });
    });
    insObjs.forEach((obj, objIdx) => {
      (obj.coverageVariants ?? []).forEach((cv, cvIdx) => {
        const nameAttr = obj.customAttributes?.find((a) => (a.attrName ?? "").toLowerCase() === "name");
        out.push({
          kind: "object",
          name: nameAttr?.attrValue ?? obj.objectId ?? "—",
          variant: cv.coverageVariantDesc ?? cv.coverageVariantId ?? "—",
          code: (cv as { stdCoverage?: { stdCoverageCode?: string } }).stdCoverage?.stdCoverageCode ?? cv.coverageVariantId ?? "—",
          sumInsured: cv.sumInsured,
          premium: cv.totalPremium,
          objIndex: objIdx,
          objCvIndex: cvIdx,
        });
      });
    });
    return out;
  })();

  if (!policyNumber) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/policies">Back to policies</Link>
        </Button>
        <p className="text-muted-foreground">Missing policy number.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/policies">Back to policies</Link>
        </Button>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading policy…
        </p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/policies">Back to policies</Link>
        </Button>
        <p className="text-destructive">{error ?? "Policy not found."}</p>
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
            if (detail) {
              try {
                sessionStorage.setItem(
                  `${ENDORSEMENT_DRAFT_KEY}-${encodeURIComponent(policyNumber)}`,
                  JSON.stringify(detail)
                );
              } catch {
                // ignore quota / private mode
              }
            }
            router.push(`/policies/${encodeURIComponent(policyNumber)}/summary`);
          }}
        >
          Review changes
        </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/policies/${encodeURIComponent(policyNumber)}`}>Cancel</Link>
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Update policy (endorsement)
        </h1>
        <p className="mt-1 font-mono text-muted-foreground">
          {bi.policyNumber ?? policyNumber}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Make changes in the tabs below, then click &quot;Review changes&quot; to continue to the summary and submit.
        </p>
      </div>

      <Tabs defaultValue="insured" className="w-full">
        <TabsList className="mb-4 bg-muted">
          <TabsTrigger value="insured">Insured maintenance</TabsTrigger>
          <TabsTrigger value="rating">Policy rating factors</TabsTrigger>
          <TabsTrigger value="coverage">Coverage amounts</TabsTrigger>
        </TabsList>

        <TabsContent value="insured" className="mt-0 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Insured maintenance</CardTitle>
              <CardDescription>
                Insured individuals and insured objects. Add, edit, or remove items to apply endorsement changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insureds.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Insured individuals</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Name</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Account ID</TableHead>
                        <TableHead className="w-24 text-right text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insureds.map((ins, idx) => {
                        const isEditing = editingInsuredIndex === idx;
                        const draft = isEditing ? insuredDraft : null;
                        return (
                          <TableRow key={idx} className="border-border">
                            {isEditing && draft ? (
                              <>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="First name"
                                      value={draft.firstName}
                                      onChange={(e) => setInsuredDraft((d) => d ? { ...d, firstName: e.target.value } : null)}
                                      className="h-8 w-32"
                                    />
                                    <Input
                                      placeholder="Last name"
                                      value={draft.lastName}
                                      onChange={(e) => setInsuredDraft((d) => d ? { ...d, lastName: e.target.value } : null)}
                                      className="h-8 w-32"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Type"
                                    value={draft.insuredType}
                                    onChange={(e) => setInsuredDraft((d) => d ? { ...d, insuredType: e.target.value } : null)}
                                    className="h-8 w-36"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Account ID"
                                    value={draft.accountId}
                                    onChange={(e) => setInsuredDraft((d) => d ? { ...d, accountId: e.target.value } : null)}
                                    className="h-8 w-28 font-mono"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setDetail((prev) => {
                                        if (!prev?.insureds) return prev;
                                        const next = [...prev.insureds];
                                        next[idx] = { ...next[idx], firstName: draft.firstName, lastName: draft.lastName, insuredType: draft.insuredType, accountId: draft.accountId };
                                        return { ...prev, insureds: next };
                                      });
                                      setEditingInsuredIndex(null);
                                      setInsuredDraft(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingInsuredIndex(null);
                                      setInsuredDraft(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>
                                  {[ins.firstName, ins.lastName].filter(Boolean).join(" ") || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{ins.insuredType ?? "—"}</TableCell>
                                <TableCell className="font-mono text-sm">{ins.accountId ?? "—"}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingInsuredIndex(idx);
                                      setInsuredDraft({
                                        firstName: ins.firstName ?? "",
                                        lastName: ins.lastName ?? "",
                                        insuredType: ins.insuredType ?? "",
                                        accountId: ins.accountId ?? "",
                                      });
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
              {insObjs.length > 0 ? (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Insured objects</h4>
                  {insObjs.map((obj) => {
                    const objId = obj.objectId ?? "—";
                    const isExpanded = expandedObjectId === objId;
                    const nameAttr = obj.customAttributes?.find((a) => (a.attrName ?? "").toLowerCase() === "name");
                    const label = nameAttr?.attrValue?.trim() || objId;
                    return (
                      <div key={objId} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-muted/40 transition-colors"
                          onClick={() => setExpandedObjectId(isExpanded ? null : objId)}
                        >
                          <span className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{label}</span>
                            <span className="text-muted-foreground text-sm">
                              {obj.insuredObjType?.label ?? obj.objectType ?? ""}
                            </span>
                          </span>
                          <span className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingObjectId(objId);
                                setObjectDraft({
                                  sumInsured: obj.sumInsured != null ? String(obj.sumInsured) : "",
                                  totalPremium: obj.totalPremium != null ? String(obj.totalPremium) : "",
                                });
                                if (!isExpanded) setExpandedObjectId(objId);
                              }}
                            >
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" disabled title="Delete not implemented">Delete</Button>
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border p-4 space-y-3">
                            {editingObjectId === objId && objectDraft ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3 max-w-xs">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Sum insured</Label>
                                    <Input
                                      type="number"
                                      value={objectDraft.sumInsured}
                                      onChange={(e) => setObjectDraft((d) => d ? { ...d, sumInsured: e.target.value } : null)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Premium</Label>
                                    <Input
                                      type="number"
                                      value={objectDraft.totalPremium}
                                      onChange={(e) => setObjectDraft((d) => d ? { ...d, totalPremium: e.target.value } : null)}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const objIdx = insObjs.findIndex((o) => (o.objectId ?? "—") === objId);
                                      if (objIdx >= 0 && detail) {
                                        setDetail({
                                          ...detail,
                                          insObjsResp: (detail.insObjsResp ?? []).map((o, i) =>
                                            i === objIdx
                                              ? {
                                                  ...o,
                                                  sumInsured: objectDraft.sumInsured ? Number(objectDraft.sumInsured) : undefined,
                                                  totalPremium: objectDraft.totalPremium ? Number(objectDraft.totalPremium) : undefined,
                                                }
                                              : o
                                          ),
                                        });
                                      }
                                      setEditingObjectId(null);
                                      setObjectDraft(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => { setEditingObjectId(null); setObjectDraft(null); }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">Object ID</span>
                                <span className="font-mono">{obj.objectId ?? "—"}</span>
                                <span className="text-muted-foreground">Sum insured</span>
                                <span>{obj.sumInsured != null ? String(obj.sumInsured) : "—"}</span>
                                <span className="text-muted-foreground">Premium</span>
                                <span>{obj.totalPremium != null ? String(obj.totalPremium) : "—"}</span>
                              </div>
                            )}
                            {(obj.customAttributes ?? []).length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Attributes</p>
                                <div className="flex flex-wrap gap-2">
                                  {obj.customAttributes!.map((a, i) => (
                                    <span key={i} className="rounded bg-muted px-2 py-1 text-xs font-mono">
                                      {a.attrName ?? "—"}: {a.attrValue ?? "—"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {insureds.length === 0 && insObjs.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No insured individuals or objects. Data appears when provided by the policy API.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rating" className="mt-0">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Policy rating factors</CardTitle>
              <CardDescription>
                Rating factors and attributes that affect premium. Edit values to apply endorsement changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasRating ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Name / Type</TableHead>
                      <TableHead className="text-muted-foreground">Category</TableHead>
                      <TableHead className="text-muted-foreground">Value</TableHead>
                      <TableHead className="w-24 text-right text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingList.map((r, idx) => {
                      const key: { list: "api"; index: number } = { list: "api", index: idx };
                      const isEditing = editingRating?.list === "api" && editingRating?.index === idx;
                      const currentVal = String((r as { value?: unknown }).value ?? "");
                      return (
                        <TableRow key={idx} className="border-border">
                          <TableCell className="font-medium">
                            {(r as { attributeName?: string }).attributeName ?? (r as { name?: string }).name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {(r as { category?: string }).category ?? "—"}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  className="h-8 w-32"
                                  value={ratingDraftValue}
                                  onChange={(e) => setRatingDraftValue(e.target.value)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (!detail?.ratingFactors) return;
                                    const next = [...detail.ratingFactors];
                                    next[idx] = { ...next[idx], value: ratingDraftValue };
                                    setDetail({ ...detail, ratingFactors: next });
                                    setEditingRating(null);
                                    setRatingDraftValue("");
                                  }}
                                >
                                  Save
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditingRating(null); setRatingDraftValue(""); }}>Cancel</Button>
                              </div>
                            ) : (
                              currentVal || "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingRating(key);
                                  setRatingDraftValue(currentVal);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {ratingFromPolicy.map((r, idx) => {
                      const key: { list: "policy"; index: number } = { list: "policy", index: idx };
                      const isEditing = editingRating?.list === "policy" && editingRating?.index === idx;
                      const currentVal = String(r.value ?? "");
                      return (
                        <TableRow key={`pf-${idx}`} className="border-border">
                          <TableCell className="font-medium">{r.type ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.category ?? "—"}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  className="h-8 w-32"
                                  value={ratingDraftValue}
                                  onChange={(e) => setRatingDraftValue(e.target.value)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (!detail?.policyRatingFactors) return;
                                    const next = [...detail.policyRatingFactors];
                                    next[idx] = { ...next[idx], value: ratingDraftValue };
                                    setDetail({ ...detail, policyRatingFactors: next });
                                    setEditingRating(null);
                                    setRatingDraftValue("");
                                  }}
                                >
                                  Save
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditingRating(null); setRatingDraftValue(""); }}>Cancel</Button>
                              </div>
                            ) : (
                              currentVal || "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isEditing && (
                              <Button variant="ghost" size="sm" onClick={() => { setEditingRating(key); setRatingDraftValue(currentVal); }}>Edit</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No rating factors. Data appears when provided by the policy API.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Edit actions will update the endorsement request and be sent on Review changes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="mt-0">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Coverage amounts</CardTitle>
              <CardDescription>
                Coverage variants, limits, and premiums per insured or object. Update to apply endorsement changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coverageRows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Insured / Object</TableHead>
                      <TableHead className="text-muted-foreground">Coverage variant</TableHead>
                      <TableHead className="text-muted-foreground">Code</TableHead>
                      <TableHead className="text-muted-foreground">Sum insured</TableHead>
                      <TableHead className="text-muted-foreground">Premium</TableHead>
                      <TableHead className="w-24 text-right text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverageRows.map((row, idx) => {
                      const isEditing = editingCoverageIndex === idx;
                      const draft = isEditing ? coverageDraft : null;
                      return (
                        <TableRow key={idx} className="border-border">
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-muted-foreground">{row.variant}</TableCell>
                          <TableCell className="font-mono text-sm">{row.code}</TableCell>
                          <TableCell>
                            {isEditing && draft ? (
                              <Input
                                type="number"
                                className="h-8 w-24"
                                value={draft.sumInsured}
                                onChange={(e) => setCoverageDraft((d) => d ? { ...d, sumInsured: e.target.value } : null)}
                              />
                            ) : (
                              row.sumInsured != null ? String(row.sumInsured) : "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing && draft ? (
                              <Input
                                type="number"
                                className="h-8 w-24"
                                value={draft.premium}
                                onChange={(e) => setCoverageDraft((d) => d ? { ...d, premium: e.target.value } : null)}
                              />
                            ) : (
                              row.premium != null ? String(row.premium) : "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing && draft ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (!detail) return;
                                    if (row.kind === "person" && row.insIndex != null && row.insCvIndex != null && detail.insureds) {
                                      const next = detail.insureds.map((ins, i) =>
                                        i === row.insIndex!
                                          ? {
                                              ...ins,
                                              coverageVariants: (ins.coverageVariants ?? []).map((cv, j) =>
                                                j === row.insCvIndex!
                                                  ? { ...cv, sumInsured: draft.sumInsured ? Number(draft.sumInsured) : undefined, totalPremium: draft.premium ? Number(draft.premium) : undefined }
                                                  : cv
                                              ),
                                            }
                                          : ins
                                      );
                                      setDetail({ ...detail, insureds: next });
                                    } else if (row.kind === "object" && row.objIndex != null && row.objCvIndex != null && detail.insObjsResp) {
                                      const next = detail.insObjsResp.map((obj, i) =>
                                        i === row.objIndex!
                                          ? {
                                              ...obj,
                                              coverageVariants: (obj.coverageVariants ?? []).map((cv, j) =>
                                                j === row.objCvIndex!
                                                  ? { ...cv, sumInsured: draft.sumInsured ? Number(draft.sumInsured) : undefined, totalPremium: draft.premium ? Number(draft.premium) : undefined }
                                                  : cv
                                              ),
                                            }
                                          : obj
                                      );
                                      setDetail({ ...detail, insObjsResp: next });
                                    }
                                    setEditingCoverageIndex(null);
                                    setCoverageDraft(null);
                                  }}
                                >
                                  Save
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditingCoverageIndex(null); setCoverageDraft(null); }}>Cancel</Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCoverageIndex(idx);
                                  setCoverageDraft({
                                    sumInsured: row.sumInsured != null ? String(row.sumInsured) : "",
                                    premium: row.premium != null ? String(row.premium) : "",
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No coverage data. Populated from policy insureds and insured objects when available.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Edit actions will update the endorsement request and be sent on Review changes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={() => {
            if (detail) {
              try {
                sessionStorage.setItem(
                  `${ENDORSEMENT_DRAFT_KEY}-${encodeURIComponent(policyNumber)}`,
                  JSON.stringify(detail)
                );
              } catch {
                // ignore
              }
            }
            router.push(`/policies/${encodeURIComponent(policyNumber)}/summary`);
          }}
        >
          Review changes
        </Button>
      </div>
    </div>
  );
}
