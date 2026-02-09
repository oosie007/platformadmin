"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Product {
  id: string;
  productCode: string;
  name: string;
  productClass: string;
  status: string;
  createdOn: string;
  description?: string;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  version?: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    productCode: "IPA-IE-PA",
    name: "Ireland Personal Accident",
    productClass: "Personal Accident",
    status: "Active",
    createdOn: "2024-01-15",
    description: "Personal accident cover for individuals in Ireland.",
    currency: "EUR",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2025-12-31",
    version: "2.1",
  },
  {
    id: "prod-2",
    productCode: "IPA-UK-PA",
    name: "UK Personal Accident",
    productClass: "Personal Accident",
    status: "Active",
    createdOn: "2024-02-20",
    description: "Personal accident cover for UK residents.",
    currency: "GBP",
    effectiveFrom: "2024-02-01",
    effectiveTo: "2025-12-31",
    version: "1.0",
  },
  {
    id: "prod-3",
    productCode: "TL-IE-TRAVEL",
    name: "Ireland Travel",
    productClass: "Travel",
    status: "Active",
    createdOn: "2024-03-10",
    description: "Travel insurance for trips originating in Ireland.",
    currency: "EUR",
    effectiveFrom: "2024-03-01",
    version: "1.2",
  },
  {
    id: "prod-4",
    productCode: "HH-IE-HOME",
    name: "Ireland Home",
    productClass: "Home",
    status: "Draft",
    createdOn: "2025-01-08",
    description: "Home insurance product for Irish market.",
    currency: "EUR",
    effectiveFrom: "2025-02-01",
    version: "0.9",
  },
  {
    id: "prod-5",
    productCode: "PA-EMEA-BUNDLE",
    name: "EMEA Personal Accident Bundle",
    productClass: "Personal Accident",
    status: "Active",
    createdOn: "2024-06-01",
    description: "Multi-country personal accident product for EMEA.",
    currency: "EUR",
    effectiveFrom: "2024-06-01",
    effectiveTo: "2026-05-31",
    version: "1.0",
  },
];

function filterProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.productCode.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.productClass.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false)
  );
}

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => filterProducts(MOCK_PRODUCTS, query), [query]);
  const showResults = hasSearched;

  const handleSearch = () => {
    setHasSearched(true);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-1 text-muted-foreground">
            Search and view product definitions created in the system.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Link>
        </Button>
      </div>

      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Enter a product code, name, or class to filter the list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="product-query">Product</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="product-query"
                  placeholder="e.g. IPA-IE-PA, Personal Accident, or Ireland"
                  className="pl-8 bg-background"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("products-search-btn")?.click();
                    }
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Button
                id="products-search-btn"
                type="button"
                className="w-full md:w-auto"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {!showResults
              ? "Click Search to see products."
              : `Showing ${filteredProducts.length.toLocaleString()} product${filteredProducts.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Enter a search term and click Search.
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products match your search.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10 text-muted-foreground" aria-label="Expand" />
                  <TableHead className="text-muted-foreground">Product code</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Class</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isExpanded = expandedId === product.id;
                  return (
                    <Fragment key={product.id}>
                      <TableRow
                        className="border-border cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedId(isExpanded ? null : product.id)}
                      >
                        <TableCell className="w-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={isExpanded ? "Collapse" : "Expand details"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(isExpanded ? null : product.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.productCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.productClass}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.status}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {product.createdOn}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="border-border bg-muted/5">
                          <TableCell colSpan={6} className="p-4 align-top">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-3">
                                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                  Details
                                </h4>
                                <dl className="space-y-2 text-sm">
                                  <div className="grid grid-cols-[8rem_1fr] gap-x-4">
                                    <dt className="text-muted-foreground">Description</dt>
                                    <dd>{product.description ?? "—"}</dd>
                                  </div>
                                  <div className="grid grid-cols-[8rem_1fr] gap-x-4">
                                    <dt className="text-muted-foreground">Currency</dt>
                                    <dd>{product.currency ?? "—"}</dd>
                                  </div>
                                  <div className="grid grid-cols-[8rem_1fr] gap-x-4">
                                    <dt className="text-muted-foreground">Version</dt>
                                    <dd>{product.version ?? "—"}</dd>
                                  </div>
                                </dl>
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                  Effective period
                                </h4>
                                <dl className="space-y-2 text-sm">
                                  <div className="grid grid-cols-[8rem_1fr] gap-x-4">
                                    <dt className="text-muted-foreground">From</dt>
                                    <dd className="tabular-nums">{product.effectiveFrom ?? "—"}</dd>
                                  </div>
                                  <div className="grid grid-cols-[8rem_1fr] gap-x-4">
                                    <dt className="text-muted-foreground">To</dt>
                                    <dd className="tabular-nums">{product.effectiveTo ?? "—"}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
