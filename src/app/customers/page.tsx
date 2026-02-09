"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { logAudit } from "@/lib/audit-client";
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

/** Reference item from API (id, label, key). */
interface RefItem {
  id?: string | null;
  label?: string | null;
  key?: string | null;
}

/** Contact detail (phone, mobile, etc.). */
interface ContactDetail {
  type?: string;
  detail?: string;
}

/** Address from API. */
interface CustomerAddress {
  addressId?: string;
  type?: RefItem;
  country?: RefItem;
  provinceState?: RefItem;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  city?: string;
  postalCode?: string;
  contactDetails?: ContactDetail[];
}

/** Full customer details matching policy API customer search response. */
export interface Customer {
  id: string;
  accountId?: string;
  roles?: string[];
  country?: RefItem;
  customerType?: string;
  title?: RefItem;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  formalName?: string | null;
  nickName?: string | null;
  fullName: string;
  gender?: RefItem;
  personalIdType?: RefItem;
  dateOfBirth?: string;
  preferredLanguage?: RefItem;
  nationality?: RefItem;
  email?: string;
  personalId?: string | null;
  primaryJobClass?: RefItem | null;
  primaryOccupation?: RefItem | null;
  secondaryJobClass?: RefItem | null;
  secondaryOccupation?: RefItem | null;
  secondaryIndustry?: RefItem | null;
  industry?: RefItem | null;
  race?: RefItem | null;
  religion?: RefItem | null;
  education?: RefItem | null;
  maritalStatus?: RefItem | null;
  height?: string | null;
  weight?: string | null;
  isMedicalReimbursement?: boolean;
  incomeLevel?: RefItem | null;
  sensitivityCode?: RefItem[];
  suppressionCode?: RefItem[];
  addresses?: CustomerAddress[];
  fulfillPrefs?: { preferEmail?: boolean; preferSms?: boolean; preferPrint?: boolean };
  phone?: string;
}

/** Extract list of customer-like objects from API response (handles multiple shapes). */
function extractRawCustomers(data: unknown): unknown[] {
  if (data == null) return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray((d as { customerSearchList?: unknown[] }).customerSearchList))
    return (d as { customerSearchList: unknown[] }).customerSearchList;
  if (Array.isArray(d.details)) return d.details;
  if (Array.isArray(d.customers)) return d.customers;
  if (Array.isArray(d.results)) return d.results;
  if (Array.isArray(d.items)) return d.items;
  const inner = d.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(inner)) return inner;
  if (inner != null && typeof inner === "object" && Array.isArray((inner as Record<string, unknown>).details))
    return (inner as { details: unknown[] }).details;
  if (inner != null && typeof inner === "object" && Array.isArray((inner as Record<string, unknown>).customers))
    return (inner as { customers: unknown[] }).customers;
  if (Array.isArray(data)) return data;
  return [];
}

function refFrom(raw: unknown): RefItem | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (o.id == null && o.label == null && o.key == null) return undefined;
  return {
    id: o.id != null ? String(o.id) : null,
    label: o.label != null ? String(o.label) : null,
    key: o.key != null ? String(o.key) : null,
  };
}

function refLabel(ref: RefItem | undefined | null): string {
  if (!ref) return "—";
  return ref.label ?? ref.id ?? ref.key ?? "—";
}

