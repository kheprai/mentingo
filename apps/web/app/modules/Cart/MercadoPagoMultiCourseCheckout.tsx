import { Loader } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { useMercadopagoCartCheckout } from "~/api/mutations/useCartCheckout";
import { useMercadoPagoCustomer } from "~/api/mutations/useMercadoPagoCustomer";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { useCartStore } from "~/lib/stores/cartStore";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import { useMercadoPagoInit } from "~/modules/mercadopago/hooks/useMercadoPagoInit";

import type { IPaymentFormData } from "@mercadopago/sdk-react/bricks/payment/type";

const PaymentBrick = lazy(() =>
  import("@mercadopago/sdk-react").then((module) => ({
    default: module.Payment,
  })),
);

export function MercadoPagoMultiCourseCheckout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { isInitialized, error: initError } = useMercadoPagoInit();
  const { getOrCreateCustomer, isLoading: isCreatingCustomer } = useMercadoPagoCustomer();
  const { mutateAsync: checkout, isPending } = useMercadopagoCartCheckout();

  const items = useCartStore((state) => state.items);
  const totalARS = items.reduce((sum, item) => sum + item.mercadopagoPriceInCents, 0);
  const amountInUnits = totalARS / 100;

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "pending" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId && !isCreatingCustomer) {
      getOrCreateCustomer()
        .then((id) => setCustomerId(id))
        .catch(() => setCustomerId(null));
    }
  }, [customerId, isCreatingCustomer, getOrCreateCustomer]);

  const handleSubmit = async (formData: IPaymentFormData) => {
    if (!currentUser) return;

    setErrorMessage(null);

    try {
      const { formData: data } = formData;

      const result = await checkout({
        token: data.token,
        paymentMethodId: data.payment_method_id,
        email: data.payer.email,
        installments: data.installments,
        identification: data.payer.identification,
      });

      if (result.status === "approved") {
        setPaymentStatus("success");
        navigate(`/orders/${result.orderId}`);
      } else if (result.status === "pending" || result.status === "in_process") {
        setPaymentStatus("pending");
      } else {
        setPaymentStatus("error");
        setErrorMessage(result.statusDetail || t("cart.errors.paymentFailed"));
      }
    } catch {
      setPaymentStatus("error");
      setErrorMessage(t("cart.errors.paymentFailed"));
    }
  };

  const handleError = (error: unknown) => {
    console.error("Payment Brick error:", error);
    setErrorMessage(t("cart.errors.paymentFailed"));
  };

  if (initError) {
    return (
      <div className="rounded-md border border-destructive p-4 text-center text-destructive">
        {initError}
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="rounded-md border border-green-500 bg-green-50 p-4 text-center text-green-700">
        {t("cart.checkout.paymentApproved")}
      </div>
    );
  }

  if (paymentStatus === "pending") {
    return (
      <div className="rounded-md border border-yellow-500 bg-yellow-50 p-4 text-center text-yellow-700">
        {t("cart.checkout.paymentPending")}
      </div>
    );
  }

  if (!isInitialized || isCreatingCustomer) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="size-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Loader className="size-8 animate-spin text-primary-500" />
        </div>
      )}

      <div className="mb-3 text-center text-sm text-neutral-500">
        {t("cart.checkout.total")}:{" "}
        <span className="font-semibold">
          {formatPrice(totalARS, "ARS", getCurrencyLocale("ARS"))}
        </span>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader className="size-8 animate-spin text-primary-500" />
          </div>
        }
      >
        <PaymentBrick
          initialization={{
            amount: amountInUnits,
            payer: {
              email: currentUser?.email || "",
              ...(customerId ? { customerId } : {}),
            },
          }}
          onSubmit={handleSubmit}
          onError={handleError}
          customization={{
            paymentMethods: {
              maxInstallments: 12,
              creditCard: "all",
              debitCard: "all",
            },
            visual: {
              style: {
                theme: "default",
              },
            },
          }}
        />
      </Suspense>

      {errorMessage && (
        <div className="mt-4 rounded-md border border-destructive p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
