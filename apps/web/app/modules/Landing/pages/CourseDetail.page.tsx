import { Link, redirect, useNavigate, useParams } from "@remix-run/react";
import { SUPPORTED_LANGUAGES } from "@repo/shared";
import { ArrowLeft, BookOpen, Gift, Globe, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiClient } from "~/api/api-client";
import { useEnrollCourse } from "~/api/mutations";
import { useCourse, useCurrentUser, courseQueryOptions } from "~/api/queries";
import { useUserDetails } from "~/api/queries/useUserDetails";
import { queryClient } from "~/api/queryClient";
import { Enroll } from "~/assets/svgs";
import DefaultPhotoCourse from "~/assets/svgs/default-photo-course.svg";
import Viewer from "~/components/RichText/Viever";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CategoryChip } from "~/components/ui/CategoryChip";
import { Skeleton } from "~/components/ui/skeleton";
import { UserAvatar } from "~/components/UserProfile/UserAvatar";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { cn } from "~/lib/utils";
import {
  useLanguageStore,
  type Language,
} from "~/modules/Dashboard/Settings/Language/LanguageStore";
import { PaymentModal } from "~/modules/stripe/PaymentModal";
import { isSupportedLanguage } from "~/utils/browser-language";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import type { SupportedLanguages } from "@repo/shared";

const languageFlags: Record<Language, { flag: string; label: string; bgColor: string }> = {
  es: { flag: "🇦🇷", label: "Español", bgColor: "bg-sky-100 hover:bg-sky-200" },
  en: { flag: "🇬🇧", label: "English", bgColor: "bg-red-100 hover:bg-red-200" },
};

const resolvePreferredLanguage = (url: URL): SupportedLanguages => {
  const languageFromQuery = url.searchParams.get("language");

  if (languageFromQuery && isSupportedLanguage(languageFromQuery)) {
    return languageFromQuery as SupportedLanguages;
  }

  const storedLanguage = useLanguageStore.getState().language;

  if (storedLanguage && isSupportedLanguage(storedLanguage)) {
    return storedLanguage as SupportedLanguages;
  }

  return SUPPORTED_LANGUAGES.EN;
};

export const clientLoader = async ({
  params,
  request,
}: {
  params: { slug?: string };
  request: Request;
}) => {
  const idOrSlug = params.slug || "";
  if (!idOrSlug) return null;

  const url = new URL(request.url);
  const language = resolvePreferredLanguage(url);

  const lookupResponse = await ApiClient.api.courseControllerLookupCourse({
    id: idOrSlug,
    language,
  });

  const { status, slug } = lookupResponse.data.data;

  if (status === "redirect" && slug) {
    const redirectUrl = new URL(`/courses/${slug}`, request.url);
    throw redirect(`${redirectUrl.pathname}${redirectUrl.search ?? ""}`, 302);
  }

  return null;
};

