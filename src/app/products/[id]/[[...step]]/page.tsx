"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductWizardStepper } from "@/components/product-wizard-stepper";
import {
  defaultFlatSteps,
  getRouteFromStepIndex,
  getStepIndexFromRoute,
} from "@/lib/product-wizard-steps";
import { ProductDetailsForm } from "@/components/product-details-form";
import { ProductOverviewForm } from "@/components/product-overview-form";
import { AvailabilityForm } from "@/components/availability-form";
import { PolicyConfigurationForm } from "@/components/policy-configuration-form";
import { StateConfigurationForm } from "@/components/state-configuration-form";
import { CoverageVariantForm } from "@/components/coverage-variant-form";
import { ProductAttributesForm } from "@/components/product-attributes-form";
import { RatingFactorForm } from "@/components/rating-factor-form";
import { PremiumAllocationForm } from "@/components/premium-allocation-form";
import { DocumentsForm } from "@/components/documents-form";
import { WizardStepPlaceholder } from "@/components/wizard-step-placeholder";
import { getStepContent } from "@/lib/product-wizard-step-content";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mock product ID returned after create (replace with real API response later). */
const MOCK_PRODUCT_ID_AFTER_CREATE = "mock-product-1";

export default function ProductWizardStepPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params.id as string) ?? "new";
  const stepParam = params.step as string[] | undefined;
  const routeSegment = stepParam?.join("/") ?? "";

  const isCreateFlow = id === "new";
  const effectiveSegment = routeSegment || (isCreateFlow ? "create" : "update");

  useEffect(() => {
    if (routeSegment === "" && id) {
      router.replace(`/products/${id}/${isCreateFlow ? "create" : "update"}`);
    }
  }, [routeSegment, id, isCreateFlow, router]);

  const currentIndex = getStepIndexFromRoute(defaultFlatSteps, effectiveSegment);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < defaultFlatSteps.length) {
      const nextRoute = getRouteFromStepIndex(defaultFlatSteps, nextIndex);
      router.push(`/products/${id}/${nextRoute}`);
    }
  };

  const handleSaveSuccess = (productId: string) => {
    router.push(`/products/${productId}/update`);
  };

  const backHref = "/products";

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href={backHref} aria-label="Back to products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isCreateFlow ? "Create product" : "Edit product"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Step {currentIndex + 1} of {defaultFlatSteps.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <Card className="border-border bg-card flex flex-col min-h-0">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-base">Steps</CardTitle>
              <CardDescription className="text-xs">
                Complete each section to configure your product.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-h-0 flex-1 flex flex-col">
              <ProductWizardStepper flatSteps={defaultFlatSteps} productId={id} />
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 flex-1">
          {effectiveSegment === "create" ? (
            <ProductDetailsForm
              onNext={handleNext}
              onSaveSuccess={handleSaveSuccess}
              mockProductIdAfterCreate={MOCK_PRODUCT_ID_AFTER_CREATE}
            />
          ) : effectiveSegment === "update" ? (
            <ProductOverviewForm productId={id} onNext={handleNext} />
          ) : effectiveSegment === "availability" ? (
            <AvailabilityForm productId={id} onNext={handleNext} />
          ) : effectiveSegment === "policyconfiguration" ? (
            <PolicyConfigurationForm productId={id} onNext={handleNext} />
          ) : effectiveSegment === "stateconfiguration" ? (
            <StateConfigurationForm productId={id} onNext={handleNext} />
          ) : effectiveSegment.startsWith("coveragevariant") ? (
            <CoverageVariantForm productId={id} routeSegment={effectiveSegment} onNext={handleNext} />
          ) : effectiveSegment === "product-attributes" ? (
            <ProductAttributesForm productId={id} onNext={handleNext} />
          ) : effectiveSegment === "ratingfactor" ? (
            <RatingFactorForm productId={id} onNext={handleNext} />
          ) : effectiveSegment === "premium-allocation" ? (
            <PremiumAllocationForm productId={id} onNext={handleNext} />
          ) : effectiveSegment === "documents" ? (
            <DocumentsForm productId={id} onNext={handleNext} />
          ) : (
            <WizardStepPlaceholder
              routeSegment={effectiveSegment}
              productId={id}
              onNext={handleNext}
              backHref={backHref}
            />
          )}
        </div>
      </div>
    </div>
  );
}
