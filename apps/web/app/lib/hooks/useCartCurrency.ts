import { useMercadoPagoConfigured } from "~/api/queries/useMercadoPagoConfigured";
import { useStripeConfigured } from "~/api/queries/useStripeConfigured";
import { useCartStore } from "~/lib/stores/cartStore";

type PaymentMethod = "stripe" | "mercadopago";

type CartCurrencyResult = {
  availableMethods: PaymentMethod[];
  defaultMethod: PaymentMethod;
  showToggle: boolean;
  currency: string;
};

export function useCartCurrency(): CartCurrencyResult {
  const { data: stripeConfig } = useStripeConfigured();
  const { data: mpConfig } = useMercadoPagoConfigured();
  const selectedPaymentMethod = useCartStore((state) => state.selectedPaymentMethod);
  const items = useCartStore((state) => state.items);

  const stripeEnabled = stripeConfig?.enabled ?? false;
  const mpEnabled = mpConfig?.enabled ?? false;

  const availableMethods: PaymentMethod[] = [];
  if (stripeEnabled) availableMethods.push("stripe");
  if (mpEnabled) availableMethods.push("mercadopago");

  const showToggle = availableMethods.length > 1;

  let defaultMethod: PaymentMethod;
  if (showToggle) {
    defaultMethod = selectedPaymentMethod ?? "mercadopago";
  } else if (mpEnabled) {
    defaultMethod = "mercadopago";
  } else if (stripeEnabled) {
    defaultMethod = "stripe";
  } else {
    // Configs not loaded yet (guest user or loading) — infer from cart items
    const hasMP = items.some((i) => i.mercadopagoProductId && i.mercadopagoPriceInCents > 0);
    const hasStripe = items.some((i) => i.stripePriceId);
    if (hasMP && !hasStripe) {
      defaultMethod = "mercadopago";
    } else if (hasStripe && !hasMP) {
      defaultMethod = "stripe";
    } else {
      defaultMethod = selectedPaymentMethod ?? "mercadopago";
    }
  }

  const currency = defaultMethod === "mercadopago" ? "ARS" : "USD";

  return { availableMethods, defaultMethod, showToggle, currency };
}
