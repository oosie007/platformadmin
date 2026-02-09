"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Policy } from "@/lib/mock-data";
import { logAudit } from "@/lib/audit-client";

const POLICIES_LIST_STORAGE_KEY = "policies-list-state";

interface PoliciesListState {
  effectiveDate: string;
  query: string;
  policies: Policy[];
}

function loadPoliciesListState(): PoliciesListState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POLICIES_LIST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PoliciesListState;
    if (!Array.isArray(parsed.policies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePoliciesListState(state: PoliciesListState) {
  try {
    sessionStorage.setItem(POLICIES_LIST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

/** Label/value row for summary peek; matches SummaryRow on policy details page. */
function PeekSummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const isEmpty = value == null || value === "" || value === "—";
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-x-4 py-1.5 items-baseline min-w-0">
      <dt className="text-xs text-muted-foreground truncate shrink-0">{label}</dt>
      <dd
        className={`text-sm text-right tabular-nums min-w-0 truncate ${mono ? "font-mono" : ""} ${
          isEmpty ? "text-muted-foreground/70" : "font-medium text-foreground"
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

/** Heuristic: query looks like a policy number (contains digits, alphanumeric/dash) for searchType choice. */
function looksLikePolicyNumber(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  return /\d/.test(t) && /^[\w\-]+$/i.test(t);
}

/** Extract list of policy-like objects from UAT search/detail response (handles multiple shapes). */
function extractRawPolicies(data: unknown): unknown[] {
  if (data == null) return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.details)) return d.details;
  if (Array.isArray(d.policies)) return d.policies;
  if (Array.isArray(d.results)) return d.results;
  if (Array.isArray(d.items)) return d.items;
  const inner = d.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(inner)) return inner;
  if (inner != null && typeof inner === "object" && Array.isArray((inner as Record<string, unknown>).details))
    return (inner as { details: unknown[] }).details;
  if (inner != null && typeof inner === "object" && Array.isArray((inner as Record<string, unknown>).policies))
    return (inner as { policies: unknown[] }).policies;
  if (Array.isArray(data)) return data;
  return [];
}

/** Map a single raw policy object from the API to Policy (tolerates different field names). */
function mapRawToPolicy(raw: unknown, index: number): Policy {
  const r = (raw ?? {}) as Record<string, unknown>;
  const basicInfo = (r.basicInfo ?? {}) as Record<string, unknown>;
  const people = Array.isArray(r.people) ? r.people : [];
  const person = (people[0] ?? {}) as Record<string, unknown>;
  const firstName = String(person.firstName ?? "");
  const lastName = String(person.lastName ?? "");
  const fullName = `${firstName} ${lastName}`.trim();
  const policyNumber = String(basicInfo.policyNumber ?? r.policyNumber ?? "");
  const dateEffective = String(
    basicInfo.effectiveDate ?? basicInfo.effective ?? r.dateEffective ?? r.effectiveDate ?? ""
  );
  const customerName =
    String(r.customerName ?? "").trim() ||
    (fullName || "Unknown customer");
  const customerAccountId =
    person.accountId != null ? String(person.accountId) : (r.accountId != null ? String(r.accountId) : undefined);
  const customerEmail =
    typeof person.emailAddr === "string"
      ? person.emailAddr.trim()
      : typeof (r as { email?: string }).email === "string"
        ? (r as { email: string }).email.trim()
        : undefined;
  const productName = String(
    basicInfo.productName ?? r.productName ?? "Unknown"
  );
  const status = String(basicInfo.status ?? r.status ?? "Unknown");
  const id = String(r.id ?? basicInfo.policyNumber ?? r.policyNumber ?? `uat-${index}`);

  return {
    id,
    policyNumber,
    dateEffective,
    customerName,
    ...(customerAccountId ? { customerAccountId } : {}),
    ...(customerEmail ? { customerEmail } : {}),
    productName,
    status,
  };
}

export default function PoliciesPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDebug, setErrorDebug] = useState<Record<string, unknown> | null>(null);
  const [livePolicies, setLivePolicies] = useState<Policy[] | null>(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [detailsByPolicyId, setDetailsByPolicyId] = useState<Record<string, any>>({});
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [detailsErrorByPolicyId, setDetailsErrorByPolicyId] = useState<Record<string, string>>({});
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  const [nameOnlyHint, setNameOnlyHint] = useState<string | null>(null);
  const hasRunInitialUrlSearch = useRef(false);

  const runPolicySearch = useCallback(async (qValue: string, dateValue: string) => {
    try {
      setLoading(true);
      setError(null);
      setErrorDebug(null);
      setNameOnlyHint(null);

      let mapped: Policy[] = [];
      let searchResponse: unknown = null;

      if (dateValue) {
        const searchUrl = `/api/policies/search?date=${encodeURIComponent(dateValue)}`;
        const res = await fetch(searchUrl, { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string; envKey?: string; debug?: Record<string, unknown> };
          setErrorDebug(body.debug ?? null);
          const envNote = body.envKey ? ` [env: ${body.envKey}]` : "";
          throw new Error((body.error || `Policy search failed with status ${res.status}`) + envNote);
        }
        const data = await res.json();
        searchResponse = data;
        const rawPolicies = extractRawPolicies(data);
        mapped = rawPolicies.map((raw, index) => mapRawToPolicy(raw, index));
      } else if (qValue.trim()) {
        const q = qValue.trim();
        // API in SIT does not support search by customer name (PolicySearchType rejects CustomerName).
        // When the user entered a name (not a policy number) and no date, ask for a date and we'll use date search + client-side filter.
        if (!dateValue && !looksLikePolicyNumber(q)) {
          setError(null);
          setErrorDebug(null);
          setLivePolicies(null);
          setNameOnlyHint("Policy search by customer name only isn't supported. Enter an effective date and click Search — results will be filtered by the customer name above.");
          setLoading(false);
          return;
        }
        if (dateValue) {
          // Date + name: search by date only; results are filtered by name client-side.
          const searchUrl = `/api/policies/search?date=${encodeURIComponent(dateValue)}`;
          const res = await fetch(searchUrl, { credentials: "include" });
          if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string; envKey?: string; debug?: Record<string, unknown> };
            setErrorDebug(body.debug ?? null);
            const envNote = body.envKey ? ` [env: ${body.envKey}]` : "";
            throw new Error((body.error || `Policy search failed with status ${res.status}`) + envNote);
          }
          const data = await res.json();
          searchResponse = data;
          const rawPolicies = extractRawPolicies(data);
          mapped = rawPolicies.map((raw, index) => mapRawToPolicy(raw, index));
        } else {
          // Policy number search.
          const searchUrl = `/api/policies/search?q=${encodeURIComponent(q)}&searchType=ByPolicyNumber`;
          const res = await fetch(searchUrl, { credentials: "include" });
          if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string; envKey?: string; debug?: Record<string, unknown> };
            setErrorDebug(body.debug ?? null);
            const envNote = body.envKey ? ` [env: ${body.envKey}]` : "";
            throw new Error((body.error || `Policy search failed with status ${res.status}`) + envNote);
          }
          const data = await res.json();
          searchResponse = data;
          const rawPolicies = extractRawPolicies(data);
          mapped = rawPolicies.map((raw, index) => mapRawToPolicy(raw, index));
          if (mapped.length === 0) {
            const detailRes = await fetch(`/api/policies/detail?policyNumber=${encodeURIComponent(q)}`, { credentials: "include" });
            if (detailRes.ok) {
              const raw = await detailRes.json();
              mapped = [mapRawToPolicy(raw, 0)];
            }
          }
        }
      }

      if (!mapped.length) {
        const rawPolicies = searchResponse != null ? extractRawPolicies(searchResponse) : [];
        const hadResults = rawPolicies.length > 0;
        logAudit({ action: "policies.search", outcome: "failure", subject: dateValue || qValue.trim(), details: hadResults ? { reason: "mapping_failed" } : { reason: "no_results" } });
        setError(hadResults ? "Live API call succeeded but no policies could be mapped. Check the API schema mapping." : "No policies found. Try a different date, policy number, customer name, or email.");
        setLivePolicies(null);
      } else {
        logAudit({ action: "policies.search", outcome: "success", subject: dateValue || qValue.trim(), details: { count: mapped.length } });
        setError(null);
        setLivePolicies(mapped);
        savePoliciesListState({ effectiveDate: dateValue, query: qValue.trim(), policies: mapped });
      }
    } catch (err) {
      console.error("Policy search error", err);
      logAudit({ action: "policies.search", outcome: "failure", subject: dateValue || qValue.trim(), details: { error: err instanceof Error ? err.message : "Unexpected error" } });
      setError(err instanceof Error ? err.message : "Unexpected error while searching policies.");
      setLivePolicies(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-fill search from URL when linking from Customers (e.g. /policies?q=Amalia%20Dare or ?customer=88625).
  useEffect(() => {
    const q = searchParams.get("q") ?? searchParams.get("customer");
    const date = searchParams.get("date");
    if (q != null) setQuery((prev) => prev || q);
    if (date != null) setEffectiveDate((prev) => prev || date);
  }, [searchParams]);

  // When opened with URL params (e.g. "View policies" from Customers), auto-run search so results load without clicking Search.
  useEffect(() => {
    const qFromUrl = (searchParams.get("q") ?? searchParams.get("customer"))?.trim() ?? "";
    const dateFromUrl = searchParams.get("date") ?? "";
    if ((!qFromUrl && !dateFromUrl) || hasRunInitialUrlSearch.current) return;
    hasRunInitialUrlSearch.current = true;
    runPolicySearch(qFromUrl, dateFromUrl);
  }, [searchParams, runPolicySearch]);

  // Restore previous search and results when returning from a policy detail (e.g. "Back to policies").
  // Skip restore when the page was opened with URL params (e.g. "View policies" from Customers) so those params are not overwritten.
  useEffect(() => {
    if (hasRestoredFromStorage) return;
    const qFromUrl = searchParams.get("q") ?? searchParams.get("customer");
    const dateFromUrl = searchParams.get("date");
    if (qFromUrl != null || dateFromUrl != null) {
      setHasRestoredFromStorage(true);
      return;
    }
    const saved = loadPoliciesListState();
    if (!saved || saved.policies.length === 0) {
      setHasRestoredFromStorage(true);
      return;
    }
    setEffectiveDate(saved.effectiveDate ?? "");
    setQuery(saved.query ?? "");
    setLivePolicies(saved.policies);
    setHasRestoredFromStorage(true);
  }, [hasRestoredFromStorage, searchParams]);

  const filteredPolicies = useMemo(() => {
    const source = livePolicies ?? [];
    const q = query.trim().toLowerCase();

    return source.filter((policy) => {
      const matchesQuery =
        !q ||
        policy.policyNumber.toLowerCase().includes(q) ||
        policy.customerName.toLowerCase().includes(q) ||
        (policy.customerEmail?.toLowerCase().includes(q) ?? false) ||
        (policy.customerAccountId?.toLowerCase().includes(q) ?? false);

      const matchesDate = !effectiveDate || policy.dateEffective === effectiveDate;

      return matchesQuery && matchesDate;
    });
  }, [livePolicies, query, effectiveDate]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Policies
        </h1>
        <p className="mt-1 text-muted-foreground">
          Search System 6 policies by policy number, customer, or effective date.
        </p>
      </div>

      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Search by policy number, customer name, or email. Optionally filter by
            effective date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="policy-query">Policy or customer</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="policy-query"
                  placeholder="e.g. S6-10023, Acme Corp, or user@example.com"
                  className="pl-8 bg-background"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full space-y-2 md:w-56">
              <Label htmlFor="effective-date">Effective date</Label>
              <Input
                id="effective-date"
                type="date"
                className="bg-background"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto">
              <Button
                type="button"
                className="w-full md:w-auto"
                disabled={(!effectiveDate && !query.trim()) || loading}
                onClick={() => runPolicySearch(query.trim(), effectiveDate)}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {livePolicies == null
              ? "Run a search to see results."
              : `Showing ${filteredPolicies.length.toLocaleString()} policy ${filteredPolicies.length === 1 ? "" : " entries"} from search.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 space-y-1">
              <p className="text-xs text-red-400">{error}</p>
              {errorDebug && (
                <pre className="max-h-32 overflow-auto rounded border border-border bg-muted/50 p-2 text-[10px] text-muted-foreground">
                  {JSON.stringify(errorDebug, null, 2)}
                </pre>
              )}
            </div>
          )}
          {livePolicies == null ? (
            <div className="py-8 text-center">
              {nameOnlyHint ? (
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {nameOnlyHint}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter a policy number, customer name, or email, and optionally an effective date, then click Search.
                </p>
              )}
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-10 text-muted-foreground" aria-label="Expand" />
                <TableHead className="text-muted-foreground">Policy number</TableHead>
                <TableHead className="text-muted-foreground">Date effective</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Product</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => {
                const isExpanded = expandedPolicyId === policy.id;
                const detail = detailsByPolicyId[policy.id];
                const detailError = detailsErrorByPolicyId[policy.id];

                const togglePeek = async () => {
                  const nextExpanded = isExpanded ? null : policy.id;
                  setExpandedPolicyId(nextExpanded);
                  if (!nextExpanded) return;

                  if (detailsByPolicyId[policy.id]) return;

                  try {
                    setDetailsLoadingId(policy.id);
                    setDetailsErrorByPolicyId((prev) => {
                      const clone = { ...prev };
                      delete clone[policy.id];
                      return clone;
                    });

                    const res = await fetch(
                      `/api/policies/detail?policyNumber=${encodeURIComponent(
                        policy.policyNumber
                      )}`,
                      { credentials: "include" }
                    );
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({})) as { error?: string; envKey?: string };
                      const envNote = body.envKey ? ` [env: ${body.envKey}]` : "";
                      throw new Error(
                        (body.error || `Failed to load policy details (status ${res.status}).`) + envNote
                      );
                    }
                    const detailJson = await res.json();
                    logAudit({
                      action: "policy.peek",
                      outcome: "success",
                      subject: policy.policyNumber,
                    });
                    setDetailsByPolicyId((prev) => ({
                      ...prev,
                      [policy.id]: detailJson,
                    }));
                  } catch (err) {
                    console.error("Load policy detail error", err);
                    logAudit({
                      action: "policy.peek",
                      outcome: "failure",
                      subject: policy.policyNumber,
                      details: { error: err instanceof Error ? err.message : "Unexpected error" },
                    });
                    setDetailsErrorByPolicyId((prev) => ({
                      ...prev,
                      [policy.id]:
                        err instanceof Error
                          ? err.message
                          : "Unexpected error while loading policy details.",
                    }));
                  } finally {
                    setDetailsLoadingId(null);
                  }
                };

                return (
                  <Fragment key={policy.id}>
                    <TableRow
                      className="border-border cursor-pointer hover:bg-muted/30"
                      onClick={togglePeek}
                    >
                      <TableCell className="w-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={isExpanded ? "Collapse" : "Expand details"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void togglePeek();
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/policies/${encodeURIComponent(policy.policyNumber)}`}
                          className="underline-offset-2 hover:underline text-foreground"
                        >
                          {policy.policyNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {policy.dateEffective}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {policy.status ?? "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {policy.customerAccountId ? (
                          <Link
                            href={`/customers?q=${encodeURIComponent(policy.customerAccountId)}`}
                            className="underline-offset-2 hover:underline text-foreground"
                          >
                            {policy.customerName}
                          </Link>
                        ) : (
                          policy.customerName
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {policy.productName}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-border bg-muted/5">
                        <TableCell colSpan={6} className="p-4">
                          {detailsLoadingId === policy.id && (
                            <p className="text-sm text-muted-foreground">
                              Loading details…
                            </p>
                          )}
                          {detailError && (
                            <p className="mb-2 text-xs text-red-400">
                              {detailError}
                            </p>
                          )}
                          {detail && (
                            <div className="space-y-5">
                              {/* At-a-glance header: same as policy details page */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-muted/40 border border-border p-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Policy number
                                  </p>
                                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                    {detail.basicInfo?.policyNumber ?? "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Status
                                  </p>
                                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                                    {detail.basicInfo?.status ?? "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Effective / Expiry
                                  </p>
                                  <p className="mt-0.5 text-sm font-medium text-foreground">
                                    {detail.basicInfo?.effectiveDate && detail.basicInfo?.expirationDate
                                      ? `${detail.basicInfo.effectiveDate} → ${detail.basicInfo.expirationDate}`
                                      : (detail.basicInfo?.effectiveDate ?? detail.basicInfo?.expirationDate) ?? "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Policy premium
                                  </p>
                                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                                    {detail.basicInfo?.policyPremium != null
                                      ? String(detail.basicInfo.policyPremium)
                                      : detail.basicInfo?.latestPremium != null
                                        ? String(detail.basicInfo.latestPremium)
                                        : "—"}
                                  </p>
                                </div>
                              </div>

                              {/* Basic, Product, Premium & billing: same SummaryBlock + SummaryRow as policy details */}
                              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                <section className="rounded-lg border border-border bg-muted/20 pl-4 pr-4 py-4 border-l-4 border-l-primary/40">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                    Basic
                                  </h3>
                                  <dl>
                                    <PeekSummaryRow label="Term effective date" value={detail.basicInfo?.termEffectiveDate} />
                                    <PeekSummaryRow label="Term number" value={detail.basicInfo?.termNumber != null ? String(detail.basicInfo.termNumber) : undefined} />
                                    <PeekSummaryRow label="Auto renew" value={detail.basicInfo?.autoRenew != null ? String(detail.basicInfo.autoRenew) : undefined} />
                                    <PeekSummaryRow label="On-term end" value={detail.basicInfo?.onTermEnd} />
                                    <PeekSummaryRow label="Cancellation date" value={detail.basicInfo?.cancellationDate} />
                                    <PeekSummaryRow
                                      label="Cancellation reason"
                                      value={
                                        typeof detail.basicInfo?.cancellationReason === "object"
                                          ? (detail.basicInfo?.cancellationReason as { label?: string; id?: string })?.label ??
                                            (detail.basicInfo?.cancellationReason as { label?: string; id?: string })?.id
                                          : detail.basicInfo?.cancellationReason != null
                                            ? String(detail.basicInfo.cancellationReason)
                                            : undefined
                                      }
                                    />
                                  </dl>
                                </section>
                                <section className="rounded-lg border border-border bg-muted/20 pl-4 pr-4 py-4 border-l-4 border-l-muted-foreground/30">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                    Product
                                  </h3>
                                  <dl>
                                    <PeekSummaryRow label="Name" value={detail.basicInfo?.productName} />
                                    <PeekSummaryRow label="Product ID" value={detail.basicInfo?.productId} mono />
                                    <PeekSummaryRow
                                      label="Country / Currency"
                                      value={
                                        detail.basicInfo?.country?.label != null && detail.basicInfo?.currency?.id != null
                                          ? `${detail.basicInfo.country.label} · ${detail.basicInfo.currency.id}`
                                          : detail.basicInfo?.country?.label ?? detail.basicInfo?.currency?.id
                                      }
                                    />
                                    <PeekSummaryRow label="Plan name" value={detail.basicInfo?.planName} />
                                    <PeekSummaryRow label="Journey ID" value={detail.basicInfo?.journeyId} />
                                    <PeekSummaryRow label="Partner" value={detail.basicInfo?.partner} />
                                  </dl>
                                </section>
                                <section className="rounded-lg border border-border bg-muted/20 pl-4 pr-4 py-4 border-l-4 border-l-muted-foreground/30">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                    Premium & billing
                                  </h3>
                                  <dl>
                                    <PeekSummaryRow
                                      label="Billing currency"
                                      value={detail.basicInfo?.billingCurrency ?? detail.basicInfo?.currency?.id}
                                    />
                                    <PeekSummaryRow
                                      label="Policy premium"
                                      value={
                                        detail.basicInfo?.policyPremium != null
                                          ? String(detail.basicInfo.policyPremium)
                                          : detail.basicInfo?.latestPremium != null
                                            ? String(detail.basicInfo.latestPremium)
                                            : undefined
                                      }
                                      mono
                                    />
                                    <PeekSummaryRow
                                      label="Latest premium"
                                      value={detail.basicInfo?.latestPremium != null ? String(detail.basicInfo.latestPremium) : undefined}
                                      mono
                                    />
                                    <PeekSummaryRow
                                      label="Tax %"
                                      value={detail.basicInfo?.taxPercentage != null ? String(detail.basicInfo.taxPercentage) : undefined}
                                    />
                                    <PeekSummaryRow label="Payment method" value={detail.latestPaymentInfo?.paymentMethod?.label} />
                                  </dl>
                                </section>
                              </div>

                              <div className="rounded-lg border border-border bg-muted/20 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                  Insured parties
                                </p>
                                {Array.isArray(detail.insureds) && detail.insureds.length > 0 ? (
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {detail.insureds.slice(0, 3).map((ins: { firstName?: string; lastName?: string; insuredType?: string; coverageVariants?: Array<{ coverageVariantDesc?: string }> }, idx: number) => (
                                      <div key={idx} className="rounded-md border border-border bg-background/40 p-4 text-sm">
                                        <div className="flex justify-between gap-2">
                                          <span className="font-medium">
                                            {[ins.firstName, ins.lastName].filter(Boolean).join(" ") || "—"}
                                          </span>
                                          <span className="text-muted-foreground shrink-0">
                                            {ins.insuredType ?? "—"}
                                          </span>
                                        </div>
                                        {ins.coverageVariants?.[0]?.coverageVariantDesc && (
                                          <p className="mt-1 text-muted-foreground">
                                            {ins.coverageVariants[0].coverageVariantDesc}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No insured party details available.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              {filteredPolicies.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No policies match your current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

