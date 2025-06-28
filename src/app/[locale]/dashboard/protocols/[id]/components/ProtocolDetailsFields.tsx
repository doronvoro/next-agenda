import React from "react";
import type { Protocol } from "../types";
import { Calendar, Users, Hash, ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n/client";
import { useTranslations } from "next-intl";

const Field = ({ label, value, icon, className }: { label: string; value: React.ReactNode; icon?: React.ReactNode; className?: string }) => {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const isRTL = currentLocale === 'he';
  
  return (
    <div className={`flex items-start gap-3 ${className || ''} ${isRTL ? 'flex-row-reverse' : ''}`}>
      {icon && (
        <div className="flex items-center justify-center w-5 h-5 text-muted-foreground mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div className={`text-sm font-medium text-muted-foreground mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{label}</div>
        <div className={`text-base text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{value}</div>
      </div>
    </div>
  );
};

interface ProtocolDetailsFieldsProps {
  protocol: Protocol;
  formatDate: (dateString: string) => string;
  company?: { name?: string | null; number?: string | null; address?: string | null };
  protocolMembers?: { status: number }[];
}

export const ProtocolDetailsFields: React.FC<ProtocolDetailsFieldsProps> = ({ protocol, formatDate, company, protocolMembers }) => {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const isRTL = currentLocale === 'he';
  const t = useTranslations("dashboard.protocols");
  
  const total = protocolMembers ? protocolMembers.length : 0;
  const present = protocolMembers ? protocolMembers.filter(m => m.status === 2).length : 0;
  const absent = protocolMembers ? protocolMembers.filter(m => m.status !== 2).length : 0;
  return (
    <div className="space-y-6">
      {company && (
        <div className={`text-center pb-6 border-b border-border ${isRTL ? 'rtl' : 'ltr'}`}>
          <h1 className="text-2xl font-bold text-foreground mb-2">{company.name || ''}</h1>
          {company.number && (
            <div className="text-sm text-muted-foreground mb-1">{t("companyNumber")} {company.number}</div>
          )}
          {company.address && (
            <div className="text-sm text-muted-foreground mb-3">{company.address}</div>
          )}
          <div className="text-lg font-semibold text-foreground">
            {t("protocol")} {protocol.committee?.name || ''} {t("protocolNumber")} {protocol.number}
          </div>
        </div>
      )}
      
      <div className="w-full flex justify-center">
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl w-full justify-items-center ${isRTL ? 'rtl' : 'ltr'}`}>
          <Field 
            label={t("meetingDate")} 
            value={formatDate(protocol.due_date)}
            icon={<Calendar className="h-4 w-4" />}
            className={isRTL ? 'order-4' : 'order-1'}
          />
          <Field 
            label={t("protocolNumber")} 
            value={`#${protocol.number}`}
            icon={<Hash className="h-4 w-4" />}
            className={isRTL ? 'order-3' : 'order-2'}
          />
          <Field 
            label={t("committee")} 
            value={protocol.committee?.name || t("noCommittee")}
            icon={<Users className="h-4 w-4" />}
            className={isRTL ? 'order-2' : 'order-3'}
          />
          <Field
            label={t("members")}
            value={
              <span className="truncate block max-w-[150px]" title={`${t("total")}: ${total}, ${t("present")}: ${present}, ${t("absent")}: ${absent}`}>
                {`${t("total")}: ${total}, ${t("present")}: ${present}, ${t("absent")}: ${absent}`}
              </span>
            }
            icon={<Users className="h-4 w-4" />}
            className={`justify-end ${isRTL ? 'text-right order-1' : 'text-left order-4'}`}
          />
        </div>
      </div>
    </div>
  ); 
} 