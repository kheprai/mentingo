import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { useCartCurrency } from "~/lib/hooks/useCartCurrency";
import { useCartStore } from "~/lib/stores/cartStore";
import { cn } from "~/lib/utils";

export function CurrencyToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { showToggle, defaultMethod } = useCartCurrency();
  const setSelectedPaymentMethod = useCartStore((state) => state.setSelectedPaymentMethod);

  if (!showToggle) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="mr-1 text-xs text-neutral-500">{t("cart.currency.toggle")}:</span>
      <Button
        variant={defaultMethod === "stripe" ? "primary" : "outline"}
        size="xs"
        onClick={() => setSelectedPaymentMethod("stripe")}
        className="px-2 py-0.5 text-xs"
      >
        USD
      </Button>
      <Button
        variant={defaultMethod === "mercadopago" ? "primary" : "outline"}
        size="xs"
        onClick={() => setSelectedPaymentMethod("mercadopago")}
        className="px-2 py-0.5 text-xs"
      >
        ARS
      </Button>
    </div>
  );
}
