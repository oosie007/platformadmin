"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Settings,
  ChevronDown,
  Server,
  Menu,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  ENV_COOKIE_NAME,
  ENV_KEYS,
  ENV_LABELS,
  isValidEnvKey,
  type EnvKey,
} from "@/lib/env-constants";
import { useSidebar } from "@/contexts/sidebar-context";
import { logAudit } from "@/lib/audit-client";

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Policies", href: "/policies", icon: FileText },
  { label: "Customers", href: "/customers", icon: Users },
];

function getEnvFromCookie(): EnvKey {
  if (typeof document === "undefined") return "sit";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ENV_COOKIE_NAME}=`));
  const value = match?.split("=")[1]?.trim().toLowerCase();
  return isValidEnvKey(value) ? value : "sit";
}

function setEnvCookie(envKey: EnvKey) {
  document.cookie = `${ENV_COOKIE_NAME}=${envKey}; path=/; max-age=31536000; SameSite=Lax`;
}

function ChubbLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center text-foreground", className)} aria-hidden>
      <svg
        width="157"
        height="16"
        viewBox="0 0 157 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-auto shrink-0"
      >
        <path
          d="M21.6232 2.86698V0.011922H4.05722C1.35995 0.011922 0 1.40517 0 3.66633V12.3456C0 14.6068 1.35995 16 4.05722 16H21.6232V13.1451H3.0599V2.86698H21.6232ZM33.3414 6.54421V0.011922H30.3496V16H33.3414V9.35351H49.3209V16H52.3128V0.011922H49.3209V6.54421H33.3414ZM81.3705 0.011922V13.1451H65.6178V0.011922H62.6259V12.3456C62.6259 14.6068 63.9857 16 66.6831 16H80.3052C83.0026 16 84.3623 14.6068 84.3623 12.3456V0.011922H81.3705ZM113.079 16C116.026 16 117.386 14.7667 117.386 12.6426V10.7697C117.386 10.1758 117.182 9.90176 116.751 9.53622L114.847 7.89179L116.751 6.24727C117.182 5.88182 117.386 5.60771 117.386 5.0139V3.36947C117.386 1.24526 116.026 0.011922 113.079 0.011922H94.6744V16H113.079ZM97.6663 2.72991H114.326V6.61269H97.6663V2.72991ZM114.326 13.2821H97.6663V9.28503H114.326V13.2821ZM145.265 16C148.211 16 149.571 14.7667 149.571 12.6426V10.7697C149.571 10.1758 149.367 9.90176 148.936 9.53622L147.032 7.89179L148.936 6.24727C149.367 5.88182 149.571 5.60771 149.571 5.0139V3.36947C149.571 1.24526 148.211 0.011922 145.265 0.011922H126.86V16H145.265ZM129.852 2.72991H146.511V6.61269H129.852V2.72991ZM146.511 13.2821H129.852V9.28503H146.511V13.2821Z"
          fill="currentColor"
        />
        <path
          d="M155.044 2.04755C155.135 2.04171 155.215 2.02515 155.285 1.99774C155.355 1.97041 155.411 1.92654 155.453 1.86586C155.496 1.80544 155.517 1.72234 155.517 1.61695C155.517 1.52716 155.501 1.45494 155.468 1.40011C155.435 1.34562 155.391 1.30167 155.334 1.26832C155.278 1.23521 155.215 1.21264 155.145 1.20093C155.076 1.18922 155.002 1.18346 154.924 1.18346H154.36V2.05638H154.768C154.86 2.05638 154.953 2.05342 155.044 2.04755ZM154.052 3.43902V0.919777H155.012C155.294 0.919777 155.501 0.979347 155.631 1.09849C155.761 1.21766 155.826 1.39053 155.826 1.61695C155.826 1.72634 155.809 1.82198 155.776 1.90406C155.743 1.98603 155.698 2.05544 155.64 2.11206C155.581 2.16865 155.514 2.21356 155.439 2.24673C155.363 2.28 155.283 2.30435 155.197 2.31988L155.942 3.43902H155.581L154.878 2.31988H154.36V3.43902H154.052ZM154.107 0.456911C153.885 0.554589 153.692 0.68742 153.529 0.85536C153.366 1.02323 153.239 1.22055 153.148 1.44697C153.057 1.67355 153.012 1.91779 153.012 2.17943C153.012 2.44116 153.057 2.68524 153.148 2.91173C153.239 3.13833 153.366 3.33556 153.529 3.50352C153.692 3.67146 153.885 3.8042 154.107 3.90188C154.33 3.99956 154.574 4.04836 154.837 4.04836C155.097 4.04836 155.338 3.99956 155.561 3.90188C155.784 3.8042 155.977 3.67146 156.139 3.50352C156.302 3.33556 156.43 3.13833 156.523 2.91173C156.616 2.68524 156.663 2.44116 156.663 2.17943C156.663 1.91779 156.616 1.67355 156.523 1.44697C156.43 1.22055 156.302 1.02323 156.139 0.85536C155.977 0.68742 155.784 0.554589 155.561 0.456911C155.338 0.359319 155.097 0.310524 154.837 0.310524C154.574 0.310524 154.33 0.359319 154.107 0.456911ZM155.692 0.167004C155.955 0.278283 156.184 0.432557 156.378 0.629782C156.572 0.827095 156.724 1.05854 156.835 1.32398C156.945 1.58971 157 1.87468 157 2.17943C157 2.488 156.945 2.77408 156.835 3.03759C156.724 3.30128 156.572 3.53076 156.378 3.72612C156.184 3.92148 155.955 4.07467 155.692 4.18592C155.428 4.29727 155.143 4.35284 154.837 4.35284C154.531 4.35284 154.246 4.29727 153.983 4.18592C153.719 4.07467 153.49 3.92148 153.297 3.72612C153.103 3.53076 152.951 3.30128 152.84 3.03759C152.73 2.77408 152.674 2.488 152.674 2.17943C152.674 1.87468 152.73 1.58971 152.84 1.32398C152.951 1.05854 153.103 0.827095 153.297 0.629782C153.49 0.432557 153.719 0.278283 153.983 0.167004C154.246 0.05566 154.531 0 154.837 0C155.143 0 155.428 0.05566 155.692 0.167004Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/** Collapsed sidebar: replace with your Chubb icon (e.g. /chubb-icon.svg) when ready. */
function ChubbIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-bold text-foreground",
        className
      )}
      aria-hidden
    >
      C
    </span>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onNavClick?: () => void;
  headerExtra?: React.ReactNode;
  /** Desktop: collapse/expand button to show in header next to logo. */
  sidebarToggle?: React.ReactNode;
}

function SidebarContent({ collapsed, onNavClick, headerExtra, sidebarToggle }: SidebarContentProps) {
  const pathname = usePathname();
  const [envKey, setEnvKey] = useState<EnvKey>("sit");

  useEffect(() => {
    setEnvKey(getEnvFromCookie());
  }, []);

  const handleEnvChange = (value: string) => {
    if (!isValidEnvKey(value)) return;
    logAudit({
      action: "environment.change",
      outcome: "info",
      subject: value,
      details: { from: envKey, to: value },
    });
    setEnvCookie(value);
    setEnvKey(value);
    // Reload after a brief delay so the cookie is committed; clears client state (errors/results) and ensures all API calls use the new env.
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  return (
    <>
      <div className={cn("flex h-14 items-center border-b border-border gap-2", collapsed ? "justify-center px-2" : "px-4")}>
        {collapsed ? <ChubbIcon /> : <ChubbLogo className="shrink-0" />}
        {!collapsed && <span className="flex-1 min-w-0" />}
        {sidebarToggle}
        {!collapsed && headerExtra}
      </div>
      <div className={cn("border-b border-border pb-4 pt-4", collapsed ? "px-2" : "px-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              title={ENV_LABELS[envKey]}
              className={cn(
                "h-auto w-full rounded-lg px-3 py-2.5",
                collapsed ? "w-10 justify-center p-0" : "justify-start gap-3"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Server className="size-4 text-muted-foreground" />
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {ENV_LABELS[envKey]}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Environment
                    </span>
                  </span>
                  <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-popper-anchor-width)] min-w-[14rem]"
            align={collapsed ? "center" : "start"}
            sideOffset={4}
          >
            {ENV_KEYS.map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleEnvChange(key)}
                className={cn(
                  "cursor-pointer",
                  envKey === key && "bg-muted font-medium"
                )}
              >
                <span>{ENV_LABELS[key]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-4">
        {nav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/products" && pathname.startsWith("/products")) ||
            (item.href === "/policies" && pathname.startsWith("/policies")) ||
            (item.href === "/customers" && pathname.startsWith("/customers"));
          const isSubItem = "parent" in item && item.parent;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              title={item.label}
              className={cn(
                "font-normal",
                collapsed ? "h-10 w-10 justify-center p-0" : "justify-start",
                isActive && "bg-muted text-foreground",
                !collapsed && isSubItem && "ml-6"
              )}
              asChild
            >
              <Link href={item.href} onClick={onNavClick}>
                <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
      <Separator />
      <div className={cn("flex flex-col gap-0.5 p-2", collapsed ? "items-center" : "")}>
        <Button
          variant={pathname.startsWith("/settings") ? "secondary" : "ghost"}
          title="Settings"
          className={cn(
            "font-normal",
            collapsed ? "h-10 w-10 justify-center p-0" : "justify-start",
            pathname.startsWith("/settings") && "bg-muted text-foreground"
          )}
          asChild
        >
          <Link href="/settings">
            <Settings className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Settings"}
          </Link>
        </Button>
      </div>
    </>
  );
}

export function SidebarTrigger() {
  const { setMobileOpen } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={() => setMobileOpen(true)}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

export function AppSidebar() {
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed } = useSidebar();

  const sidebarToggleButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0"
      onClick={() => setCollapsed(!collapsed)}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <>
      {/* Desktop: visible from md up. Hidden on mobile so no flash. */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full border-r border-border bg-card shrink-0 transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent collapsed={collapsed} sidebarToggle={sidebarToggleButton} />
      </aside>

      {/* Mobile: overlay sheet. Only open when user taps menu. */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-56 p-0 flex flex-col [&>button]:hidden"
          showCloseButton={false}
        >
          <SidebarContent
            collapsed={false}
            onNavClick={() => setMobileOpen(false)}
            headerExtra={
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto shrink-0"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            }
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