/** Map a single raw customer object from the API to Customer. */
function mapRawToCustomer(raw: unknown, index: number): Customer {
  const r = (raw ?? {}) as Record<string, unknown>;
  const accountId = r.accountId != null ? String(r.accountId) : undefined;
  const firstName = String(r.firstName ?? "");
  const lastName = String(r.lastName ?? "");
  const fullName =
    String((r as { formalName?: string }).formalName ?? (r as { fullName?: string }).fullName ?? "").trim() ||
    [firstName, (r as { middleName?: string }).middleName, lastName].filter(Boolean).join(" ").trim() ||
    "—";
  const id = accountId ?? `customer-${index}`;
  const email =
    typeof (r as { emailAddr?: string }).emailAddr === "string"
      ? (r as { emailAddr: string }).emailAddr.trim()
      : typeof (r as { email?: string }).email === "string"
        ? (r as { email: string }).email.trim()
        : undefined;

  const addresses = Array.isArray(r.addresses)
    ? (r.addresses as Record<string, unknown>[]).map((a) => ({
        addressId: a.addressId != null ? String(a.addressId) : undefined,
        type: refFrom(a.type),
        country: refFrom(a.country),
        provinceState: refFrom(a.provinceState),
        addressLine1: typeof a.addressLine1 === "string" ? a.addressLine1 : undefined,
        addressLine2: typeof a.addressLine2 === "string" ? a.addressLine2 : undefined,
        addressLine3: typeof a.addressLine3 === "string" ? a.addressLine3 : undefined,
        addressLine4: typeof a.addressLine4 === "string" ? a.addressLine4 : undefined,
        city: typeof a.city === "string" ? a.city : undefined,
        postalCode: typeof a.postalCode === "string" ? a.postalCode : undefined,
        contactDetails: Array.isArray(a.contactDetails)
          ? (a.contactDetails as { type?: string; detail?: string }[]).map((c) => ({ type: c.type, detail: c.detail }))
          : undefined,
      }))
    : undefined;

  const contactDetails = addresses?.[0]?.contactDetails;
  const phone =
    contactDetails?.find((c) => (c.type ?? "").toLowerCase() === "phone")?.detail ??
    contactDetails?.find((c) => (c.type ?? "").toLowerCase() === "mobile")?.detail ??
    undefined;

  const sensitivityCode = Array.isArray(r.sensitivityCode)
    ? (r.sensitivityCode as unknown[]).map((x) => refFrom(x)).filter(Boolean) as RefItem[]
    : undefined;
  const suppressionCode = Array.isArray(r.suppressionCode)
    ? (r.suppressionCode as unknown[]).map((x) => refFrom(x)).filter(Boolean) as RefItem[]
    : undefined;

  const fulfillPrefs = r.fulfillPrefs != null && typeof r.fulfillPrefs === "object"
    ? (r.fulfillPrefs as { preferEmail?: boolean; preferSms?: boolean; preferPrint?: boolean })
    : undefined;

  return {
    id,
    accountId,
    roles: Array.isArray(r.roles) ? (r.roles as string[]) : undefined,
    country: refFrom(r.country),
    customerType: typeof r.customerType === "string" ? r.customerType : undefined,
    title: refFrom(r.title),
    firstName,
    lastName,
    middleName: (r as { middleName?: string }).middleName ?? null,
    formalName: (r as { formalName?: string }).formalName ?? null,
    nickName: (r as { nickName?: string }).nickName ?? null,
    fullName,
    gender: refFrom(r.gender),
    personalIdType: refFrom((r as { personalIdType?: unknown }).personalIdType),
    dateOfBirth: typeof (r as { dateOfBirth?: string }).dateOfBirth === "string" ? (r as { dateOfBirth: string }).dateOfBirth : undefined,
    preferredLanguage: refFrom((r as { preferredLanguage?: unknown }).preferredLanguage),
    nationality: refFrom(r.nationality),
    email,
    personalId: (r as { personalId?: string }).personalId ?? null,
    primaryJobClass: refFrom((r as { primaryJobClass?: unknown }).primaryJobClass) ?? null,
    primaryOccupation: refFrom((r as { primaryOccupation?: unknown }).primaryOccupation),
    secondaryJobClass: refFrom((r as { secondaryJobClass?: unknown }).secondaryJobClass) ?? null,
    secondaryOccupation: refFrom((r as { secondaryOccupation?: unknown }).secondaryOccupation),
    secondaryIndustry: refFrom((r as { secondaryIndustry?: unknown }).secondaryIndustry) ?? null,
    industry: refFrom((r as { industry?: unknown }).industry) ?? null,
    race: refFrom((r as { race?: unknown }).race) ?? null,
    religion: refFrom((r as { religion?: unknown }).religion) ?? null,
    education: refFrom((r as { education?: unknown }).education),
    maritalStatus: refFrom((r as { maritalStatus?: unknown }).maritalStatus),
    height: (r as { height?: string }).height ?? null,
    weight: (r as { weight?: string }).weight ?? null,
    isMedicalReimbursement: typeof (r as { isMedicalReimbursement?: boolean }).isMedicalReimbursement === "boolean" ? (r as { isMedicalReimbursement: boolean }).isMedicalReimbursement : undefined,
    incomeLevel: refFrom((r as { incomeLevel?: unknown }).incomeLevel) ?? null,
    sensitivityCode,
    suppressionCode,
    addresses,
    fulfillPrefs,
    phone,
  };
}

