import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import DefaultPhotoCourse from "~/assets/svgs/default-photo-course.svg";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CategoryChip } from "~/components/ui/CategoryChip";
import { UserAvatar } from "~/components/UserProfile/UserAvatar";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { cn } from "~/lib/utils";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import type { GetAvailableCoursesResponse } from "~/api/generated-api";
import type { Language } from "~/modules/Dashboard/Settings/Language/LanguageStore";

// Extended type with new fields (until API is regenerated)
type CourseWithLocales = GetAvailableCoursesResponse["data"][number] & {
  availableLocales?: string[];
  baseLanguage?: string;
};

const languageFlags: Record<Language, { flag: string; label: string; bgColor: string }> = {
  es: { flag: "🇦🇷", label: "ES", bgColor: "bg-sky-100" },
  en: { flag: "🇬🇧", label: "EN", bgColor: "bg-red-100" },
};

export type PublicCourseCardProps = {
  course: CourseWithLocales;
  isEnrolled: boolean;
  isLoggedIn: boolean;
};

export function PublicCourseCard({ course, isEnrolled, isLoggedIn }: PublicCourseCardProps) {
  const { t } = useTranslation();

  const {
    author,
    authorAvatarUrl,
    availableLocales,
    category,
    courseChapterCount,
    currency,
    description,
    hasFreeChapters,
    priceInCents,
    slug,
    thumbnailUrl,
    title,
  } = course;

  const getButtonLabel = () => {
    if (isEnrolled) {
      return t("landing.courses.card.continue");
    }
    if (isLoggedIn) {
      return t("landing.courses.card.viewDetails");
    }
    return t("landing.courses.card.viewCourse");
  };

  const formattedPrice =
    priceInCents === 0
      ? t("landing.courses.card.free")
      : formatPrice(priceInCents, currency, getCurrencyLocale(currency));

  const chapterCountText =
    courseChapterCount === 1
      ? t("landing.courses.card.chapter")
      : t("landing.courses.card.chapters", { count: courseChapterCount });

  return (
    <Link
      to={`/courses/${slug}`}
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-lg",
        {
          "border-secondary-200 hover:border-secondary-500": isEnrolled,
          "border-neutral-200 hover:border-primary-500": !isEnrolled,
        },
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        <img
          src={thumbnailUrl || DefaultPhotoCourse}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DefaultPhotoCourse;
          }}
        />
        {/* Top badges: Category and status */}
        <div className="absolute left-3 right-3 top-3 flex flex-col gap-y-1.5">
          <CategoryChip category={category} />
          {hasFreeChapters && !isEnrolled && (
            <Badge variant="successFilled" className="w-fit">
              {t("landing.courses.card.freeLessons")}
            </Badge>
          )}
          {isEnrolled && (
            <Badge variant="success" className="w-fit">
              {t("landing.courses.card.enrolled")}
            </Badge>
          )}
        </div>
        {/* Bottom badges: Language flags */}
        {availableLocales && availableLocales.length > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            {availableLocales.map((locale) => {
              const langInfo = languageFlags[locale as Language];
              if (!langInfo) return null;
              return (
                <span
                  key={locale}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm",
                    langInfo.bgColor,
                  )}
                >
                  <span className="text-sm">{langInfo.flag}</span>
                  {langInfo.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-neutral-900 line-clamp-2">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
          <span dangerouslySetInnerHTML={{ __html: description }} />
        </p>

        {/* Author */}
        <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
          <UserAvatar className="size-6" userName={author} profilePictureUrl={authorAvatarUrl} />
          <span className="truncate">{author}</span>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-sm text-neutral-500">{chapterCountText}</span>
          <span
            className={cn("font-semibold", {
              "text-success-700": priceInCents === 0,
              "text-primary-700": priceInCents > 0,
            })}
          >
            {formattedPrice}
          </span>
        </div>

        {/* CTA Button */}
        <Button
          variant={isEnrolled ? "secondary" : "primary"}
          className="mt-4 w-full"
          tabIndex={-1}
        >
          {getButtonLabel()}
        </Button>
      </div>
    </Link>
  );
}
