"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { HelpCircle } from "lucide-react";
import {
  MOCK_STATUSES,
  MOCK_COUNTRIES,
  getCurrenciesForCountry,
  mockProductIdExists,
} from "@/lib/product-wizard-mocks";
import type { ProductRequest } from "../../product-wizard-spec/product-create.types";
import { Category } from "../../product-wizard-spec/product-create.types";

const productIdPattern = /^[a-zA-Z0-9_-]*$/;
const productVersionIdPattern = /^(?!00)\d+\.0{1,}$/;

const productDetailsSchema = z
  .object({
    productName: z
      .string()
      .min(1, "Product name is required")
      .max(500, "Max length is 500"),
    productId: z
      .string()
      .min(1, "Product ID is required")
      .max(10, "Max length is 10")
      .refine((v) => productIdPattern.test(v), {
        message: "Product ID allows only letters, numbers, underscore and hyphen.",
      }),
    description: z.string().max(2000, "Max length is 2000").default(""),
    marketingName: z.string().max(500, "Max length is 500").default(""),
    effectiveDate: z
      .string()
      .min(1, "Please enter / select valid date.")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Please enter / select valid date.")
      .refine((v) => new Date(v) >= new Date(new Date().setHours(0, 0, 0, 0)), "Effective Date shouldn't be past date."),
    expiryDate: z.string().optional().refine(
      (v) => {
        if (!v) return true;
        const d = new Date(v);
        return !Number.isNaN(d.getTime());
      },
      { message: "Please enter / select valid date." }
    ),
    status: z.string().min(1, "Status is required"),
    productVersionId: z
      .string()
      .min(1, "Product version is required")
      .regex(productVersionIdPattern, "Invalid product version (e.g. 1.0, 2.0)"),
    country: z.string().min(1, "Country is required"),
    premiumCurrency: z.string().min(1, "Premium Currency is required"),
    defineLimitsCurrency: z.boolean(),
    limitsCurrency: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.expiryDate) return true;
      const eff = new Date(data.effectiveDate);
      const exp = new Date(data.expiryDate);
      return exp > eff;
    },
    { message: "Expiry Date should be greater than Effective date.", path: ["expiryDate"] }
  )
  .refine(
    (data) => {
      if (!data.defineLimitsCurrency) return true;
      return (data.limitsCurrency ?? "").length > 0;
    },
    { message: "Limits Currency is required", path: ["limitsCurrency"] }
  )
  .refine(
    (data) => !mockProductIdExists(data.productId),
    { message: "Product ID already exists", path: ["productId"] }
  );

interface ProductDetailsFormValues {
  productName: string;
  productId: string;
  description: string;
  marketingName: string;
  effectiveDate: string;
  expiryDate: string;
  status: string;
  productVersionId: string;
  country: string;
  premiumCurrency: string;
  defineLimitsCurrency: boolean;
  limitsCurrency: string;
}

function buildProductRequest(values: ProductDetailsFormValues): ProductRequest {
  return {
    productId: values.productId.trim(),
    productVersionId: values.productVersionId.trim(),
    requestId: "1",
    header: {
      productName: values.productName.trim(),
      productVersionName: values.productName.trim(),
      shortName: values.productName.trim(),
      marketingName: (values.marketingName ?? "").trim() || undefined,
      description: (values.description ?? "").trim(),
      status: { value: values.status, category: Category.PRODUCTSTATUS },
      premiumCurrency: { value: values.premiumCurrency, category: Category.CURRENCY },
      limitsCurrency: values.defineLimitsCurrency && values.limitsCurrency
        ? { value: values.limitsCurrency, category: Category.CURRENCY }
        : null,
      effectiveDate: new Date(values.effectiveDate),
      expiryDate: values.expiryDate ? new Date(values.expiryDate) : undefined,
      country: [values.country],
    },
    rating: { premiumRatingFactors: [] },
  };
}

interface ProductDetailsFormProps {
  onNext?: () => void;
  /** Called after successful Save with the product ID to navigate to overview (e.g. /products/:productId/update). */
  onSaveSuccess?: (productId: string) => void;
  /** Mock product ID to use when no real API exists; passed to onSaveSuccess after Save. */
  mockProductIdAfterCreate?: string;
}

