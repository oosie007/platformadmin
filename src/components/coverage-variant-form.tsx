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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_COVERAGE_VARIANT_TYPES } from "@/lib/product-wizard-mocks";

const variantSchema = z.object({
  coverageVariantId: z.string().min(1, "ID is required").max(50),
  coverageVariantName: z.string().min(1, "Name is required").max(200),
  coverageVariantType: z.string().min(1),
  allocationPercent: z.coerce.number().min(0).max(100),
  description: z.string().max(1000).optional(),
});

type VariantFormValues = z.infer<typeof variantSchema>;

interface CoverageVariantFormProps {
  productId: string;
  routeSegment: string;
  onNext?: () => void;
}

const MOCK_VARIANTS: { id: string; name: string; type: string; allocation: number }[] = [
  { id: "homecontents", name: "Home Contents", type: "Core", allocation: 60 },
  { id: "liability", name: "Liability", type: "Optional", allocation: 40 },
];

export function CoverageVariantForm({ productId, routeSegment, onNext }: CoverageVariantFormProps) {
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema) as Resolver<VariantFormValues>,
    defaultValues: {
      coverageVariantId: "",
      coverageVariantName: "",
      coverageVariantType: "CORE",
      allocationPercent: 0,
      description: "",
    },
  });

  const onSubmit = (values: VariantFormValues) => {
    console.log("Coverage variant (mock):", values);
    setShowForm(false);
    reset();
  };

  const isDetails = routeSegment === "coveragevariant";
  const isInsuredType = routeSegment === "coveragevariant/insuredType";
  const isCoverageFactors = routeSegment === "coveragevariant/coverageFactors";
  const isSubCoverage = routeSegment === "coveragevariant/sub-coverage";
  const isLevels = routeSegment === "coveragevariant/coverage-variant-level-overview";
  const isExclusions = routeSegment === "coveragevariant/exclusions";
  const isInclusions = routeSegment === "coveragevariant/inclusions";

  const title =
    isDetails ? "Coverage variant details" :
    isInsuredType ? "Insured type" :
    isCoverageFactors ? "Coverage factors" :
    isSubCoverage ? "Subcoverages" :
    isLevels ? "Coverage variant levels" :
    isExclusions ? "Exclusions" :
    isInclusions ? "Include fixed coverages" : "Coverage variant";

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {isDetails && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Create variant"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isDetails && (
            <>
              {showForm ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Coverage variant ID *</Label>
                      <Input {...register("coverageVariantId")} className={errors.coverageVariantId ? "border-destructive" : ""} />
                      {errors.coverageVariantId && <p className="text-sm text-destructive">{errors.coverageVariantId.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Coverage variant name *</Label>
                      <Input {...register("coverageVariantName")} className={errors.coverageVariantName ? "border-destructive" : ""} />
                      {errors.coverageVariantName && <p className="text-sm text-destructive">{errors.coverageVariantName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select value={watch("coverageVariantType")} onValueChange={(v) => setValue("coverageVariantType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MOCK_COVERAGE_VARIANT_TYPES.map((t) => <SelectItem key={t.code} value={t.code}>{t.description}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Allocation %</Label>
                      <Input type="number" {...register("allocationPercent")} min={0} max={100} />
                      {errors.allocationPercent && <p className="text-sm text-destructive">{errors.allocationPercent.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea {...register("description")} rows={2} />
                  </div>
                  <Button type="submit">Save</Button>
                </form>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Allocation %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_VARIANTS.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono">{v.id}</TableCell>
                      <TableCell>{v.name}</TableCell>
                      <TableCell>{v.type}</TableCell>
                      <TableCell>{v.allocation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {!isDetails && (
            <p className="text-sm text-muted-foreground">
              Configure {title.toLowerCase()} for the selected coverage variant. Select a variant from the table in Coverage variant details first.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button variant="outline" asChild><Link href="/products">Back</Link></Button>
        <Button type="button" variant="secondary" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
