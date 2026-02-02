import { Link, useParams } from "@remix-run/react";
import { formatDate } from "date-fns";
import { ArrowLeft, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useArticle } from "~/api/queries/useArticle";
import { Icon } from "~/components/Icon";
import Viewer from "~/components/RichText/Viever";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useLanguageStore } from "~/modules/Dashboard/Settings/Language/LanguageStore";

export default function LandingResourceDetailPage() {
  const { t } = useTranslation();
  const { articleId } = useParams();
  const { language } = useLanguageStore();

  const { data: article, isLoading } = useArticle(articleId ?? "", language);

  if (isLoading) {
    return <ResourceDetailSkeleton />;
  }

  if (!article) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-neutral-100 p-4">
              <FileText className="size-8 text-neutral-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("landing.resourceDetail.notFound")}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/resources">{t("landing.resourceDetail.backToResources")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const headerImageUrl = article.resources?.coverImage?.fileUrl;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="size-4" />
          {t("landing.resourceDetail.backToResources")}
        </Link>

        {/* Article Container */}
        <article className="rounded-2xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
          {/* Cover Image (optional) */}
          {headerImageUrl && (
            <div className="aspect-video w-full overflow-hidden bg-neutral-100">
              <img
                src={headerImageUrl}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-10">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-4">
              {article.authorName && (
                <span className="flex items-center gap-1.5">
                  <Icon name="User" className="size-4" />
                  {article.authorName}
                </span>
              )}
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Icon name="Calendar" className="size-4" />
                  {formatDate(publishedDate, "d MMMM yyyy")}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl mb-4">
              {article.title}
            </h1>

            {/* Summary */}
            {article.summary && (
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">{article.summary}</p>
            )}

            {/* Content */}
            {article.content && (
              <div className="border-t border-neutral-100 pt-8">
                <Viewer
                  content={article.content}
                  className="prose prose-neutral max-w-none"
                  variant="content"
                />
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 pt-8 border-t border-neutral-100 flex items-center justify-between">
              <Button
                variant="ghost"
                asChild={!!article.previousArticle}
                disabled={!article.previousArticle}
                className="flex items-center gap-2"
              >
                {article.previousArticle ? (
                  <Link to={`/resources/${article.previousArticle}`}>
                    <Icon name="ChevronLeft" className="size-5" />
                    <span>{t("landing.resourceDetail.previousResource")}</span>
                  </Link>
                ) : (
                  <>
                    <Icon name="ChevronLeft" className="size-5" />
                    <span>{t("landing.resourceDetail.previousResource")}</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                asChild={!!article.nextArticle}
                disabled={!article.nextArticle}
                className="flex items-center gap-2"
              >
                {article.nextArticle ? (
                  <Link to={`/resources/${article.nextArticle}`}>
                    <span>{t("landing.resourceDetail.nextResource")}</span>
                    <Icon name="ChevronRight" className="size-5" />
                  </Link>
                ) : (
                  <>
                    <span>{t("landing.resourceDetail.nextResource")}</span>
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

function ResourceDetailSkeleton() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
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
