import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { PlatformLogo } from "~/components/PlatformLogo";

const footerLinks = {
  platform: [
    { href: "/courses", key: "courses" },
    { href: "/workshops", key: "workshops" },
    { href: "/consulting", key: "consulting" },
    { href: "/tools", key: "tools" },
  ],
  company: [
    { href: "/about", key: "about" },
    { href: "/contact", key: "contact" },
  ],
  legal: [
    { href: "/privacy", key: "privacy" },
    { href: "/terms", key: "terms" },
  ],
} as const;

export function LandingFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block">
              <PlatformLogo className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-neutral-600">{t("landing.footer.description")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {t("landing.footer.sections.platform")}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-sm text-neutral-600 hover:text-primary-700">
                    {t(`landing.nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {t("landing.footer.sections.company")}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-sm text-neutral-600 hover:text-primary-700">
                    {t(`landing.nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {t("landing.footer.sections.legal")}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.key}>
                  <Link to={link.href} className="text-sm text-neutral-600 hover:text-primary-700">
                    {t(`landing.footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-center text-sm text-neutral-500">
            &copy; {currentYear} AcademIA. {t("landing.footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
