import { useTranslation } from "react-i18next";

import { Icon } from "~/components/Icon";
import { cn } from "~/lib/utils";

import type { IconName } from "~/types/shared";

interface Feature {
  key: string;
  icon: IconName;
  color: string;
}

const features: Feature[] = [
  {
    key: "courses",
    icon: "Course",
    color: "bg-primary-100 text-primary-700",
  },
  {
    key: "ai",
    icon: "Hat",
    color: "bg-secondary-100 text-secondary-700",
  },
  {
    key: "certificates",
    icon: "CertificateTrophy",
    color: "bg-success-100 text-success-700",
  },
  {
    key: "community",
    icon: "Group",
    color: "bg-warning-100 text-warning-700",
  },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-lg text-neutral-600">{t("landing.features.subtitle")}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  feature.color,
                )}
              >
                <Icon name={feature.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                {t(`landing.features.items.${feature.key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                {t(`landing.features.items.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
