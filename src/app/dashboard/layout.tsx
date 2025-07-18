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

// Translation mapping for breadcrumb items
const breadcrumbTranslations: Record<string, string> = {
  dashboard: "ראשי",
  protocols: "פרוטוקולים",
  "task-tracking": "מעקב משימות",
  "future-topics": "נושאים עתידיים",
  "protocol-calendar": "לוח שנה",
  committees: "ועדות",
  companies: "חברות",
  ai: "פרוטוקול AI",
  loading: "טוען...",
  protocol: "פרוטוקול",
};

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

  // Helper function to translate breadcrumb segments
  const translateSegment = (segment: string): string => {
    return breadcrumbTranslations[segment] || segment;
  };

  // Custom breadcrumb for protocol details page
  let customBreadcrumb: React.ReactNode = null;
  if (
    pathSegments[0] === "dashboard" &&
    pathSegments[1] === "protocols" &&
    pathSegments[2] === "protocol-task-tracking"
  ) {
    // Protocol task tracking page
    let protocolId = null;
    let protocolNumberText = breadcrumbTranslations.protocol;
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      protocolId = searchParams.get("protocolId");
      if ((window as any).__protocolNumber) {
        protocolNumberText = (window as any).__protocolNumber;
      }
    }
    customBreadcrumb = (
      <Breadcrumb className="rtl">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">{breadcrumbTranslations.dashboard}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/protocols">{breadcrumbTranslations.protocols}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {protocolId ? (
              <BreadcrumbLink href={`/dashboard/protocols/${protocolId}`}>{protocolNumberText}</BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{protocolNumberText}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>לוח משימות</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  } else if (
    pathSegments[0] === "dashboard" &&
    pathSegments[1] === "protocols" &&
    pathSegments.length === 3
  ) {
    // Format the display text
    let displayText = breadcrumbTranslations.loading; // Show loading initially
    if (protocolNumber) {
      displayText = protocolNumber;
    } else if (pathSegments[2]) {
      // If no protocol number but we have the ID, show a generic message
      displayText = breadcrumbTranslations.protocol;
    }
    
    customBreadcrumb = (
      <Breadcrumb className="rtl">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">{breadcrumbTranslations.dashboard}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/protocols">{breadcrumbTranslations.protocols}</BreadcrumbLink>
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
                      <BreadcrumbLink href="/dashboard">{breadcrumbTranslations.dashboard}</BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathSegments.slice(1).map((segment, index) => (
                      <React.Fragment key={segment}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {index === pathSegments.slice(1).length - 1 ? (
                            <BreadcrumbPage className="capitalize">
                              {translateSegment(segment)}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={`/${pathSegments
                                .slice(0, index + 2)
                                .join("/")}`}
                              className="capitalize"
                            >
                              {translateSegment(segment)}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            <div className="container mx-auto px-6 py-4 space-y-5 rtl flex-1">
              {children}
            </div>
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  );
}
