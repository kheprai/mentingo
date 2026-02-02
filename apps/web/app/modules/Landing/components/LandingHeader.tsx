import { Link, useLocation } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon } from "~/components/Icon";
import { PlatformLogo } from "~/components/PlatformLogo";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const navLinks = [
  { href: "/courses", key: "courses" },
  { href: "/workshops", key: "workshops" },
  { href: "/consulting", key: "consulting" },
  { href: "/tools", key: "tools" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function LandingHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <PlatformLogo className="h-8 w-auto" />
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary-700",
                  location.pathname === link.href ? "text-primary-700" : "text-neutral-600",
                )}
              >
                {t(`landing.nav.${link.key}`)}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" asChild>
            <Link to="/auth/login">{t("landing.auth.login")}</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/register">{t("landing.auth.register")}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <Icon
            name={mobileMenuOpen ? "HamburgerMenuClose" : "HamburgerMenu"}
            className="h-6 w-6 text-neutral-700"
          />
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-neutral-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-base font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-600 hover:bg-neutral-50",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(`landing.nav.${link.key}`)}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4">
              <Button variant="outline" asChild className="w-full">
                <Link to="/auth/login">{t("landing.auth.login")}</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/auth/register">{t("landing.auth.register")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
