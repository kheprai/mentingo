import { Link, useLocation } from "@remix-run/react";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useLogoutUser } from "~/api/mutations";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { Icon } from "~/components/Icon";
import { PlatformLogo } from "~/components/PlatformLogo";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserAvatar } from "~/components/UserProfile/UserAvatar";
import { USER_ROLE } from "~/config/userRoles";
import { cn } from "~/lib/utils";
import {
  useLanguageStore,
  type Language,
} from "~/modules/Dashboard/Settings/Language/LanguageStore";

const languages = [
  { code: "es", label: "Español", flag: "🇦🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

const navLinks = [
  { href: "/courses", key: "courses" },
  { href: "/workshops", key: "workshops" },
  { href: "/consulting", key: "consulting" },
  { href: "/tools", key: "tools" },
  { href: "/news", key: "news" },
  { href: "/resources", key: "resources" },
  { href: "/about", key: "about" },
] as const;

function getRoleLabel(role: string | undefined, t: (key: string) => string): string {
  switch (role) {
    case USER_ROLE.admin:
      return t("landing.userMenu.roles.admin");
    case USER_ROLE.contentCreator:
      return t("landing.userMenu.roles.content_creator");
    case USER_ROLE.student:
    default:
      return t("landing.userMenu.roles.student");
  }
}

function UserDropdown() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { mutate: logout } = useLogoutUser();

  if (!currentUser) return null;

  const userName =
    currentUser.firstName || currentUser.lastName
      ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim()
      : currentUser.email;

  const isAdmin = currentUser.role === USER_ROLE.admin;
  const isContentCreator = currentUser.role === USER_ROLE.contentCreator;
  const isAdminLike = isAdmin || isContentCreator;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors select-none hover:bg-neutral-100 focus:outline-none"
        >
          <UserAvatar
            userName={userName}
            profilePictureUrl={currentUser.profilePictureUrl}
            className="h-8 w-8"
          />
          <div className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-medium text-neutral-900 leading-tight">{userName}</span>
            <span className="text-xs text-neutral-500 leading-tight">
              {getRoleLabel(currentUser.role, t)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link
            to="/library"
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <Icon name="Course" className="h-4 w-4" />
            {t("landing.userMenu.library")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to={`/profile/${currentUser.id}`}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <Icon name="User" className="h-4 w-4" />
            {t("landing.userMenu.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/settings"
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <Icon name="Settings" className="h-4 w-4" />
            {t("landing.userMenu.settings")}
          </Link>
        </DropdownMenuItem>

        {isAdminLike && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/admin/analytics"
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="ChartNoAxes" className="h-4 w-4" />
                {t("landing.userMenu.analytics")}
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin/users"
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <Icon name="Hat" className="h-4 w-4" />
                    {t("landing.userMenu.users")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin/categories"
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <Icon name="Category" className="h-4 w-4" />
                    {t("landing.userMenu.categories")}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem asChild>
              <Link
                to="/admin/courses"
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="Course" className="h-4 w-4" />
                {t("landing.userMenu.myCourses")}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 hover:text-error-700"
        >
          <LogOut className="h-4 w-4" />
          {t("landing.userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileUserMenu() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { mutate: logout } = useLogoutUser();

  if (!currentUser) return null;

  const userName =
    currentUser.firstName || currentUser.lastName
      ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim()
      : currentUser.email;

  const isAdmin = currentUser.role === USER_ROLE.admin;
  const isContentCreator = currentUser.role === USER_ROLE.contentCreator;
  const isAdminLike = isAdmin || isContentCreator;

  return (
    <div className="border-t border-neutral-200 pt-4 mt-4">
      <div className="flex items-center gap-3 px-3 py-2">
        <UserAvatar
          userName={userName}
          profilePictureUrl={currentUser.profilePictureUrl}
          className="h-10 w-10"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-neutral-900">{userName}</span>
          <span className="text-xs text-neutral-500">{getRoleLabel(currentUser.role, t)}</span>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <Link
          to="/library"
          className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {t("landing.userMenu.library")}
        </Link>
        <Link
          to={`/profile/${currentUser.id}`}
          className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {t("landing.userMenu.profile")}
        </Link>
        <Link
          to="/settings"
          className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {t("landing.userMenu.settings")}
        </Link>

        {isAdminLike && (
          <>
            <div className="my-2 border-t border-neutral-200" />
            <Link
              to="/admin/analytics"
              className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
            >
              {t("landing.userMenu.analytics")}
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/admin/users"
                  className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {t("landing.userMenu.users")}
                </Link>
                <Link
                  to="/admin/categories"
                  className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {t("landing.userMenu.categories")}
                </Link>
              </>
            )}
            <Link
              to="/admin/courses"
              className="block rounded-lg px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
            >
              {t("landing.userMenu.myCourses")}
            </Link>
          </>
        )}

        <div className="my-2 border-t border-neutral-200" />
        <button
          type="button"
          onClick={() => logout()}
          className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-error-600 hover:bg-error-50"
        >
          {t("landing.userMenu.logout")}
        </button>
      </div>
    </div>
  );
}

export function LandingHeader() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;
  const { setLanguage } = useLanguageStore();

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode as Language);
  };

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-600 transition-colors select-none hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none"
              >
                <span className="text-lg leading-none">{currentLang.flag}</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[130px] p-0 overflow-hidden">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-none px-3 py-2.5 text-sm outline-none select-none transition-colors data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-900",
                    i18n.language === lang.code
                      ? "bg-neutral-50 font-medium text-neutral-900"
                      : "text-neutral-600",
                  )}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {isLoggedIn ? (
            <UserDropdown />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth/login">{t("landing.auth.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/register">{t("landing.auth.register")}</Link>
              </Button>
            </>
          )}
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
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-neutral-600">
                  {t("landing.nav.language")}
                </span>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        "cursor-pointer select-none rounded-md p-2 text-xl transition-all",
                        i18n.language === lang.code
                          ? "bg-primary-100 ring-2 ring-primary-500"
                          : "hover:bg-neutral-100 active:scale-95",
                      )}
                      aria-label={lang.label}
                    >
                      {lang.flag}
                    </button>
                  ))}
                </div>
              </div>
              {isLoggedIn ? (
                <MobileUserMenu />
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/auth/login">{t("landing.auth.login")}</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/auth/register">{t("landing.auth.register")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
