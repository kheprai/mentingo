import { queryOptions, useQuery } from "@tanstack/react-query";

import { ApiClient } from "../api-client";

export const mercadoPagoCardsQueryOptions = () =>
  queryOptions({
    queryKey: ["mercadopago", "cards"],
    queryFn: async () => {
      const response = await ApiClient.api.mercadoPagoControllerGetCustomerCards();
      return response.data.data;
    },
  });

export function useMercadoPagoCards(enabled = true) {
  return useQuery({
    ...mercadoPagoCardsQueryOptions(),
    enabled,
  });
}
