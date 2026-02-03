import { useAuthStore } from "~/modules/Auth/authStore";
import { useCurrentUserStore } from "~/modules/common/store/useCurrentUserStore";

import type { CurrentUserResponse } from "~/api/generated-api";

export const useSyncUserAfterLogin = (user?: CurrentUserResponse["data"]) => {
  const setLoggedIn = useAuthStore((state) => state.setLoggedIn);
  const setCurrentUser = useCurrentUserStore(({ setCurrentUser }) => setCurrentUser);

  setLoggedIn(true);
  setCurrentUser(user);
};
