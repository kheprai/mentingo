import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { useCartStore } from "~/lib/stores/cartStore";
import { useToast } from "~/components/ui/use-toast";

import { ApiClient } from "../api-client";

type StripeCheckoutResult = {
  data: {
    clientSecret: string;
    orderId: string;
  };
};

type MercadopagoCheckoutResult = {
  data: {
    orderId: string;
    paymentId: number;
    status: string;
    statusDetail?: string;
  };
};

export function useStripeCartCheckout() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: async (locale?: string) => {
      const response = await ApiClient.instance.post<StripeCheckoutResult>(
        "/api/checkout/stripe",
        { locale },
      );
      return response.data.data;
    },
    onSuccess: () => {
      clearCart();
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast({
          variant: "destructive",
          description:
            error.response?.data?.message ?? t("cart.errors.checkoutFailed"),
        });
      }
    },
  });
}

type FreeCheckoutResult = {
  data: {
    orderId: string;
    enrolledCourseIds: string[];
  };
};

export function useFreeCartCheckout() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);

  return useMutation({
    mutationFn: async (courseIds?: string[]) => {
      const response = await ApiClient.instance.post<FreeCheckoutResult>(
        "/api/checkout/free",
        { courseIds },
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      const remainingItems = items.filter(
        (item) => !data.enrolledCourseIds.includes(item.courseId),
      );
      if (remainingItems.length === 0) {
        clearCart();
      }
      toast({ description: t("cart.checkout.freeEnrollmentSuccess") });
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast({
          variant: "destructive",
          description:
            error.response?.data?.message ?? t("cart.errors.checkoutFailed"),
        });
      }
    },
  });
}

export function useMercadopagoCartCheckout() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: async (data: {
      token: string;
      paymentMethodId: string;
      email: string;
      installments?: number;
      identification?: { type: string; number: string };
    }) => {
      const response = await ApiClient.instance.post<MercadopagoCheckoutResult>(
        "/api/checkout/mercadopago",
        data,
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      clearCart();
      if (data.status === "approved") {
        toast({ description: t("cart.checkout.paymentApproved") });
      } else if (data.status === "pending" || data.status === "in_process") {
        toast({ description: t("cart.checkout.paymentPending") });
      }
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast({
          variant: "destructive",
          description:
            error.response?.data?.message ?? t("cart.errors.paymentFailed"),
        });
      }
    },
  });
}
