import { Loader } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import { useProcessMercadoPagoPayment } from "~/api/mutations/useProcessMercadoPagoPayment";
import { courseQueryOptions } from "~/api/queries/useCourse";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { queryClient } from "~/api/queryClient";
import { Enroll } from "~/assets/svgs";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import { useMercadoPagoInit } from "./hooks/useMercadoPagoInit";

// Lazy load the CardPayment component to avoid SSR/ESM issues
const CardPayment = lazy(() =>
  import("@mercadopago/sdk-react").then((module) => ({
    default: module.CardPayment,
  })),
);

type MercadoPagoCheckoutProps = {
  coursePrice: number;
  courseCurrency: string;
  courseTitle: string;
  courseDescription: string;
  courseId: string;
};

type CardPaymentFormData = {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
};

export function MercadoPagoCheckout({
  coursePrice,
  courseCurrency,
  courseTitle,
  courseId,
}: MercadoPagoCheckoutProps) {
  const { data: currentUser } = useCurrentUser();
  const { isInitialized, error: initError } = useMercadoPagoInit();
  const { processPayment, isLoading } = useProcessMercadoPagoPayment();
  const { t } = useTranslation();

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "pending" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Convert price from cents to currency units for MercadoPago
  const amountInUnits = coursePrice / 100;

  const handleShowCheckout = () => setShowCheckout(true);

  const handleSubmit = async (formData: CardPaymentFormData) => {
    if (!currentUser) {
      setErrorMessage(t("paymentView.error.notLoggedIn"));
      return;
    }

    setErrorMessage(null);

    try {
      const result = await processPayment({
        token: formData.token,
        amount: formData.transaction_amount,
        description: `Curso: ${courseTitle}`,
        installments: formData.installments,
        paymentMethodId: formData.payment_method_id,
        email: formData.payer.email,
        courseId: courseId,
        userId: currentUser.id,
        identification: formData.payer.identification,
      });

      if (result.status === "approved") {
        setPaymentStatus("success");
        // Refresh course data to show enrollment
        queryClient.invalidateQueries(courseQueryOptions(courseId));
      } else if (result.status === "pending" || result.status === "in_process") {
        setPaymentStatus("pending");
      } else {
        setPaymentStatus("error");
        setErrorMessage(result.statusDetail || t("paymentView.error.paymentFailed"));
      }
    } catch {
      setPaymentStatus("error");
      setErrorMessage(t("paymentView.error.paymentFailed"));
    }
  };

  const handleError = (error: unknown) => {
    console.error("CardPayment error:", error);
    setErrorMessage(t("paymentView.error.cardError"));
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
        {t("paymentView.success.paymentApproved")}
      </div>
    );
  }

  if (paymentStatus === "pending") {
    return (
      <div className="rounded-md border border-yellow-500 bg-yellow-50 p-4 text-center text-yellow-700">
        {t("paymentView.pending.paymentPending")}
      </div>
    );
  }

  if (!showCheckout) {
    return (
      <Button onClick={handleShowCheckout} className="gap-x-2" variant="primary">
        <Enroll />
        <span>
          {t("paymentView.other.enrollCourse")} -{" "}
          {formatPrice(coursePrice, courseCurrency, getCurrencyLocale(courseCurrency))}
        </span>
      </Button>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Loader className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        }
      >
        <CardPayment
          initialization={{
            amount: amountInUnits,
            payer: {
              email: currentUser?.email || "",
            },
          }}
          onSubmit={handleSubmit}
          onError={handleError}
          customization={{
            paymentMethods: {
              maxInstallments: 12,
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
