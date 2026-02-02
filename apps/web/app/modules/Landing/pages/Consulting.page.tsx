import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";

export default function ConsultingPage() {
  const { t } = useTranslation();

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {t("landing.consulting.title")}
          </h1>
          <p className="mt-6 text-lg text-neutral-600">{t("landing.consulting.description")}</p>
          <div className="mt-10 flex justify-center gap-4">
            <Button asChild>
              <Link to="/contact">{t("landing.placeholder.contactUs")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/courses">{t("landing.hero.viewCourses")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
