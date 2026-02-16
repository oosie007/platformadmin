"use client";

import React from "react";

export interface DetailEntry {
  label: string;
  value: React.ReactNode;
}

export interface AddressEntry {
  typeLabel?: string;
  lines?: string;
  cityPostalCountry?: string;
  contactDetails?: string;
}

export interface CustomerDetailSectionsProps {
  identity: DetailEntry[];
  demographics: DetailEntry[];
  contactIds: DetailEntry[];
  occupation?: DetailEntry[];
  addresses?: AddressEntry[];
  sensitivitySuppression?: DetailEntry[];
  fulfillmentPrefs?: DetailEntry[];
  other: DetailEntry[];
}

function DetailSection({
  title,
  entries,
}: {
  title: string;
  entries: DetailEntry[];
}) {
  const filtered = entries.filter(
    (e) => e.value != null && e.value !== "" && String(e.value).trim() !== "—"
  );
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

/**
 * Renders the same section layout and styling as the customer detail page:
 * Identity, Demographics, Contact & IDs, Occupation, Addresses,
 * Sensitivity & suppression, Fulfillment preferences, Other.
 */
export function CustomerDetailSections({
  identity,
  demographics,
  contactIds,
  occupation,
  addresses,
  sensitivitySuppression,
  fulfillmentPrefs,
  other,
}: CustomerDetailSectionsProps) {
  return (
    <div className="space-y-4">
      <DetailSection title="Identity" entries={identity} />
      <DetailSection title="Demographics" entries={demographics} />
      <DetailSection title="Contact & IDs" entries={contactIds} />
      {occupation && occupation.length > 0 && (
        <DetailSection title="Occupation" entries={occupation} />
      )}
      {addresses && addresses.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Addresses
          </h4>
          <div className="space-y-4">
            {addresses.map((addr, i) => (
              <div
                key={i}
                className="rounded border border-border/60 bg-background/60 p-3 text-sm"
              >
                {addr.typeLabel && (
                  <p className="font-medium text-foreground">{addr.typeLabel}</p>
                )}
                {addr.lines && (
                  <p className="text-muted-foreground mt-1">{addr.lines}</p>
                )}
                {addr.cityPostalCountry && (
                  <p className="text-muted-foreground">{addr.cityPostalCountry}</p>
                )}
                {addr.contactDetails && (
                  <p className="text-muted-foreground mt-1">
                    {addr.contactDetails}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {sensitivitySuppression && sensitivitySuppression.length > 0 && (
        <DetailSection
          title="Sensitivity & suppression"
          entries={sensitivitySuppression}
        />
      )}
      {fulfillmentPrefs && fulfillmentPrefs.length > 0 && (
        <DetailSection
          title="Fulfillment preferences"
          entries={fulfillmentPrefs}
        />
      )}
      <DetailSection title="Other" entries={other} />
    </div>
  );
}
