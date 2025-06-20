import React from "react";
import { Mic, MicOff, Wand2 } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type VoiceMagicTextareaProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImprove: () => void;
  onMic: () => void;
  isImproving: boolean;
  isSupported: boolean;
  dictating: boolean;
  listening: boolean;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

export const VoiceMagicTextarea: React.FC<VoiceMagicTextareaProps> = ({
  value,
  onChange,
  onImprove,
  onMic,
  isImproving,
  isSupported,
  dictating,
  listening,
  disabled,
  placeholder,
  ariaLabel,
}) => {
  return (
    <div className="relative w-full">
      <textarea
        value={value}
        onChange={onChange}
        className="min-h-[180px] w-full rounded-lg border border-input bg-background px-4 py-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right text-base pr-24"
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <div className="absolute left-2 bottom-2 z-10 flex gap-3 pl-1.5 pb-1.5">
        {isSupported && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onMic}
                  aria-label={dictating && listening ? "Stop voice input" : "Start voice input"}
                  disabled={disabled}
                  className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50 relative"
                  tabIndex={-1}
                >
                  {dictating && listening ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5 text-primary" />}
                  {dictating && listening && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Dictate with your voice</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onImprove}
                disabled={isImproving || disabled}
                className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                tabIndex={-1}
              >
                <Wand2 className="w-5 h-5 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Automatically improve the text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}; 