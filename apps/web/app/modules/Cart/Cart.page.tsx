import { Link } from "@remix-run/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { useCartCurrency } from "~/lib/hooks/useCartCurrency";
import { useCartStore } from "~/lib/stores/cartStore";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import { CartItemCard } from "./CartItemCard";
import { CurrencyToggle } from "./CurrencyToggle";
import { EmptyCartState } from "./EmptyCartState";

export default function CartPage() {
  const { t } = useTranslation();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { defaultMethod, currency } = useCartCurrency();

  const subtotal =
    defaultMethod === "mercadopago"
      ? items.reduce((sum, item) => sum + item.mercadopagoPriceInCents, 0)
      : items.reduce((sum, item) => sum + item.priceInCents, 0);

  const allFree = items.length > 0 && items.every(
    (item) => item.priceInCents === 0 && !item.stripePriceId && !item.mercadopagoProductId,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t("cart.page.title")} ({items.length})
        </h1>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="mr-1 size-4" />
            {t("cart.page.clearCart")}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyCartState />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-3">
            {items.map((item) => (
              <CartItemCard key={item.courseId} item={item} variant="page" />
            ))}
          </div>

          <div className="lg:w-80">
            <div className="sticky top-4 rounded-lg border p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t("cart.checkout.orderSummary")}
              </h3>

              <CurrencyToggle className="mb-3 justify-end" />

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {t("cart.sidebar.itemCount", { count: items.length })}
                  </span>
                  <span>
                    {allFree
                      ? t("landing.courses.card.free")
                      : formatPrice(subtotal, currency, getCurrencyLocale(currency))}
                  </span>
                </div>
              </div>

              <div className="mb-4 border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>{t("cart.checkout.total")}</span>
                  <span>
                    {allFree
                      ? t("landing.courses.card.free")
                      : formatPrice(subtotal, currency, getCurrencyLocale(currency))}
                  </span>
                </div>
              </div>

              <Button variant="primary" className="w-full" asChild>
                <Link to="/checkout">
                  {t("cart.page.proceedToCheckout")}
                </Link>
              </Button>

              <Button variant="ghost" className="mt-2 w-full" asChild>
                <Link to="/courses">
                  <ArrowLeft className="mr-1 size-4" />
                  {t("cart.page.continueShopping")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
