import { Dot } from "lucide-react";
import { isValidElement } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "~/lib/utils";

import type { ReactNode } from "react";

type CategoryChipProps = {
  category: string | Record<string, string> | ReactNode | null | undefined;
  color?: string;
  className?: string;
  textClassName?: string;
};

const getCategoryDisplayValue = (
  category: string | Record<string, string> | ReactNode | null | undefined,
  language: string,
): ReactNode => {
  if (!category) return "";
  if (typeof category === "string") return category;
  // Check if it's a React element
  if (isValidElement(category)) return category;
  // Otherwise treat it as a localized record
  if (typeof category === "object" && category !== null) {
    const record = category as Record<string, string>;
    return record[language] || record.en || Object.values(record)[0] || "";
  }
  return "";
};

export const CategoryChip = ({
  category,
  color = "text-primary-700",
  className,
  textClassName,
}: CategoryChipProps) => {
  const { i18n } = useTranslation();
  const dotClasses = cn("flex-shrink-0", color);
  const displayValue = getCategoryDisplayValue(category, i18n.language);

  if (!displayValue) return null;

  return (
    <div
      className={cn("flex max-w-fit items-center gap-2 rounded-lg bg-white px-2 py-1", className)}
    >
      <Dot size={8} strokeWidth={4} className={dotClasses} absoluteStrokeWidth />
      <p className={cn("truncate details-md text-primary-950 font-semibold", textClassName)}>
        {displayValue}
      </p>
    </div>
  );
};
