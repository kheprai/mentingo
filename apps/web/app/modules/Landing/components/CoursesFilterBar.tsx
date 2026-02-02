import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import type { GetAllCategoriesResponse } from "~/api/generated-api";

const getCategoryTitle = (title: string | Record<string, string>, language: string): string => {
  if (typeof title === "string") return title;
  return title[language] || title.en || Object.values(title)[0] || "";
};

export type FilterState = {
  searchQuery: string;
  category: string;
  priceFilter: "all" | "free" | "paid";
  sort: "relevance" | "price-asc" | "price-desc" | "newest";
};

type CoursesFilterBarProps = {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(name: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  categories: GetAllCategoriesResponse["data"] | undefined;
  isLoading: boolean;
  resultsCount: number;
};

export function CoursesFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  categories,
  isLoading,
  resultsCount,
}: CoursesFilterBarProps) {
  const { t, i18n } = useTranslation();

  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.category !== "" ||
    filters.priceFilter !== "all" ||
    filters.sort !== "relevance";

  const resultsText =
    resultsCount === 0
      ? t("landing.courses.results.noResults")
      : resultsCount === 1
        ? t("landing.courses.results.showingOne")
        : t("landing.courses.results.showing", { count: resultsCount });

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder={t("landing.courses.searchPlaceholder")}
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Select */}
        <Select
          value={filters.category}
          onValueChange={(value) => onFilterChange("category", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("landing.courses.filters.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("landing.courses.filters.allCategories")}</SelectItem>
            {categories?.map((cat) => {
              const categoryTitle = getCategoryTitle(cat.title, i18n.language);
              return (
                <SelectItem key={cat.id} value={categoryTitle}>
                  {categoryTitle}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Price Filter */}
        <Select
          value={filters.priceFilter}
          onValueChange={(value) =>
            onFilterChange("priceFilter", value as FilterState["priceFilter"])
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t("landing.courses.filters.price")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("landing.courses.filters.allPrices")}</SelectItem>
            <SelectItem value="free">{t("landing.courses.filters.free")}</SelectItem>
            <SelectItem value="paid">{t("landing.courses.filters.paid")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Select */}
        <Select
          value={filters.sort}
          onValueChange={(value) => onFilterChange("sort", value as FilterState["sort"])}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("landing.courses.filters.sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{t("landing.courses.filters.sortRelevance")}</SelectItem>
            <SelectItem value="price-asc">{t("landing.courses.filters.sortPriceAsc")}</SelectItem>
            <SelectItem value="price-desc">{t("landing.courses.filters.sortPriceDesc")}</SelectItem>
            <SelectItem value="newest">{t("landing.courses.filters.sortNewest")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900"
          >
            <X className="size-4" />
            {t("landing.courses.filters.clearFilters")}
          </Button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-neutral-500">
        {isLoading ? (
          <span className="animate-pulse">{t("landing.courses.results.loading")}</span>
        ) : (
          resultsText
        )}
      </p>
    </div>
  );
}
