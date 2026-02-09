import type { Metadata } from "next";
import { AppSidebar, SidebarTrigger } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { MigrationsProvider } from "@/contexts/migrations-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platform Admin Console",
  description: "Admin console for products, policies, and customers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex h-screen overflow-hidden bg-background text-foreground antialiased font-sans">
        <ThemeProvider>
          <MigrationsProvider>
            <SidebarProvider>
              <div className="flex flex-1 min-h-0 min-w-0">
                <AppSidebar />
                <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
                  <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
                    <div className="md:hidden flex items-center gap-2">
                      <SidebarTrigger />
                      <span className="font-semibold text-foreground">Platform Admin Console</span>
                    </div>
                    <div className="flex-1 min-w-0" />
                    <ModeToggle />
                  </header>
                  <main className="flex-1 overflow-auto min-h-0">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </MigrationsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
