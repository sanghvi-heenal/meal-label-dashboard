import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { ChoiceOption } from "@/components/onboarding/StepCard";

interface GoalPickerProps<T extends string> {
  options: ChoiceOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  cap?: number;
  placeholder?: string;
}

const GoalPicker = <T extends string>({
  options,
  selected,
  onToggle,
  cap = 3,
  placeholder = "Select your goals…",
}: GoalPickerProps<T>) => {
  const [open, setOpen] = useState(false);
  const [capFlash, setCapFlash] = useState(false);

  const atCap = selected.length >= cap;

  const handleToggle = (value: T) => {
    if (!selected.includes(value) && atCap) {
      setCapFlash(true);
      setTimeout(() => setCapFlash(false), 1200);
      return;
    }
    onToggle(value);
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <span className={cn("truncate", !selected.length && "text-muted-foreground")}>
              {selected.length
                ? `${selected.length} goal${selected.length > 1 ? "s" : ""} selected`
                : placeholder}
            </span>
            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandList>
              <CommandEmpty>No options.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = selected.includes(opt.value);
                  const disabled = !isSelected && atCap;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => handleToggle(opt.value)}
                      className={cn(
                        "flex items-start gap-3 cursor-pointer",
                        disabled && "opacity-50"
                      )}
                    >
                      <span className="text-xl leading-none mt-0.5">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {opt.label}
                        </div>
                        {opt.hint && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {opt.hint}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-primary shrink-0 mt-1" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p
        className={cn(
          "text-xs transition-colors",
          capFlash ? "text-destructive font-medium" : "text-muted-foreground"
        )}
      >
        Pick up to {cap} — we'll focus on these.
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const opt = options.find((o) => o.value === value);
            if (!opt) return null;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onToggle(value)}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
                <X size={12} className="opacity-70" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalPicker;
