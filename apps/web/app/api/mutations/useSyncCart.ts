import { useMutation } from "@tanstack/react-query";

import { useCartStore } from "~/lib/stores/cartStore";

import { ApiClient } from "../api-client";
import { queryClient } from "../queryClient";
import { serverCartQueryOptions } from "../queries/useServerCart";

import type { ServerCartResponse } from "../queries/useServerCart";

export function useSyncCart() {
  const replaceCart = useCartStore((state) => state.replaceCart);

  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      const response = await ApiClient.instance.post<ServerCartResponse>("/api/cart/merge", {
        courseIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      replaceCart(data.data.items);
      queryClient.invalidateQueries(serverCartQueryOptions);
    },
  });
}
