import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "~/lib/utils";

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (disabled) return;

      const digit = value.replace(/\D/g, "").slice(-1);
      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }

      const code = newValues.join("");
      if (code.length === length && newValues.every((v) => v !== "")) {
        onComplete(code);
      }
    },
    [disabled, values, length, focusInput, onComplete],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!values[index] && index > 0) {
          focusInput(index - 1);
          const newValues = [...values];
          newValues[index - 1] = "";
          setValues(newValues);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [values, focusInput, length],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      if (disabled) return;

      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pastedData) return;

      const newValues = [...values];
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
      }
      setValues(newValues);

      const nextIndex = Math.min(pastedData.length, length - 1);
      focusInput(nextIndex);

      if (pastedData.length === length) {
        onComplete(pastedData);
      }
    },
    [disabled, values, length, focusInput, onComplete],
  );

  useEffect(() => {
    focusInput(0);
  }, [focusInput]);

  return (
    <div className="flex gap-2 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-12 rounded-md border border-neutral-200 bg-white text-center text-lg font-semibold shadow-sm",
            "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
