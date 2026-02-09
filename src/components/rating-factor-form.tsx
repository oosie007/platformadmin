"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ratingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  allowCustom: z.boolean(),
  answerValues: z.string().optional(),
});

type RatingFormValues = z.infer<typeof ratingSchema>;

interface RatingFactorFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_RATING_FACTORS: { id: string; name: string; allowCustom: boolean }[] = [
  { id: "1", name: "Age band", allowCustom: false },
  { id: "2", name: "Gender", allowCustom: false },
  { id: "3", name: "Occupation", allowCustom: true },
];

export function RatingFactorForm({ productId, onNext }: RatingFactorFormProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema) as Resolver<RatingFormValues>,
    defaultValues: { name: "", allowCustom: false, answerValues: "" },
  });

  const onSubmit = (values: RatingFormValues) => {
    console.log("Rating factor (mock):", values);
    setShowAdd(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Rating factors</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "Add rating factor"}
          </Button>
        </CardHeader>
        <CardContent>
          {showAdd && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 rounded-lg border border-border bg-muted/20">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...register("name")} className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={watch("allowCustom")} onCheckedChange={(v) => setValue("allowCustom", !!v)} />
                <Label>Allow custom values</Label>
              </div>
              <div className="space-y-2">
                <Label>Answer values (comma-separated)</Label>
                <Input {...register("answerValues")} placeholder="e.g. Yes, No, N/A" />
              </div>
              <Button type="submit">Save</Button>
            </form>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Allow custom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RATING_FACTORS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.allowCustom ? "Yes" : "No"}</TableCell>
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
