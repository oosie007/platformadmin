"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { FlatStep } from "@/lib/product-wizard-steps";
import { getStepIndexFromRoute } from "@/lib/product-wizard-steps";

/** Max height for the step list so it scrolls instead of being cut off. */
const STEP_LIST_MAX_HEIGHT = "min(60vh, 28rem)";

interface ProductWizardStepperProps {
  flatSteps: FlatStep[];
  productId: string;
}

export function ProductWizardStepper({ flatSteps, productId }: ProductWizardStepperProps) {
  const pathname = usePathname();
  const basePath = `/products/${productId}`;
  const pathSegment = pathname
    .replace(new RegExp(`^${basePath}/?`), "")
    .replace(/^\//, "")
    .trim() || "create";
  const currentIndex = getStepIndexFromRoute(flatSteps, pathSegment);

  return (
    <nav
      aria-label="Product wizard steps"
      className="flex flex-col gap-0 overflow-y-auto overflow-x-hidden rounded-md pr-1"
      style={{ maxHeight: STEP_LIST_MAX_HEIGHT }}
    >
      {flatSteps.map((step, index) => {
        const routePath = `${basePath}/${step.routeOrFunction}`;
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <Link
            key={step.routeOrFunction}
            href={routePath}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCurrent && "bg-muted font-medium text-foreground",
              !isCurrent && "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary bg-background text-foreground",
                !isCompleted && !isCurrent && "border-muted-foreground/30 bg-muted/30"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            {/* Allow label to wrap so full text is visible; min-w-0 lets flex child shrink. */}
            <span className="min-w-0 break-words">{step.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
