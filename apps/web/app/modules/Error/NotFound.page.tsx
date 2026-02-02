import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { useGlobalSettings } from "~/api/queries/useGlobalSettings";
import { PlatformLogo } from "~/components/PlatformLogo";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { setPageTitle } from "~/utils/setPageTitle";

import type { MetaFunction } from "@remix-run/react";

export const meta: MetaFunction = ({ matches }) => setPageTitle(matches, "pages.notFound");

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { data: globalSettings } = useGlobalSettings();
  const loginBackgroundImageS3Key = globalSettings?.loginBackgroundImageS3Key;

  return (
    <main className="flex h-screen w-screen items-center justify-center">
      {loginBackgroundImageS3Key && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${loginBackgroundImageS3Key})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <Link to="/" className="mb-6 flex justify-center">
            <PlatformLogo className="h-16 w-auto py-3" alt="Platform Logo" />
          </Link>
          <CardTitle className="text-6xl font-bold text-primary-700">404</CardTitle>
          <CardDescription className="mt-4 text-lg">{t("error.notFound.title")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">{t("error.notFound.description")}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/">{t("error.notFound.backHome")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