export function ProductDetailsForm({
  onNext,
  onSaveSuccess,
  mockProductIdAfterCreate = "mock-product-1",
}: ProductDetailsFormProps) {
  const [savedRequest, setSavedRequest] = useState<ProductRequest | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productDetailsSchema) as Resolver<ProductDetailsFormValues>,
    defaultValues: {
      productName: "",
      productId: "",
      description: "",
      marketingName: "",
      effectiveDate: "",
      expiryDate: "",
      status: "DESIGN",
      productVersionId: "1.0",
      country: "",
      premiumCurrency: "",
      defineLimitsCurrency: false,
      limitsCurrency: "",
    },
  });

  const defineLimitsCurrency = watch("defineLimitsCurrency");
  const country = watch("country");
  const currencies = getCurrenciesForCountry(country);

  const onSubmit = (values: ProductDetailsFormValues) => {
    const request = buildProductRequest(values);
    setSavedRequest(request);
    setSaveSuccess(true);
    // Placeholder: later call create product API here and use real productId from response.
    console.log("ProductRequest (mock submit):", request);
    onSaveSuccess?.(mockProductIdAfterCreate);
  };

  return (
    <TooltipProvider>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productName">Product name *</Label>
            <Input
              id="productName"
              {...register("productName")}
              className={errors.productName ? "border-destructive" : ""}
              placeholder="Enter product name"
            />
            {errors.productName && (
              <p className="text-sm text-destructive">{errors.productName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="productId">Product ID *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help items-center text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  A unique 10-digit number that helps identify the product. It cannot be a duplicate of an existing product ID.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="productId"
              {...register("productId")}
              className={errors.productId ? "border-destructive" : ""}
              placeholder="e.g. MY-PRODUCT-01"
              maxLength={10}
            />
            {errors.productId && (
              <p className="text-sm text-destructive">{errors.productId.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingName">Marketing name</Label>
          <Input
            id="marketingName"
            {...register("marketingName")}
            className={errors.marketingName ? "border-destructive" : ""}
            placeholder="Optional marketing name"
          />
          {errors.marketingName && (
            <p className="text-sm text-destructive">{errors.marketingName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Product description</Label>
          <Textarea
            id="description"
            {...register("description")}
            className={errors.description ? "border-destructive" : ""}
            placeholder="Optional description"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="effectiveDate">Effective date *</Label>
            <Input
              id="effectiveDate"
              type="date"
              {...register("effectiveDate")}
              className={errors.effectiveDate ? "border-destructive" : ""}
            />
            {errors.effectiveDate && (
              <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry date</Label>
            <Input
              id="expiryDate"
              type="date"
              {...register("expiryDate")}
              className={errors.expiryDate ? "border-destructive" : ""}
            />
            {errors.expiryDate && (
              <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help items-center text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  Delete: removed. Design: in progress. Final: finalized. Withdrawn: no longer available.
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={watch("status")}
              onValueChange={(v) => setValue("status", v)}
            >
              <SelectTrigger id="status" className={errors.status ? "border-destructive" : ""}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_STATUSES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="productVersionId">Product version *</Label>
            <Input
              id="productVersionId"
              {...register("productVersionId")}
              className={errors.productVersionId ? "border-destructive" : ""}
              placeholder="e.g. 1.0"
            />
            {errors.productVersionId && (
              <p className="text-sm text-destructive">{errors.productVersionId.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={watch("country") || undefined}
              onValueChange={(v) => {
                setValue("country", v);
                setValue("premiumCurrency", "");
                setValue("limitsCurrency", "");
              }}
            >
              <SelectTrigger id="country" className={errors.country ? "border-destructive" : ""}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.description} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="premiumCurrency">Premium currency *</Label>
            <Select
              onValueChange={(v) => setValue("premiumCurrency", v)}
              value={watch("premiumCurrency")}
            >
              <SelectTrigger id="premiumCurrency" className={errors.premiumCurrency ? "border-destructive" : ""}>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.description} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.premiumCurrency && (
              <p className="text-sm text-destructive">{errors.premiumCurrency.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="defineLimitsCurrency">Define limits and premium currency</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Turn on to manually input different currencies for premiums and limits (e.g. global products in USD).
              </p>
            </div>
            <Switch
              id="defineLimitsCurrency"
              checked={defineLimitsCurrency}
              onCheckedChange={(v) => setValue("defineLimitsCurrency", v)}
            />
          </div>
          {defineLimitsCurrency && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="limitsCurrency">Limits currency *</Label>
              <Select
                onValueChange={(v) => setValue("limitsCurrency", v)}
                value={watch("limitsCurrency")}
              >
                <SelectTrigger id="limitsCurrency" className={errors.limitsCurrency ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.description} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.limitsCurrency && (
                <p className="text-sm text-destructive">{errors.limitsCurrency.message}</p>
              )}
            </div>
          )}
        </div>

        {saveSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">Product details saved successfully.</p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/products">Back</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!savedRequest}
            onClick={onNext}
          >
            Next
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
}
