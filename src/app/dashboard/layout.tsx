"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { AppSidebar } from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [protocolNumber, setProtocolNumber] = React.useState<string | undefined>(undefined);

  const pathSegments = pathname.split("/").filter(Boolean);

  // Listen for protocol number updates
  React.useEffect(() => {
    const checkProtocolNumber = () => {
      if (typeof window !== "undefined" && (window as any).__protocolNumber) {
        setProtocolNumber((window as any).__protocolNumber);
      }
    };

    // Check immediately
    checkProtocolNumber();

    // Set up an interval to check for updates
    const interval = setInterval(checkProtocolNumber, 100);

    return () => clearInterval(interval);
  }, [pathname]);

  // Custom breadcrumb for protocol details page
  let customBreadcrumb: React.ReactNode = null;
  if (
    pathSegments[0] === "dashboard" &&
    pathSegments[1] === "protocols" &&
    pathSegments.length === 3
  ) {
    // Format the display text
    let displayText = "Loading..."; // Show loading initially
    if (protocolNumber) {
      displayText = protocolNumber;
    } else if (pathSegments[2]) {
      // If no protocol number but we have the ID, show a generic message
      displayText = "Protocol";
    }
    
    customBreadcrumb = (
      <Breadcrumb className="rtl">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/protocols">Protocols</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {displayText}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <div className="flex h-screen w-screen bg-background rtl">
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <div className="flex items-center gap-4 px-5 pt-5 rtl">
              <SidebarTrigger />
              {customBreadcrumb ?? (
                <Breadcrumb className="rtl">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathSegments.slice(1).map((segment, index) => (
                      <React.Fragment key={segment}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {index === pathSegments.slice(1).length - 1 ? (
                            <BreadcrumbPage className="capitalize">
                              {segment}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={`/${pathSegments
                                .slice(0, index + 2)
                                .join("/")}`}
                              className="capitalize"
                            >
                              {segment}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            <div className="container mx-auto overflow-auto px-6 py-4 space-y-5 rtl flex-1">
              {children}
            </div>
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  );
}
