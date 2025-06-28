"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Computer, LayoutDashboard, FileText, Users, Home, Building2, LogOutIcon, CheckSquare, BookOpen, Globe } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getLocaleFromPathname, switchLocale } from "@/lib/i18n/client";
import { useTranslations } from "next-intl";

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

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { authUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const currentLocale = getLocaleFromPathname(pathname);
  const t = useTranslations('dashboard.sidebar');

  const items = [
    {
      title: t('dashboard'),
      url: `/${currentLocale}/dashboard`,
      icon: Home,
    },
    {
      title: t('protocols'),
      url: `/${currentLocale}/dashboard/protocols`,
      icon: FileText,
    },
    {
      title: t('taskTracking'),
      url: `/${currentLocale}/dashboard/task-tracking`,
      icon: CheckSquare,
    },
    {
      title: t('futureTopics'),
      url: `/${currentLocale}/dashboard/future-topics`,
      icon: BookOpen,
    },
    {
      title: t('calendar'),
      url: `/${currentLocale}/dashboard/protocol-calendar`,
      icon: LayoutDashboard,
    },
    {
      title: t('aiProtocol'),
      url: `/${currentLocale}/dashboard/protocols/ai`,
      icon: Computer,
    },
    {
      title: t('committees'),
      url: `/${currentLocale}/dashboard/committees`,
      icon: Users,
    },
    {
      title: t('companies'),
      url: `/${currentLocale}/dashboard/companies`,
      icon: Building2,
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${currentLocale}/auth/login`);
  };

  const handleLanguageChange = (locale: string) => {
    const newPath = switchLocale(pathname, locale);
    router.push(newPath);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side={currentLocale === 'he' ? 'right' : 'left'}>
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
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className="size-4 mr-2" />
                    {t('language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {languages.map((language) => (
                      <DropdownMenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`cursor-pointer ${currentLocale === language.code ? 'bg-accent' : ''}`}
                      >
                        <span className="mr-2">{language.flag}</span>
                        <span>{language.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOutIcon className="size-4 text-destructive mr-2" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">{t('main')}</SidebarGroupLabel>
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
