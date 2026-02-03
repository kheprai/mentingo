import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useNavigate } from "@remix-run/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useStripeCartCheckout } from "~/api/mutations/useCartCheckout";
import { Button } from "~/components/ui/button";
import { useStripePromise } from "~/modules/stripe/hooks/useStripePromise";

export function StripeMultiCourseCheckout() {
  const { t, i18n } = useTranslation();
  const stripePromise = useStripePromise();
  const navigate = useNavigate();
  const { mutateAsync: createCheckout } = useStripeCartCheckout();
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const result = await createCheckout(i18n.language);
    setOrderId(result.orderId);
    return result.clientSecret;
  }, [createCheckout, i18n.language]);

  const handleComplete = useCallback(() => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  }, [orderId, navigate]);

  if (!showEmbedded) {
    return (
      <Button
        variant="primary"
        className="w-full"
        onClick={() => setShowEmbedded(true)}
      >
        {t("cart.checkout.payNow")}
      </Button>
    );
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret,
        onComplete: handleComplete,
      }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
