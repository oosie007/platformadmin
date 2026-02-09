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
import {
  MOCK_POLICY_TYPES,
  MOCK_REFUND_TYPES,
  MOCK_RENEWAL_TYPES,
  MOCK_COUNTRIES,
  MOCK_STATES_US,
} from "@/lib/product-wizard-mocks";

const schema = z.object({
  policyType: z.string().min(1, "Policy type is required"),
  refundType: z.string().min(1),
  termEnd: z.string().min(1),
  renewalType: z.string().min(1),
  coolingPeriodDays: z.coerce.number().min(0).optional(),
  renewalNoticePeriodDays: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface MinPremiumRow {
  id: string;
  stateOrCountry: string;
  value: string;
}

interface PolicyConfigurationFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_MIN_PREMIUM: MinPremiumRow[] = [
  { id: "1", stateOrCountry: "IE", value: "100" },
  { id: "2", stateOrCountry: "US-CA", value: "150" },
];

export function PolicyConfigurationForm({ productId, onNext }: PolicyConfigurationFormProps) {
  const [rows, setRows] = useState<MinPremiumRow[]>(MOCK_MIN_PREMIUM);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      policyType: "STANDARD",
      refundType: "PRO_RATA",
      termEnd: "PERPETUAL",
      renewalType: "AUTO",
      coolingPeriodDays: 14,
      renewalNoticePeriodDays: 30,
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log("Policy configuration (mock):", values, "minPremium:", rows);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Policy settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Policy type *</Label>
              <Select value={watch("policyType")} onValueChange={(v) => setValue("policyType", v)}>
                <SelectTrigger className={errors.policyType ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOCK_POLICY_TYPES.map((p) => <SelectItem key={p.code} value={p.code}>{p.description}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.policyType && <p className="text-sm text-destructive">{errors.policyType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Refund type</Label>
              <Select value={watch("refundType")} onValueChange={(v) => setValue("refundType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOCK_REFUND_TYPES.map((r) => <SelectItem key={r.code} value={r.code}>{r.description}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term end</Label>
              <Input {...register("termEnd")} placeholder="e.g. PERPETUAL" />
            </div>
            <div className="space-y-2">
              <Label>Renewal type</Label>
              <Select value={watch("renewalType")} onValueChange={(v) => setValue("renewalType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOCK_RENEWAL_TYPES.map((r) => <SelectItem key={r.code} value={r.code}>{r.description}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cooling period (days)</Label>
              <Input type="number" {...register("coolingPeriodDays")} />
            </div>
            <div className="space-y-2">
              <Label>Renewal notice period (days)</Label>
              <Input type="number" {...register("renewalNoticePeriodDays")} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Minimum premium by state/country</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State / Country</TableHead>
                <TableHead>Minimum premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.stateOrCountry}</TableCell>
                  <TableCell>{r.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button variant="outline" asChild><Link href="/products">Back</Link></Button>
        <Button type="submit">Save & next</Button>
        <Button type="button" variant="secondary" onClick={onNext}>Next</Button>
      </div>
    </form>
  );
}
