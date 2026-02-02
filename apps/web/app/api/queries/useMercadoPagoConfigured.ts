import { queryOptions, useQuery } from "@tanstack/react-query";

import { ApiClient } from "../api-client";

export const mercadoPagoConfiguredQueryOptions = () =>
  queryOptions({
    queryKey: ["mercadopago-configured"],
    queryFn: async () => {
      const response = await ApiClient.api.envControllerGetMercadoPagoConfigured();
      return response.data;
    },
    select: (data) => data.data,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export function useMercadoPagoConfigured() {
  return useQuery(mercadoPagoConfiguredQueryOptions());
}