function LanguageBadges({
  availableLocales,
  currentLanguage,
  onLanguageChange,
}: {
  availableLocales: Language[];
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {availableLocales.map((locale) => {
        const langInfo = languageFlags[locale];
        if (!langInfo) return null;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => onLanguageChange(locale)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              langInfo.bgColor,
              locale === currentLanguage
                ? "ring-2 ring-primary-500 ring-offset-1"
                : "opacity-70 hover:opacity-100",
            )}
          >
            <span>{langInfo.flag}</span>
            <span>{langInfo.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LanguageNotAvailable({
  requestedLanguage,
  availableLocales,
  onLanguageSelect,
  courseTitle,
}: {
  requestedLanguage: Language;
  availableLocales: Language[];
  onLanguageSelect: (lang: Language) => void;
  courseTitle: string;
}) {
  const { t } = useTranslation();
  const requestedLangInfo = languageFlags[requestedLanguage];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 rounded-full bg-warning-100 p-4 inline-flex">
          <Globe className="size-8 text-warning-600" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {t("landing.courseDetail.languageNotAvailable.title")}
        </h1>

        <p className="text-neutral-600 mb-6">
          {t("landing.courseDetail.languageNotAvailable.description", {
            course: courseTitle,
            language: requestedLangInfo?.label ?? requestedLanguage,
          })}
        </p>

        <p className="text-sm text-neutral-500 mb-4">
          {t("landing.courseDetail.languageNotAvailable.selectAlternative")}
        </p>

        <div className="flex justify-center gap-3">
          {availableLocales.map((locale) => {
            const langInfo = languageFlags[locale];
            if (!langInfo) return null;
            return (
              <Button
                key={locale}
                variant="outline"
                onClick={() => onLanguageSelect(locale)}
                className={cn("flex items-center gap-2", langInfo.bgColor)}
              >
                <span className="text-lg">{langInfo.flag}</span>
                {langInfo.label}
              </Button>
            );
          })}
        </div>

        <Button asChild variant="ghost" className="mt-6">
          <Link to="/courses">{t("landing.courseDetail.backToCourses")}</Link>
        </Button>
      </div>
    </section>
  );
}

export default function CourseDetailPage() {
  const { t, i18n } = useTranslation();
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  const { language, setLanguage } = useLanguageStore();
  const { data: course, isLoading } = useCourse(slug, language);
  const { data: currentUser } = useCurrentUser();
  const { data: authorDetails } = useUserDetails(course?.authorId ?? "");
  const { mutateAsync: enrollCourse, isPending: isEnrolling } = useEnrollCourse();

  const authorName = authorDetails
    ? `${authorDetails.firstName ?? ""} ${authorDetails.lastName ?? ""}`.trim() || "Unknown"
    : "Unknown";

  const isLoggedIn = !!currentUser;
  const isEnrolled = course?.enrolled ?? false;

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleEnroll = async () => {
    if (!course?.id) return;
    await enrollCourse({ id: course.id });
    queryClient.invalidateQueries(courseQueryOptions(course.id, language));
  };

  const handleContinueLearning = () => {
    if (course?.id) {
      navigate(`/course/${course.slug}`);
    }
  };

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("landing.courseDetail.notFound")}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/courses">{t("landing.courseDetail.backToCourses")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  // Check if the current language is available for this course
  const availableLocales = (course.availableLocales ?? []) as Language[];
  const isLanguageAvailable = availableLocales.includes(language);

  // If the course exists but the current language is not available
  if (!isLanguageAvailable && availableLocales.length > 0) {
    return (
      <LanguageNotAvailable
        requestedLanguage={language}
        availableLocales={availableLocales}
        onLanguageSelect={handleLanguageChange}
        courseTitle={course.title}
      />
    );
  }

  const priceFormatted =
    course.priceInCents === 0
      ? t("landing.courses.card.free")
      : formatPrice(course.priceInCents ?? 0, course.currency, getCurrencyLocale(course.currency));

  const chapterCount = course.chapters?.length ?? 0;
  const hasFreeChapters = course.chapters?.some((ch) => ch.isFreemium) ?? false;

  const renderEnrollmentButton = () => {
    if (isEnrolled) {
      return (
        <Button size="lg" variant="secondary" onClick={handleContinueLearning}>
          <PlayCircle className="mr-2 size-5" />
          {t("landing.courseDetail.continueLearning")}
        </Button>
      );
    }

    if (!isLoggedIn) {
      return (
        <Button size="lg" asChild>
          <Link to={`/auth/login?redirect=/courses/${slug}`}>
            <Enroll className="mr-2" />
            {t("landing.courseDetail.loginToEnroll")}
          </Link>
        </Button>
      );
    }

    if (course.priceInCents && course.currency && course.stripePriceId) {
      return (
        <PaymentModal
          courseCurrency={course.currency}
          coursePrice={course.priceInCents}
          courseTitle={course.title}
          courseDescription={course.description}
          courseId={course.id}
          coursePriceId={course.stripePriceId}
        />
      );
    }

    return (
      <Button size="lg" onClick={handleEnroll} disabled={isEnrolling}>
        <Enroll className="mr-2" />
        {course.priceInCents === 0
          ? t("landing.courseDetail.enrollFree")
          : t("landing.courseDetail.enroll")}
      </Button>
    );
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="size-4" />
          {t("landing.courseDetail.backToCourses")}
        </Link>

        {/* Hero Section */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
          {/* Main Content */}
          <div className="flex flex-col gap-6">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
              <img
                src={course.thumbnailUrl || DefaultPhotoCourse}
                alt={course.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DefaultPhotoCourse;
                }}
              />
              {hasFreeChapters && !isEnrolled && (
                <Badge variant="successFilled" className="absolute left-4 top-4">
                  {t("landing.courseDetail.freeChapters")}
                </Badge>
              )}
              {isEnrolled && (
                <Badge variant="success" className="absolute left-4 top-4">
                  {t("landing.courses.card.enrolled")}
                </Badge>
              )}
            </div>

            {/* Course Info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip category={course.category} />
                {availableLocales.length > 0 && (
                  <LanguageBadges
                    availableLocales={availableLocales}
                    currentLanguage={language}
                    onLanguageChange={handleLanguageChange}
                  />
                )}
                <span className="text-sm text-neutral-500">
                  {chapterCount === 1
                    ? t("landing.courses.card.chapter")
                    : t("landing.courses.card.chapters", { count: chapterCount })}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                {course.title}
              </h1>

              {/* Author */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  className="size-10"
                  userName={authorName}
                  profilePictureUrl={authorDetails?.profilePictureUrl}
                />
                <div>
                  <p className="text-sm text-neutral-500">{t("landing.courseDetail.instructor")}</p>
                  <p className="font-medium text-neutral-900">{authorName}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                {t("landing.courseDetail.aboutCourse")}
              </h2>
              <Viewer
                content={course.description || ""}
                className="prose prose-neutral max-w-none"
                variant="content"
              />
            </div>

            {/* Chapters List */}
            {course.chapters && course.chapters.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  {t("landing.courseDetail.chapters")}
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  {t("landing.courseDetail.chaptersCount", { count: chapterCount })}
                </p>
                <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                  {course.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={cn(
                        "flex items-center gap-4 p-4",
                        index !== course.chapters!.length - 1 && "border-b border-neutral-100",
                      )}
                    >
                      <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-100 text-sm font-medium text-neutral-600">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{chapter.title}</p>
                        <p className="text-sm text-neutral-500">
                          {chapter.lessonCount === 1
                            ? t("studentCourseView.lessonCount.one")
                            : t("studentCourseView.lessonCount.other", {
                                count: chapter.lessonCount,
                              })}
                        </p>
                      </div>
                      {chapter.isFreemium && (
                        <Badge variant="outline" className="shrink-0">
                          {t("landing.courses.card.free")}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              {/* Price */}
              <div className="mb-6">
                <p
                  className={cn(
                    "text-3xl font-bold",
                    course.priceInCents === 0 ? "text-success-700" : "text-primary-700",
                  )}
                >
                  {priceFormatted}
                </p>
              </div>

              {/* CTA Button */}
              <div className="space-y-3">{renderEnrollmentButton()}</div>

              {/* Course Stats */}
              <div className="mt-6 space-y-3 border-t border-neutral-100 pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="size-5 text-neutral-400" />
                  <span className="text-neutral-600">
                    {chapterCount === 1
                      ? t("landing.courses.card.chapter")
                      : t("landing.courses.card.chapters", { count: chapterCount })}
                  </span>
                </div>
                {hasFreeChapters && (
                  <div className="flex items-center gap-3 text-sm">
                    <Gift className="size-5 text-success-500" />
                    <span className="text-neutral-600">
                      {t("landing.courseDetail.freeChapters")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseDetailSkeleton() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
          <div className="flex flex-col gap-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-10 w-3/4" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Skeleton className="h-7 w-48 mb-4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <Skeleton className="h-9 w-24 mb-6" />
              <Skeleton className="h-12 w-full mb-3" />
              <div className="mt-6 space-y-3 border-t border-neutral-100 pt-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
