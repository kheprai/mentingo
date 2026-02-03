import { queryOptions, useQuery } from "@tanstack/react-query";

import { ApiClient } from "../api-client";

import type { CartItem } from "~/lib/stores/cartStore";

export type ServerCartResponse = {
  data: {
    items: CartItem[];
    itemCount: number;
  };
};

export const serverCartQueryOptions = queryOptions({
  queryKey: ["server-cart"],
  queryFn: async () => {
    const response = await ApiClient.instance.get<ServerCartResponse>("/api/cart");
    return response.data;
  },
  select: (data: ServerCartResponse) => data.data,
  enabled: false,
});

export function useServerCart(enabled = false) {
  return useQuery({
    ...serverCartQueryOptions,
    enabled,
  });
}
