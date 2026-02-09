"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MOCK_BREAK_DOWN_TYPES } from "@/lib/product-wizard-mocks";

const schema = z.object({
  breakDownType: z.string().min(1, "Breakdown type is required"),
});

type FormValues = z.infer<typeof schema>;

interface PremiumAllocationFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_ALLOCATIONS = [
  { variantId: "homecontents", variantName: "Home Contents", percent: 60 },
  { variantId: "liability", variantName: "Liability", percent: 40 },
];

export function PremiumAllocationForm({ productId, onNext }: PremiumAllocationFormProps) {
  const [allocations, setAllocations] = useState(MOCK_ALLOCATIONS);
  const [totalError, setTotalError] = useState<string | null>(null);
  const { handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { breakDownType: "COVGVAR" },
  });

  const total = allocations.reduce((s, a) => s + a.percent, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const onSubmit = (values: FormValues) => {
    if (!isValid) {
      setTotalError("Total allocation must equal 100%");
      return;
    }
    setTotalError(null);
    console.log("Premium allocation (mock):", { breakDownType: values.breakDownType, allocations });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Premium allocation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Breakdown type *</Label>
            <Select value={watch("breakDownType")} onValueChange={(v) => setValue("breakDownType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOCK_BREAK_DOWN_TYPES.map((b) => <SelectItem key={b.code} value={b.code}>{b.description}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coverage variant</TableHead>
                <TableHead>Allocation %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((a, i) => (
                <TableRow key={a.variantId}>
                  <TableCell>{a.variantName}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={a.percent}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setAllocations((prev) => prev.map((p, j) => (j === i ? { ...p, percent: v } : p)));
                      }}
                      className="w-24"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className={isValid ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
            Total: {total.toFixed(1)}% {!isValid && "(must equal 100%)"}
          </p>
          {totalError && <p className="text-sm text-destructive">{totalError}</p>}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button variant="outline" asChild><Link href="/products">Back</Link></Button>
        <Button type="submit" disabled={!isValid}>Save & next</Button>
        <Button type="button" variant="secondary" onClick={onNext}>Next</Button>
      </div>
    </form>
  );
}
