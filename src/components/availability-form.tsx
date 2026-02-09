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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_COUNTRIES, MOCK_STATES_US } from "@/lib/product-wizard-mocks";
import { Checkbox } from "@/components/ui/checkbox";

const createSchema = z.object({
  country: z.string().min(1, "Country is required"),
  availabilityByStates: z.boolean(),
  states: z.array(z.string()).optional(),
  blacklistZipCodes: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

interface AvailabilityFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_AVAILABILITY_ROWS: { id: string; country: string; states: string; blacklist: string }[] = [
  { id: "1", country: "IE", states: "All", blacklist: "" },
  { id: "2", country: "US", states: "CA, NY, TX", blacklist: "90xxx" },
];

export function AvailabilityForm({ productId, onNext }: AvailabilityFormProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [rows, setRows] = useState(MOCK_AVAILABILITY_ROWS);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema) as Resolver<CreateFormValues>,
    defaultValues: { country: "", availabilityByStates: false, states: [], blacklistZipCodes: "" },
  });
  const availabilityByStates = watch("availabilityByStates");
  const country = watch("country");
  const isUS = country === "US";

  const onSubmit = (values: CreateFormValues) => {
    const zips = (values.blacklistZipCodes ?? "").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    console.log("Create availability (mock):", { ...values, blacklistZipCodes: zips });
    setRows((prev) => [...prev, { id: String(prev.length + 1), country: values.country, states: values.availabilityByStates ? "Selected" : "All", blacklist: values.blacklistZipCodes ?? "" }]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Availability records</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "Create availability"}
          </Button>
        </CardHeader>
        <CardContent>
          {showCreate ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={watch("country")} onValueChange={(v) => setValue("country", v)}>
                  <SelectTrigger className={errors.country ? "border-destructive" : ""}><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.description}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
              </div>
              {isUS && (
                <div className="flex items-center space-x-2">
                  <Switch checked={availabilityByStates} onCheckedChange={(v) => setValue("availabilityByStates", v)} />
                  <Label>Define availability by states</Label>
                </div>
              )}
              {isUS && availabilityByStates && (
                <div className="space-y-2">
                  <Label>Select states</Label>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_STATES_US.map((s) => {
                      const current = watch("states") ?? [];
                      const checked = current.includes(s.code);
                      return (
                        <div key={s.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={`state-${s.code}`}
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              setValue("states", isChecked ? [...current, s.code] : current.filter((x) => x !== s.code));
                            }}
                          />
                          <label htmlFor={`state-${s.code}`} className="text-sm">{s.description}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Excluded zip codes</Label>
                <Textarea {...register("blacklistZipCodes")} placeholder="One per line or comma-separated" rows={2} />
              </div>
              <Button type="submit">Save</Button>
            </form>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Blacklist</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.states}</TableCell>
                    <TableCell className="text-muted-foreground">{r.blacklist || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
