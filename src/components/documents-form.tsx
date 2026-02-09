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

const docSchema = z.object({
  documentName: z.string().min(1, "Document name is required").max(200),
  documentType: z.string().min(1),
});

type DocFormValues = z.infer<typeof docSchema>;

interface DocumentsFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_DOC_TYPES = [
  { code: "POLICY", description: "Policy wording" },
  { code: "SCHEDULE", description: "Schedule" },
  { code: "TERMS", description: "Terms & conditions" },
];

const MOCK_DOCUMENTS: { id: string; name: string; type: string; uploadedAt: string }[] = [
  { id: "1", name: "Policy Wording v1.pdf", type: "Policy wording", uploadedAt: "2024-01-15" },
  { id: "2", name: "Schedule template.docx", type: "Schedule", uploadedAt: "2024-01-20" },
];

export function DocumentsForm({ productId, onNext }: DocumentsFormProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<DocFormValues>({
    resolver: zodResolver(docSchema) as Resolver<DocFormValues>,
    defaultValues: { documentName: "", documentType: "POLICY" },
  });

  const onSubmit = (values: DocFormValues) => {
    const typeLabel = MOCK_DOC_TYPES.find((t) => t.code === values.documentType)?.description ?? values.documentType;
    console.log("Add document (mock):", values);
    setShowAdd(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Documents</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "Add document"}
          </Button>
        </CardHeader>
        <CardContent>
          {showAdd && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 rounded-lg border border-border bg-muted/20">
              <div className="space-y-2">
                <Label>Document name *</Label>
                <Input {...register("documentName")} className={errors.documentName ? "border-destructive" : ""} placeholder="e.g. Policy Wording.pdf" />
                {errors.documentName && <p className="text-sm text-destructive">{errors.documentName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Document type</Label>
                <Select value={watch("documentType")} onValueChange={(v) => setValue("documentType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOCK_DOC_TYPES.map((t) => <SelectItem key={t.code} value={t.code}>{t.description}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Upload (mock)</Button>
            </form>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DOCUMENTS.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell className="text-muted-foreground">{d.uploadedAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Download</Button>
                  </TableCell>
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
