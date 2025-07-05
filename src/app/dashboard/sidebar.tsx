"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Computer, LayoutDashboard, FileText, Users, Home, Building2, LogOutIcon, CheckSquare, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "ראשי", // Dashboard
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "פרוטוקולים", // Protocols
    url: "/dashboard/protocols",
    icon: FileText,
  },
  {
    title: "מעקב משימות", // Task Tracking
    url: "/dashboard/task-tracking",
    icon: CheckSquare,
  },
  {
    title: "נושאים עתידיים", // Future Topics
    url: "/dashboard/future-topics",
    icon: BookOpen,
  },
  {
    title: "לוח שנה", // Calendar
    url: "/dashboard/protocol-calendar",
    icon: LayoutDashboard,
  },
  {
    title: "פרוטוקול AI", // AI Protocol
    url: "/dashboard/protocols/ai",
    icon: Computer,
  },
  {
    title: "ועדות", // Committees
    url: "/dashboard/committees",
    icon: Users,
  },
  {
    title: "חברות", // Companies
    url: "/dashboard/companies",
    icon: Building2,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { authUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="py-6 px-4 text-lg cursor-pointer hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarImage src={authUser?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-sm font-medium">
                      {authUser?.email?.split('@')[0].slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOutIcon className="size-4 text-destructive mr-2" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">ראשי</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url} passHref legacyBehavior>
                    <SidebarMenuButton
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary py-5 px-4 text-lg transition-all duration-150 cursor-pointer"
                      data-active={pathname === item.url}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
