import { useMutation } from "@tanstack/react-query";

import { ApiClient } from "../api-client";

export function useMercadoPagoCustomer() {
  const mutation = useMutation<string, Error>({
    mutationFn: async () => {
      const response = await ApiClient.api.mercadoPagoControllerGetOrCreateCustomer();
      return response.data.data.customerId;
    },
  });

  return {
    getOrCreateCustomer: mutation.mutateAsync,
    isLoading: mutation.isPending,
    customerId: mutation.data,
    error: mutation.error,
  };
}
