"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getLocaleFromPathname } from "@/lib/i18n/client";

import { AppSidebar } from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [protocolNumber, setProtocolNumber] = React.useState<string | undefined>(undefined);
  const currentLocale = getLocaleFromPathname(pathname);
  const isRTL = currentLocale === 'he';
  const t = useTranslations("dashboard.protocols.breadcrumb");

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
      // If no protocol number but we have the ID, show translated "Protocol ID"
      displayText = t("protocolId");
    }
    
    customBreadcrumb = (
      <Breadcrumb dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "rtl" : ""}>
        <BreadcrumbList className={isRTL ? "flex-row-reverse" : ""}>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${pathSegments[0]}/dashboard`}>{t("dashboard")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${pathSegments[0]}/dashboard/protocols`}>{t("protocols")}</BreadcrumbLink>
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

  // Custom breadcrumb for AI protocol page
  if (
    pathSegments[0] === "dashboard" &&
    pathSegments[1] === "protocols" &&
    pathSegments[2] === "ai"
  ) {
    customBreadcrumb = (
      <Breadcrumb dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "rtl" : ""}>
        <BreadcrumbList className={isRTL ? "flex-row-reverse" : ""}>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${pathSegments[0]}/dashboard`}>{t("dashboard")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${pathSegments[0]}/dashboard/protocols`}>{t("protocols")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("aiProtocol")}</BreadcrumbPage>
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
        <div className={`flex h-screen w-screen bg-background ${isRTL ? 'flex-row-reverse' : ''}`} suppressHydrationWarning>
          {isRTL ? (
            <>
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center gap-4 px-5 pt-5">
                  <SidebarTrigger />
                  {customBreadcrumb ?? (
                    <Breadcrumb dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "rtl" : ""}>
                      <BreadcrumbList className={isRTL ? "flex-row-reverse" : ""}>
                        <BreadcrumbItem>
                          <BreadcrumbLink href={`/${pathSegments[0]}/dashboard`}>{t("dashboard")}</BreadcrumbLink>
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

                <div className={`container mx-auto overflow-auto px-6 py-4 space-y-5 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? "rtl" : "ltr"}>
                  {children}
                </div>
              </div>
              <AppSidebar />
            </>
          ) : (
            <>
              <AppSidebar />
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center gap-4 px-5 pt-5">
                  <SidebarTrigger />
                  {customBreadcrumb ?? (
                    <Breadcrumb dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "rtl" : ""}>
                      <BreadcrumbList className={isRTL ? "flex-row-reverse" : ""}>
                        <BreadcrumbItem>
                          <BreadcrumbLink href={`/${pathSegments[0]}/dashboard`}>{t("dashboard")}</BreadcrumbLink>
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

                <div className={`container mx-auto overflow-auto px-6 py-4 space-y-5 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? "rtl" : "ltr"}>
                  {children}
                </div>
              </div>
            </>
          )}
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  );
}
