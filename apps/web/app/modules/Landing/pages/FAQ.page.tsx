import { Link } from "@remix-run/react";
import { ChevronDown, HelpCircle, Search, SearchX } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import useAllQA from "~/api/queries/useAllQA";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useLanguageStore } from "~/modules/Dashboard/Settings/Language/LanguageStore";

export default function LandingFAQPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const { language } = useLanguageStore();

  const { data: allQA, isLoading } = useAllQA(language);

  const filteredQA = useMemo(() => {
    if (!allQA) return [];

    // Filter for QAs that have the current language
    const languageFiltered = allQA.filter((item) => item.availableLocales.includes(language));

    if (!searchQuery.trim()) return languageFiltered;

    const query = searchQuery.toLowerCase();
    return languageFiltered.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }, [allQA, searchQuery, language]);

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t("landing.faq.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            {t("landing.faq.description")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder={t("landing.faq.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <FAQSkeleton />
        ) : filteredQA.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery.trim()} />
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <Accordion
              type="single"
              collapsible
              value={openItem}
              onValueChange={(value) => setOpenItem(value || undefined)}
            >
              {filteredQA.map((item) => (
                <FAQItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </Accordion>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 rounded-xl bg-neutral-50 p-6 text-center">
          <p className="text-neutral-600">{t("landing.faq.contactSupport")}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/contact">{t("landing.faq.contactUs")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

type FAQItemProps = {
  id: string;
  title: string | null;
  description: string | null;
};

function FAQItem({ id, title, description }: FAQItemProps) {
  return (
    <AccordionItem value={id} className="border-b border-neutral-100 last:border-0">
      <AccordionTrigger className="group w-full px-6 py-5 text-left hover:no-underline focus-visible:outline-none focus-visible:ring-0">
        <div className="flex w-full items-center gap-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <HelpCircle className="size-4" />
          </div>
          <span className="flex-1 font-medium text-neutral-900 pr-4">{title}</span>
          <ChevronDown className="size-5 shrink-0 text-neutral-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-5">
        <div className="pl-12 text-neutral-600 leading-relaxed">{description}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function FAQSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-neutral-100 last:border-0 px-6 py-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="size-5" />
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
  const EmptyIcon = hasSearch ? SearchX : HelpCircle;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4">
        <EmptyIcon className="size-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900">{t("landing.faq.noResults")}</h3>
    </div>
  );
}
