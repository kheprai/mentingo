import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { useToast } from "~/components/ui/use-toast";

import { ApiClient } from "../api-client";
import { queryClient } from "../queryClient";
import { serverCartQueryOptions } from "../queries/useServerCart";

export function useRemoveFromServerCart() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await ApiClient.instance.delete(`/api/cart/items/${courseId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(serverCartQueryOptions);
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast({
          variant: "destructive",
          description: error.response?.data?.message ?? t("cart.errors.removeFailed"),
        });
      }
    },
  });
}
