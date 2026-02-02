import { Link, useParams } from "@remix-run/react";
import { formatDate } from "date-fns";
import { ArrowLeft, ImageOff, Newspaper } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useNews } from "~/api/queries";
import { Icon } from "~/components/Icon";
import Viewer from "~/components/RichText/Viever";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useLanguageStore } from "~/modules/Dashboard/Settings/Language/LanguageStore";

export default function LandingNewsDetailPage() {
  const { t } = useTranslation();
  const { newsId } = useParams();
  const { language } = useLanguageStore();

  const { data: news, isLoading } = useNews(newsId!, { language }, { enabled: Boolean(newsId) });

  if (isLoading) {
    return <NewsDetailSkeleton />;
  }

  if (!news) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-neutral-100 p-4">
              <Newspaper className="size-8 text-neutral-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("landing.newsDetail.notFound")}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/news">{t("landing.newsDetail.backToNews")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const headerImageUrl = news.resources?.coverImage?.fileUrl;
  const publishedDate = news.publishedAt ? new Date(news.publishedAt) : null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="size-4" />
          {t("landing.newsDetail.backToNews")}
        </Link>

        {/* Article Container */}
        <article className="rounded-2xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
          {/* Cover Image */}
          {headerImageUrl ? (
            <div className="aspect-video w-full overflow-hidden bg-neutral-100">
              <img src={headerImageUrl} alt={news.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video w-full overflow-hidden bg-neutral-100 flex items-center justify-center">
              <ImageOff className="size-16 text-neutral-300" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-10">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-4">
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Icon name="Calendar" className="size-4" />
                  {formatDate(publishedDate, "d MMMM yyyy")}
                </span>
              )}
              {news.authorName && (
                <span className="flex items-center gap-1.5">
                  <Icon name="User" className="size-4" />
                  {news.authorName}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl mb-4">
              {news.title}
            </h1>

            {/* Summary */}
            {news.summary && (
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">{news.summary}</p>
            )}

            {/* Content */}
            {news.content && (
              <div className="border-t border-neutral-100 pt-8">
                <Viewer
                  content={news.content}
                  className="prose prose-neutral max-w-none"
                  variant="content"
                />
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 pt-8 border-t border-neutral-100 flex items-center justify-between">
              <Button
                variant="ghost"
                asChild={!!news.previousNews}
                disabled={!news.previousNews}
                className="flex items-center gap-2"
              >
                {news.previousNews ? (
                  <Link to={`/news/${news.previousNews}`}>
                    <Icon name="ChevronLeft" className="size-5" />
                    <span>{t("landing.newsDetail.previousNews")}</span>
                  </Link>
                ) : (
                  <>
                    <Icon name="ChevronLeft" className="size-5" />
                    <span>{t("landing.newsDetail.previousNews")}</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                asChild={!!news.nextNews}
                disabled={!news.nextNews}
                className="flex items-center gap-2"
              >
                {news.nextNews ? (
                  <Link to={`/news/${news.nextNews}`}>
                    <span>{t("landing.newsDetail.nextNews")}</span>
                    <Icon name="ChevronRight" className="size-5" />
                  </Link>
                ) : (
                  <>
                    <span>{t("landing.newsDetail.nextNews")}</span>
                    <Icon name="ChevronRight" className="size-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function NewsDetailSkeleton() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-6 sm:p-10">
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3 mb-8" />
            <div className="border-t border-neutral-100 pt-8">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
