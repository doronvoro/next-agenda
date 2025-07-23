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
  const [protocolId, setProtocolId] = React.useState<string | null>(null);
  const [protocolNumberText, setProtocolNumberText] = React.useState<string>(breadcrumbTranslations.protocol);
  const [isClient, setIsClient] = React.useState(false);
  const pathSegments = pathname.split("/").filter(Boolean);

  React.useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setProtocolId(searchParams.get("protocolId"));
      if ((window as any).__protocolNumber) {
        setProtocolNumberText((window as any).__protocolNumber);
      } else {
        setProtocolNumberText(breadcrumbTranslations.protocol);
      }
    }
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
            {isClient ? (
              protocolId ? (
                <BreadcrumbLink href={`/dashboard/protocols/${protocolId}`}>{protocolNumberText}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{protocolNumberText}</BreadcrumbPage>
              )
            ) : (
              <BreadcrumbPage>{breadcrumbTranslations.loading}</BreadcrumbPage>
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
