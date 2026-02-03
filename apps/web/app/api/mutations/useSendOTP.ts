import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { useToast } from "~/components/ui/use-toast";

import { ApiClient } from "../api-client";

export function useSendOTP() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await ApiClient.instance.post("/api/auth/send-otp", { phone });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.debugCode) {
        toast({
          title: "Debug OTP",
          description: `Codigo: ${data.data.debugCode}`,
        });
      }
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        return toast({
          variant: "destructive",
          description: error.response?.data?.message ?? "Error enviando codigo",
        });
      }
      toast({
        variant: "destructive",
        description: error.message,
      });
    },
  });
}
