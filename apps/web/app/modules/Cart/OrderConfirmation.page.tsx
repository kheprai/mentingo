import { Link, useParams } from "@remix-run/react";
import { CheckCircle, Clock, Loader } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiClient } from "~/api/api-client";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

type OrderDetail = {
  id: string;
  status: string;
  provider: string;
  totalAmountInCents: number;
  currency: string;
  createdAt: string;
  items: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    courseThumbnailUrl: string | null;
    priceInCents: number;
    currency: string;
  }>;
};

const POLL_INTERVAL_MS = 5000;

export default function OrderConfirmationPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const res = await ApiClient.instance.get(`/api/orders/${orderId}`);
      setOrder(res.data.data);
      return res.data.data as OrderDetail;
    } catch {
      setOrder(null);
      return null;
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  // Poll while awaiting_payment
  useEffect(() => {
    if (!order || order.status !== "awaiting_payment") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      const updated = await fetchOrder();
      if (updated && updated.status !== "awaiting_payment") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [order?.status, fetchOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="size-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500">{t("cart.confirmation.notFound")}</p>
        <Button variant="primary" className="mt-4" asChild>
          <Link to="/">{t("cart.confirmation.browseMore")}</Link>
        </Button>
      </div>
    );
  }

  const isAwaitingPayment = order.status === "awaiting_payment";
  const isCompleted = order.status === "completed" || order.status === "approved";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        {isAwaitingPayment ? (
          <>
            <Clock className="mx-auto mb-4 size-16 text-yellow-500" />
            <h1 className="text-2xl font-bold">
              {t("cart.confirmation.awaitingPaymentTitle", "Esperando pago...")}
            </h1>
            <p className="mt-2 text-neutral-500">
              {t(
                "cart.confirmation.awaitingPaymentDesc",
                "Usa el link de pago que te enviamos por WhatsApp para completar tu compra.",
              )}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
              <Loader className="size-4 animate-spin" />
              {t(
                "cart.confirmation.pollingStatus",
                "Actualizando automaticamente...",
              )}
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
            <h1 className="text-2xl font-bold">{t("cart.confirmation.title")}</h1>
            <p className="mt-2 text-neutral-500">{t("cart.confirmation.subtitle")}</p>
          </>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between text-sm text-neutral-500">
          <span>
            {t("cart.confirmation.orderId")}: {order.id.slice(0, 8)}...
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : isAwaitingPayment
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {isAwaitingPayment
              ? t("cart.confirmation.statusAwaiting", "Esperando pago")
              : order.status}
          </span>
        </div>

        <h3 className="mb-3 font-semibold">
          {isCompleted
            ? t("cart.confirmation.enrolledCourses")
            : t("cart.confirmation.orderItems", "Cursos en tu pedido")}
        </h3>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
              {item.courseThumbnailUrl && (
                <img
                  src={item.courseThumbnailUrl}
                  alt={item.courseTitle}
                  className="size-12 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.courseTitle}</p>
                <p className="text-sm text-neutral-500">
                  {formatPrice(
                    item.priceInCents,
                    item.currency,
                    getCurrencyLocale(item.currency),
                  )}
                </p>
              </div>
              {isCompleted && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/course/${item.courseId}`}>
                    {t("cart.confirmation.goToCourse")}
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between font-semibold">
            <span>{t("cart.checkout.total")}</span>
            <span>
              {formatPrice(
                order.totalAmountInCents,
                order.currency,
                getCurrencyLocale(order.currency),
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button variant="primary" asChild>
          <Link to="/">{t("cart.confirmation.browseMore")}</Link>
        </Button>
      </div>
    </div>
  );
}
