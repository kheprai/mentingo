import { Link, useSearchParams } from "@remix-run/react";
import { formatDate } from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight, ImageOff, Newspaper } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useNewsList } from "~/api/queries";
import { Icon } from "~/components/Icon";
import { Skeleton } from "~/components/ui/skeleton";
import { useLanguageStore } from "~/modules/Dashboard/Settings/Language/LanguageStore";

import type { GetNewsListResponse } from "~/api/generated-api";

const ITEMS_PER_PAGE = 9;

export default function LandingNewsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const parsePageParam = useCallback(() => {
    const pageParam = Number(searchParams.get("page"));
    return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  }, [searchParams]);

  const [currentPage, setCurrentPage] = useState<number>(() => parsePageParam());
  const { language } = useLanguageStore();

  const { data: newsData, isLoading } = useNewsList({
    language,
    page: currentPage,
    perPage: ITEMS_PER_PAGE,
  });

  const newsList = useMemo(() => newsData?.data ?? [], [newsData]);
  const totalItems = newsData?.pagination?.totalItems ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const changePage = (newPage: number) => {
    const clamped = Math.min(Math.max(newPage, 1), totalPages);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(clamped));
    setSearchParams(nextParams);
    setCurrentPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [featuredNews, ...otherNews] = newsList;

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t("landing.news.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            {t("landing.news.description")}
          </p>
        </div>

        {isLoading ? (
          <NewsListSkeleton />
        ) : newsList.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Featured Article (first page only) */}
            {currentPage === 1 && featuredNews && (
              <div className="mb-12">
                <FeaturedNewsCard news={featuredNews} />
              </div>
            )}

            {/* News Grid */}
            {(currentPage === 1 ? otherNews : newsList).length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(currentPage === 1 ? otherNews : newsList).map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="px-4 text-sm text-neutral-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

type NewsCardProps = {
  news: GetNewsListResponse["data"][number];
};

function FeaturedNewsCard({ news }: NewsCardProps) {
  const { t } = useTranslation();
  const imageUrl = news.resources?.coverImage?.fileUrl;
  const date = news.publishedAt ?? news.updatedAt ?? news.createdAt;

  return (
    <Link
      to={`/news/${news.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-neutral-900"
    >
      <div className="grid md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-video md:aspect-auto md:h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={news.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center bg-neutral-800">
              <ImageOff className="size-16 text-neutral-600" />
            </div>
          )}
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white">
              {t("landing.news.featured")}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-6 md:p-10">
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            {date && (
              <span className="flex items-center gap-1.5">
                <Icon name="Calendar" className="size-4" />
                {formatDate(new Date(date), "d MMMM yyyy")}
              </span>
            )}
            {news.authorName && (
              <span className="flex items-center gap-1.5">
                <Icon name="User" className="size-4" />
                {news.authorName}
              </span>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white transition-colors group-hover:text-primary-400 md:text-3xl">
            {news.title}
          </h2>
          {news.summary && <p className="mt-4 text-neutral-300 line-clamp-3">{news.summary}</p>}
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 group-hover:text-primary-300">
              {t("landing.news.readMore")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NewsCard({ news }: NewsCardProps) {
  const { t } = useTranslation();
  const imageUrl = news.resources?.coverImage?.fileUrl;
  const date = news.publishedAt ?? news.updatedAt ?? news.createdAt;

  return (
    <Link
      to={`/news/${news.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={news.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="size-12 text-neutral-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          {date && (
            <span className="flex items-center gap-1">
              <Icon name="Calendar" className="size-3.5" />
              {formatDate(new Date(date), "d MMM yyyy")}
            </span>
          )}
        </div>
        <h3 className="mt-2 font-semibold text-neutral-900 line-clamp-2 group-hover:text-primary-700">
          {news.title}
        </h3>
        {news.summary && (
          <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{news.summary}</p>
        )}
        <div className="mt-auto pt-4">
          <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
            {t("landing.news.readMore")} →
          </span>
        </div>
      </div>
    </Link>
  );
}

function NewsListSkeleton() {
  return (
    <>
      {/* Featured skeleton */}
      <div className="mb-12">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-neutral-200"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4">
        <Newspaper className="size-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900">{t("landing.news.noNews")}</h3>
    </div>
  );
}
