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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MOCK_STATUSES,
  MOCK_COUNTRIES,
  getCurrenciesForCountry,
  MOCK_PRODUCT_VERSIONS,
} from "@/lib/product-wizard-mocks";

const schema = z.object({
  productName: z.string().min(1, "Product name is required").max(500),
  productId: z.string().min(1).max(10),
  description: z.string().max(2000).default(""),
  marketingName: z.string().max(500).default(""),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expiryDate: z.string().optional(),
  status: z.string().min(1),
  productVersionId: z.string().min(1),
  country: z.string().min(1),
  premiumCurrency: z.string().min(1),
  defineLimitsCurrency: z.boolean(),
  limitsCurrency: z.string().optional(),
}).refine(
  (d) => !d.defineLimitsCurrency || (d.limitsCurrency ?? "").length > 0,
  { message: "Limits currency required when toggle is on", path: ["limitsCurrency"] }
);

type FormValues = z.infer<typeof schema>;

interface ProductOverviewFormProps {
  productId: string;
  onNext?: () => void;
}

export function ProductOverviewForm({ productId, onNext }: ProductOverviewFormProps) {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      productName: "Sample Product",
      productId: "PROD-01",
      description: "",
      marketingName: "",
      effectiveDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      status: "DESIGN",
      productVersionId: "1.0",
      country: "IE",
      premiumCurrency: "EUR",
      defineLimitsCurrency: false,
      limitsCurrency: "",
    },
  });
  const defineLimitsCurrency = watch("defineLimitsCurrency");
  const country = watch("country");
  const currencies = getCurrenciesForCountry(country);

  const onSubmit = (values: FormValues) => {
    console.log("ProductOverview (mock save):", values);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Product version</Label>
          <Select value={watch("productVersionId")} onValueChange={(v) => setValue("productVersionId", v)}>
            <SelectTrigger><SelectValue placeholder="Select version" /></SelectTrigger>
            <SelectContent>
              {MOCK_PRODUCT_VERSIONS.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Product name *</Label>
          <Input {...register("productName")} className={errors.productName ? "border-destructive" : ""} />
          {errors.productName && <p className="text-sm text-destructive">{errors.productName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Product ID *</Label>
          <Input {...register("productId")} readOnly className="bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Marketing name</Label>
        <Input {...register("marketingName")} />
      </div>
      <div className="space-y-2">
        <Label>Product description</Label>
        <Textarea {...register("description")} rows={3} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Effective date *</Label>
          <Input type="date" {...register("effectiveDate")} className={errors.effectiveDate ? "border-destructive" : ""} />
          {errors.effectiveDate && <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Expiry date</Label>
          <Input type="date" {...register("expiryDate")} />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_STATUSES.map((s) => <SelectItem key={s.code} value={s.code}>{s.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Product version *</Label>
          <Input {...register("productVersionId")} />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country *</Label>
          <Select value={watch("country")} onValueChange={(v) => setValue("country", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Premium currency *</Label>
          <Select value={watch("premiumCurrency")} onValueChange={(v) => setValue("premiumCurrency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4">
        <div>
          <Label>Define limits and premium currency</Label>
          <p className="text-xs text-muted-foreground">Turn on to use a different currency for limits.</p>
        </div>
        <Switch checked={defineLimitsCurrency} onCheckedChange={(v) => setValue("defineLimitsCurrency", v)} />
      </div>
      {defineLimitsCurrency && (
        <div className="space-y-2">
          <Label>Limits currency *</Label>
          <Select value={watch("limitsCurrency")} onValueChange={(v) => setValue("limitsCurrency", v)}>
            <SelectTrigger className={errors.limitsCurrency ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.description}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.limitsCurrency && <p className="text-sm text-destructive">{errors.limitsCurrency.message}</p>}
        </div>
      )}

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Availability summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No availability records yet. Configure in the Availability step.
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Policy config summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Policy configuration not set. Configure in the Policy configuration step.
        </CardContent>
      </Card>

      {saved && <p className="text-sm text-green-600 dark:text-green-400">Changes saved.</p>}
      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button variant="outline" asChild><Link href="/products">Back</Link></Button>
        <Button type="submit">Save & next</Button>
        <Button type="button" variant="secondary" onClick={onNext}>Next</Button>
      </div>
    </form>
  );
}
