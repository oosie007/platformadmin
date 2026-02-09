"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStepContent } from "@/lib/product-wizard-step-content";

interface WizardStepPlaceholderProps {
  routeSegment: string;
  productId: string;
  onNext?: () => void;
  showBack?: boolean;
  backHref?: string;
  nextLabel?: string;
}

export function WizardStepPlaceholder({
  routeSegment,
  productId,
  onNext,
  showBack = true,
  backHref = "/products",
  nextLabel = "Next",
}: WizardStepPlaceholderProps) {
  const { title, description, specRef } = getStepContent(routeSegment);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className="text-xs text-muted-foreground mt-1">Spec: {specRef}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          This step is not yet fully implemented. Full form and validation will be added in a follow-up. You can navigate with Back and Next.
        </p>
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          {showBack && (
            <Button variant="outline" asChild>
              <Link href={backHref}>Back</Link>
            </Button>
          )}
          {onNext && (
            <Button type="button" variant="secondary" onClick={onNext}>
              {nextLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
