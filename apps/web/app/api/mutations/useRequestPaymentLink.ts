import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { useToast } from "~/components/ui/use-toast";
import { useCartStore } from "~/lib/stores/cartStore";

import { ApiClient } from "../api-client";

type RequestPaymentLinkResult = {
  data: {
    orderId: string;
    status: string;
  };
};

export function useRequestPaymentLink() {
  const { toast } = useToast();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: async (method: "stripe" | "mercadopago") => {
      const response = await ApiClient.instance.post<RequestPaymentLinkResult>(
        "/api/checkout/request-payment-link",
        { method },
      );
      return response.data.data;
    },
    onSuccess: () => {
      clearCart();
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        return toast({
          variant: "destructive",
          description:
            error.response?.data?.message ?? "Error al generar el link de pago",
        });
      }
      toast({
        variant: "destructive",
        description: error.message,
      });
    },
  });
}
