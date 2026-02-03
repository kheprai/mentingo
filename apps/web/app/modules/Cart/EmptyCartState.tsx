import { Link } from "@remix-run/react";
import { ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";

export function EmptyCartState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <ShoppingCart className="size-16 text-neutral-300" />
      <div>
        <h3 className="text-lg font-medium text-neutral-700">
          {t("cart.sidebar.empty")}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {t("cart.page.continueShopping")}
        </p>
      </div>
      <Button variant="primary" asChild>
        <Link to="/courses">{t("cart.page.continueShopping")}</Link>
      </Button>
    </div>
  );
}
