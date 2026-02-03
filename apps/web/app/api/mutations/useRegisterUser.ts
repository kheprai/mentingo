import { useNavigate } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { useToast } from "~/components/ui/use-toast";
import { useCartStore } from "~/lib/stores/cartStore";
import { useNavigationHistoryStore } from "~/lib/stores/navigationHistory";
import { useAuthStore } from "~/modules/Auth/authStore";
import { LOGIN_REDIRECT_URL } from "~/modules/Auth/constants";
import { useCurrentUserStore } from "~/modules/common/store/useCurrentUserStore";

import { ApiClient } from "../api-client";
import { currentUserQueryOptions } from "../queries/useCurrentUser";
import { userSettingsQueryOptions } from "../queries/useUserSettings";
import { queryClient } from "../queryClient";

type RegisterOptions = {
  data: {
    phone: string;
    firstName: string;
    lastName: string;
    otpToken: string;
  };
};

export function useRegisterUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setLoggedIn = useAuthStore((state) => state.setLoggedIn);
  const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);
  const getLastEntry = useNavigationHistoryStore((state) => state.getLastEntry);
  const mergeNavigationHistory = useNavigationHistoryStore((state) => state.mergeNavigationHistory);
  const cleanHistory = useNavigationHistoryStore((state) => state.clearHistory);

  return useMutation({
    mutationFn: async (options: RegisterOptions) => {
      const response = await ApiClient.api.authControllerRegister(options.data as any);
      return response.data;
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData(currentUserQueryOptions.queryKey, { data });
      queryClient.invalidateQueries(currentUserQueryOptions);
      queryClient.invalidateQueries(userSettingsQueryOptions);

      setLoggedIn(true);
      setCurrentUser(data as any);

      mergeNavigationHistory();

      const guestCourseIds = useCartStore.getState().getGuestCourseIds();
      if (guestCourseIds.length > 0) {
        ApiClient.instance
          .post("/api/cart/merge", { courseIds: guestCourseIds })
          .then((res) => {
            useCartStore.getState().replaceCart(res.data.data.items);
          })
          .catch(() => {});
      }

      const lastEntry = getLastEntry();
      navigate(lastEntry?.pathname || LOGIN_REDIRECT_URL);
      cleanHistory();
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        return toast({
          variant: "destructive",
          description: error.response?.data.message,
        });
      }
      toast({
        variant: "destructive",
        description: error.message,
      });
    },
  });
}
