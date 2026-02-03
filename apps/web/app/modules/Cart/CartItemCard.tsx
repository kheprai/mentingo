import { Link } from "@remix-run/react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { useCartCurrency } from "~/lib/hooks/useCartCurrency";
import { useCartStore } from "~/lib/stores/cartStore";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import type { CartItem } from "~/lib/stores/cartStore";

type CartItemCardProps = {
  item: CartItem;
  variant?: "sidebar" | "page";
  onRemove?: () => void;
};

export function CartItemCard({ item, variant = "sidebar", onRemove }: CartItemCardProps) {
  const { t } = useTranslation();
  const removeItem = useCartStore((state) => state.removeItem);
  const { defaultMethod, currency } = useCartCurrency();

  const handleRemove = () => {
    removeItem(item.courseId);
    onRemove?.();
  };

  const isFree =
    item.priceInCents === 0 && !item.stripePriceId && !item.mercadopagoProductId;

  const displayPrice = isFree
    ? t("landing.courses.card.free")
    : defaultMethod === "mercadopago" && item.mercadopagoPriceInCents > 0
      ? formatPrice(item.mercadopagoPriceInCents, "ARS", getCurrencyLocale("ARS"))
      : formatPrice(item.priceInCents, "USD", getCurrencyLocale("USD"));

  const courseUrl = item.slug ? `/courses/${item.slug}` : `/courses/${item.courseId}`;

  if (variant === "sidebar") {
    return (
      <div className="flex gap-3 py-3">
        {item.thumbnailUrl && (
          <Link to={courseUrl} className="shrink-0">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="size-16 rounded-md object-cover"
            />
          </Link>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="min-w-0">
            <Link to={courseUrl} className="truncate text-sm font-medium hover:underline">
              {item.title}
            </Link>
            {item.categoryName && (
              <p className="truncate text-xs text-neutral-400">{item.categoryName}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary-700">{displayPrice}</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleRemove}
              aria-label={t("cart.page.removeItem")}
            >
              <Trash2 className="size-3.5 text-neutral-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      {item.thumbnailUrl && (
        <Link to={courseUrl} className="shrink-0">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-24 w-36 rounded-md object-cover"
          />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link to={courseUrl} className="text-base font-medium hover:underline">
            {item.title}
          </Link>
          <p className="mt-1 text-sm text-neutral-500">{item.authorName}</p>
          {item.categoryName && (
            <p className="mt-0.5 text-xs text-neutral-400">{item.categoryName}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-primary-700">{displayPrice}</span>
          <Button variant="outline" size="sm" onClick={handleRemove}>
            <Trash2 className="mr-1 size-3.5" />
            {t("cart.page.removeItem")}
          </Button>
        </div>
      </div>
    </div>
  );
}