/** Section: title + label/value rows. */
function DetailSection({
  title,
  entries,
}: {
  title: string;
  entries: { label: string; value: React.ReactNode }[];
}) {
  const filtered = entries.filter((e) => e.value != null && e.value !== "" && String(e.value).trim() !== "—");
  if (filtered.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h4>
      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CustomerDetailCard({
  customer,
  policyNumberFromUrl,
}: {
  customer: Customer;
  policyNumberFromUrl?: string | null;
}) {
  const hasPolicyLink = policyNumberFromUrl || (customer.fullName && customer.fullName !== "—") || customer.accountId;
  const policiesHref = policyNumberFromUrl
    ? `/policies/${encodeURIComponent(policyNumberFromUrl)}`
    : `/policies?q=${encodeURIComponent(customer.fullName && customer.fullName !== "—" ? customer.fullName : customer.accountId ?? "")}`;
  return (
    <div className="space-y-4">
      {hasPolicyLink && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
          <Link
            href={policiesHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            <FileText className="h-4 w-4" />
            {policyNumberFromUrl ? "View policy" : "View policies for this customer"}
          </Link>
          {policyNumberFromUrl ? (
            <span className="text-xs text-muted-foreground">
              Opens the policy you came from (no search needed).
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Enter an effective date on the Policies page and click Search to find by customer name.
            </span>
          )}
        </div>
      )}
      <DetailSection
        title="Identity"
        entries={[
          { label: "Account ID", value: customer.accountId ?? "—" },
          { label: "Roles", value: customer.roles?.join(", ") ?? "—" },
          { label: "Customer type", value: customer.customerType ?? "—" },
          { label: "Title", value: refLabel(customer.title) },
          { label: "First name", value: customer.firstName || "—" },
          { label: "Last name", value: customer.lastName || "—" },
          { label: "Middle name", value: customer.middleName ?? "—" },
          { label: "Formal name", value: customer.formalName ?? "—" },
          { label: "Nick name", value: customer.nickName ?? "—" },
        ]}
      />
      <DetailSection
        title="Demographics"
        entries={[
          { label: "Gender", value: refLabel(customer.gender) },
          { label: "Date of birth", value: customer.dateOfBirth ?? "—" },
          { label: "Nationality", value: refLabel(customer.nationality) },
          { label: "Country", value: refLabel(customer.country) },
          { label: "Preferred language", value: refLabel(customer.preferredLanguage) },
          { label: "Marital status", value: refLabel(customer.maritalStatus) },
          { label: "Height", value: customer.height ?? "—" },
          { label: "Weight", value: customer.weight ?? "—" },
          { label: "Education", value: refLabel(customer.education) },
        ]}
      />
      <DetailSection
        title="Contact & IDs"
        entries={[
          { label: "Email", value: customer.email ?? "—" },
          { label: "Phone", value: customer.phone ?? "—" },
          { label: "Personal ID type", value: refLabel(customer.personalIdType) },
          { label: "Personal ID", value: customer.personalId ?? "—" },
        ]}
      />
      <DetailSection
        title="Occupation"
        entries={[
          { label: "Primary occupation", value: refLabel(customer.primaryOccupation) },
          { label: "Secondary occupation", value: refLabel(customer.secondaryOccupation) },
          { label: "Primary job class", value: refLabel(customer.primaryJobClass) },
          { label: "Industry", value: refLabel(customer.industry) },
          { label: "Secondary industry", value: refLabel(customer.secondaryIndustry) },
        ]}
      />
      {customer.addresses && customer.addresses.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Addresses
          </h4>
          <div className="space-y-4">
            {customer.addresses.map((addr, i) => (
              <div key={addr.addressId ?? i} className="rounded border border-border/60 bg-background/60 p-3 text-sm">
                <p className="font-medium text-foreground">{refLabel(addr.type)}</p>
                <p className="text-muted-foreground mt-1">
                  {[addr.addressLine1, addr.addressLine2, addr.addressLine3, addr.addressLine4].filter(Boolean).join(", ")}
                </p>
                <p className="text-muted-foreground">
                  {[addr.city, addr.postalCode, refLabel(addr.country)].filter(Boolean).join(", ")}
                </p>
                {addr.contactDetails && addr.contactDetails.length > 0 && (
                  <p className="text-muted-foreground mt-1">
                    {addr.contactDetails.map((c) => `${c.type ?? ""}: ${c.detail ?? ""}`).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <DetailSection
        title="Sensitivity & suppression"
        entries={[
          {
            label: "Sensitivity codes",
            value: customer.sensitivityCode?.map((s) => refLabel(s)).join(", ") ?? "—",
          },
          {
            label: "Suppression codes",
            value: customer.suppressionCode?.map((s) => refLabel(s)).join(", ") ?? "—",
          },
        ]}
      />
      {customer.fulfillPrefs && (
        <DetailSection
          title="Fulfillment preferences"
          entries={[
            { label: "Prefer email", value: customer.fulfillPrefs.preferEmail ? "Yes" : "No" },
            { label: "Prefer SMS", value: customer.fulfillPrefs.preferSms ? "Yes" : "No" },
            { label: "Prefer print", value: customer.fulfillPrefs.preferPrint ? "Yes" : "No" },
          ]}
        />
      )}
      <DetailSection
        title="Other"
        entries={[
          { label: "Medical reimbursement", value: customer.isMedicalReimbursement === true ? "Yes" : customer.isMedicalReimbursement === false ? "No" : "—" },
          { label: "Income level", value: refLabel(customer.incomeLevel) },
          { label: "Race", value: refLabel(customer.race) },
          { label: "Religion", value: refLabel(customer.religion) },
        ]}
      />
    </div>
  );
}

async function runCustomerSearch(
  q: string,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  setLiveCustomers: (v: Customer[] | null) => void
) {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(
      `/api/customers/search?q=${encodeURIComponent(q)}`,
      { credentials: "include" }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string; envKey?: string };
      const envNote = body.envKey ? ` [env: ${body.envKey}]` : "";
      throw new Error(
        (body.error || `Customers search failed with status ${res.status}`) + envNote
      );
    }
    const data = await res.json();
    const rawCustomers = extractRawCustomers(data);
    const mapped = rawCustomers.map((raw, index) =>
      mapRawToCustomer(raw, index)
    );
    if (mapped.length === 0) {
      logAudit({ action: "customers.search", outcome: "failure", subject: q, details: { reason: "no_results" } });
      setError("No customers found. Try a different search term.");
      setLiveCustomers(null);
    } else {
      logAudit({ action: "customers.search", outcome: "success", subject: q, details: { count: mapped.length } });
      setError(null);
      setLiveCustomers(mapped);
    }
  } catch (err) {
    logAudit({
      action: "customers.search",
      outcome: "failure",
      subject: q,
      details: { error: err instanceof Error ? err.message : "Unexpected error" },
    });
    setError(err instanceof Error ? err.message : "Unexpected error while searching customers.");
    setLiveCustomers(null);
  } finally {
    setLoading(false);
  }
}

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const policyNumberFromUrl = searchParams.get("policyNumber")?.trim() || null;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCustomers, setLiveCustomers] = useState<Customer[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const lastUrlQ = useRef<string | null>(null);

  // When opening from policy details (e.g. /customers?q=88625), pre-fill search and auto-run so the customer loads.
  useEffect(() => {
    const qFromUrl = searchParams.get("q")?.trim() ?? "";
    if (!qFromUrl) return;
    setQuery(qFromUrl);
    if (lastUrlQ.current === qFromUrl) return;
    lastUrlQ.current = qFromUrl;
    runCustomerSearch(qFromUrl, setLoading, setError, setLiveCustomers);
  }, [searchParams]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Customers
        </h1>
        <p className="mt-1 text-muted-foreground">
          Search customers by account ID (matches policy API customer search).
        </p>
      </div>

      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Enter an account ID and click Search (e.g. 88625).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="customer-query">Customer</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-query"
                  placeholder="e.g. 88625 or account ID"
                  className="pl-8 bg-background"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("customers-search-btn")?.click();
                    }
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Button
                id="customers-search-btn"
                type="button"
                className="w-full md:w-auto"
                disabled={!query.trim() || loading}
                onClick={() => {
                  const q = query.trim();
                  if (!q) return;
                  runCustomerSearch(q, setLoading, setError, setLiveCustomers);
                }}
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
            {liveCustomers == null
              ? "Run a search to see results."
              : `Showing ${liveCustomers.length.toLocaleString()} customer ${liveCustomers.length === 1 ? "" : " entries"} from search.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-3 text-xs text-red-400">{error}</p>
          )}
          {liveCustomers == null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Enter an account ID and click Search.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10 text-muted-foreground" aria-label="Expand" />
                  <TableHead className="text-muted-foreground">Account ID</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Country</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Date of birth</TableHead>
                  <TableHead className="text-right text-muted-foreground">Policies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveCustomers.map((customer) => {
                  const isExpanded = expandedId === customer.id;
                  const hasPolicyLink = policyNumberFromUrl || (customer.fullName && customer.fullName !== "—") || customer.accountId;
                  const policiesHref = policyNumberFromUrl
                    ? `/policies/${encodeURIComponent(policyNumberFromUrl)}`
                    : `/policies?q=${encodeURIComponent(customer.fullName && customer.fullName !== "—" ? customer.fullName : customer.accountId ?? "")}`;
                  return (
                    <Fragment key={customer.id}>
                      <TableRow
                        className="border-border cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                      >
                        <TableCell className="w-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={isExpanded ? "Collapse" : "Expand details"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(isExpanded ? null : customer.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {customer.accountId ?? "—"}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {customer.fullName}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {customer.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {refLabel(customer.country)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.customerType ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.dateOfBirth ?? "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {hasPolicyLink ? (
                            <Link
                              href={policiesHref}
                              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {policyNumberFromUrl ? "View policy" : "View policies"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="border-border bg-muted/5">
                          <TableCell colSpan={8} className="p-4 align-top">
                            <CustomerDetailCard customer={customer} policyNumberFromUrl={policyNumberFromUrl} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
