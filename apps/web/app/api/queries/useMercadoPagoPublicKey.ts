import { useQuery } from "@tanstack/react-query";

import { ApiClient } from "../api-client";

import type { GetMercadoPagoPublicKeyResponse } from "../generated-api";

export const MERCADOPAGO_PUBLIC_KEY_QUERY_KEY = ["env", "mercadopago", "publicKey"];

export const mercadoPagoPublicKeyQueryOptions = () => {
  return {
    queryKey: MERCADOPAGO_PUBLIC_KEY_QUERY_KEY,
    queryFn: async () => {
      const response = await ApiClient.api.envControllerGetMercadoPagoPublicKey();
      return response.data;
    },
    select: (data: GetMercadoPagoPublicKeyResponse) => data.data,
  };
};

export function useMercadoPagoPublicKey() {
  return useQuery(mercadoPagoPublicKeyQueryOptions());
}
