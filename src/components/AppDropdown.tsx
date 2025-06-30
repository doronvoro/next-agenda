import React from "react";
import { useRtl } from "@/context/RtlContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Option {
  value: string;
  label: string;
}

interface AppDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

const AppDropdown: React.FC<AppDropdownProps> = ({ label, value, onChange, options, placeholder }) => {
  const isRTL = useRtl();
  return (
    <div className="space-y-3 w-full">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full" dir={isRTL ? "rtl" : "ltr"}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "text-right" : "text-left"}>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className={isRTL ? "text-right" : "text-left"}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AppDropdown; 