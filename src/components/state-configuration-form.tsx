"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_STATES_US } from "@/lib/product-wizard-mocks";

interface StateConfigRow {
  id: string;
  state: string;
  effectiveDate: string;
  expiryDate: string;
  renewalNotification: string;
}

interface StateConfigurationFormProps {
  productId: string;
  onNext?: () => void;
}

const MOCK_STATE_ROWS: StateConfigRow[] = [
  { id: "1", state: "CA", effectiveDate: "2024-01-01", expiryDate: "", renewalNotification: "30" },
  { id: "2", state: "NY", effectiveDate: "2024-01-01", expiryDate: "2025-12-31", renewalNotification: "30" },
];

export function StateConfigurationForm({ productId, onNext }: StateConfigurationFormProps) {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">State configuration</CardTitle>
          <p className="text-sm text-muted-foreground">Only relevant for US country. Edit effective/expiry dates and renewal notification per state.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Effective date</TableHead>
                <TableHead>Expiry date</TableHead>
                <TableHead>Renewal notification (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_STATE_ROWS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{MOCK_STATES_US.find((s) => s.code === r.state)?.description ?? r.state}</TableCell>
                  <TableCell>{r.effectiveDate}</TableCell>
                  <TableCell>{r.expiryDate || "—"}</TableCell>
                  <TableCell>{r.renewalNotification}</TableCell>
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
