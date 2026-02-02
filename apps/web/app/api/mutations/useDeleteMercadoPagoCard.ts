import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "~/components/ui/use-toast";

import { ApiClient } from "../api-client";

export function useDeleteMercadoPagoCard() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (cardId: string) => {
      await ApiClient.api.mercadoPagoControllerDeleteCustomerCard(cardId);
    },
    onSuccess: () => {
      toast({ description: t("paymentView.savedCards.deleted") });
      queryClient.invalidateQueries({ queryKey: ["mercadopago", "cards"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: t("paymentView.savedCards.deleteError"),
      });
    },
  });

  return {
    deleteCard: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
