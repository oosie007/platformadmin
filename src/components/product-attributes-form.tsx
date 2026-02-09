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
import { MOCK_ATTRIBUTE_TYPES } from "@/lib/product-wizard-mocks";

const attributeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.string().min(1),
  value: z.string().optional(),
});

type AttributeFormValues = z.infer<typeof attributeSchema>;

interface ProductAttributesFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_ATTRIBUTES: { id: string; name: string; type: string; value: string }[] = [
  { id: "1", name: "PolicyType", type: "STRING", value: "Standard" },
  { id: "2", name: "MaxCoverage", type: "NUMBER", value: "1000000" },
];

export function ProductAttributesForm({ productId, onNext }: ProductAttributesFormProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema) as Resolver<AttributeFormValues>,
    defaultValues: { name: "", type: "STRING", value: "" },
  });

  const onSubmit = (values: AttributeFormValues) => {
    console.log("Product attribute (mock):", values);
    setShowAdd(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Product attributes</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "Add attribute"}
          </Button>
        </CardHeader>
        <CardContent>
          {showAdd && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 rounded-lg border border-border bg-muted/20">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...register("name")} className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MOCK_ATTRIBUTE_TYPES.map((t) => <SelectItem key={t.code} value={t.code}>{t.description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Value</Label>
                  <Input {...register("value")} />
                </div>
              </div>
              <Button type="submit">Save</Button>
            </form>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ATTRIBUTES.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell className="text-muted-foreground">{a.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button variant="outline" asChild><Link href="/products">Back</Link></Button>
        <Button type="button" variant="secondary" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
