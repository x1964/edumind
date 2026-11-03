"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

interface PasswordFieldProps {
  label: string;
  showLabel: string;
  hideLabel: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  required?: boolean;
  inputProps?: ComponentProps<"input">;
}

export function PasswordField({
  label,
  showLabel,
  hideLabel,
  name,
  autoComplete = "current-password",
  minLength = 8,
  placeholder,
  defaultValue,
  hint,
  required = true,
  inputProps,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          dir="auto"
          className="px-9 text-start"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? <p className="text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}
