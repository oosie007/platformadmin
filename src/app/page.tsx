"use client";

import Link from "next/link";
import { Package, FileText, Users, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const links = [
    {
      title: "Products",
      description: "Manage insurance products and create new ones.",
      href: "/products",
      icon: Package,
    },
    {
      title: "Policies",
      description: "Search and manage policies.",
      href: "/policies",
      icon: FileText,
    },
    {
      title: "Customers",
      description: "Search and manage customers.",
      href: "/customers",
      icon: Users,
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Platform admin console. Use the sidebar to navigate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Card
            key={item.href}
            className="border-border bg-card transition-colors hover:bg-muted/50"
          >
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </span>
              <div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={item.href}>
                  Open
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
