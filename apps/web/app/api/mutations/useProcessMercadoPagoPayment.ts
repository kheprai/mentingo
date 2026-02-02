import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { courseQueryOptions } from "~/api/queries/useCourse";
import { useToast } from "~/components/ui/use-toast";

import { ApiClient } from "../api-client";

type ProcessMercadoPagoPayment = {
  token: string;
  amount: number;
  description: string;
  installments?: number;
  paymentMethodId: string;
  email: string;
  courseId: string;
  userId: string;
  identification?: {
    type: string;
    number: string;
  };
};

type MercadoPagoPaymentResult = {
  id: number;
  status: string;
  statusDetail?: string;
  externalReference?: string;
};

export function useProcessMercadoPagoPayment() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation<MercadoPagoPaymentResult, Error, ProcessMercadoPagoPayment>({
    mutationFn: async (options: ProcessMercadoPagoPayment) => {
      const response = await ApiClient.api.mercadoPagoControllerProcessPayment({
        token: options.token,
        amount: options.amount,
        description: options.description,
        installments: options.installments ?? 1,
        paymentMethodId: options.paymentMethodId,
        email: options.email,
        courseId: options.courseId,
        userId: options.userId,
        identification: options.identification,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      if (data.status === "approved") {
        toast({
          description: t("paymentView.toast.paymentApproved"),
        });
        // Invalidate course query to refresh enrollment status
        queryClient.invalidateQueries(courseQueryOptions(variables.courseId));
      } else if (data.status === "pending" || data.status === "in_process") {
        toast({
          description: t("paymentView.toast.paymentPending"),
        });
      } else if (data.status === "rejected") {
        toast({
          variant: "destructive",
          description: t("paymentView.toast.paymentRejected"),
        });
      }
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast({
          variant: "destructive",
          description: error.response?.data.message || t("paymentView.toast.failed"),
        });
      } else {
        toast({
          variant: "destructive",
          description: error.message || t("paymentView.toast.somethingWentWrong"),
        });
      }
    },
  });

  return {
    processPayment: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
