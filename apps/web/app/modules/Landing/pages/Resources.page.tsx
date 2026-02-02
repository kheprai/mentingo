import { Link } from "@remix-run/react";
import { FileText, Search, SearchX } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useArticlesToc } from "~/api/queries";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useLanguageStore } from "~/modules/Dashboard/Settings/Language/LanguageStore";

export default function LandingResourcesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useLanguageStore();

  const { data: sections, isLoading } = useArticlesToc(language);

  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        articles: section.articles.filter((article) => article.title.toLowerCase().includes(query)),
      }))
      .filter((section) => section.articles.length > 0);
  }, [sections, searchQuery]);

  const totalArticles = useMemo(() => {
    return filteredSections.reduce((acc, section) => acc + section.articles.length, 0);
  }, [filteredSections]);

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t("landing.resources.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            {t("landing.resources.description")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mb-10 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder={t("landing.resources.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <ResourcesSkeleton />
        ) : totalArticles === 0 ? (
          <EmptyState hasSearch={!!searchQuery.trim()} />
        ) : (
          <div className="space-y-12">
            {filteredSections.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-neutral-900">{section.title}</h2>
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-sm text-neutral-500">
                    {section.articles.length}{" "}
                    {section.articles.length === 1 ? "artículo" : "artículos"}
                  </span>
                </div>

                {/* Articles Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type ArticleCardProps = {
  article: {
    id: string;
    title: string;
  };
};

function ArticleCard({ article }: ArticleCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/resources/${article.id}`}
      className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
        <FileText className="size-5" />
      </div>
      <h3 className="font-medium text-neutral-900 line-clamp-2 group-hover:text-primary-700">
        {article.title}
      </h3>
      <div className="mt-auto pt-4">
        <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
          {t("landing.resources.readArticle")} →
        </span>
      </div>
    </Link>
  );
}

function ResourcesSkeleton() {
  return (
    <div className="space-y-12">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="mb-6 flex items-center gap-4">
            <Skeleton className="h-7 w-40" />
            <div className="h-px flex-1 bg-neutral-200" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col rounded-xl border border-neutral-200 p-5">
                <Skeleton className="mb-3 size-10 rounded-lg" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type EmptyStateProps = {
  hasSearch: boolean;
};

function EmptyState({ hasSearch }: EmptyStateProps) {
  const { t } = useTranslation();
  const EmptyIcon = hasSearch ? SearchX : FileText;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4">
        <EmptyIcon className="size-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900">{t("landing.resources.noResults")}</h3>
    </div>
  );
}
