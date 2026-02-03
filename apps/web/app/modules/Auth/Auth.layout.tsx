import { Outlet } from "@remix-run/react";

import { currentUserQueryOptions } from "~/api/queries";
import { queryClient } from "~/api/queryClient";
import { MFAGuard } from "~/Guards/MFAGuard";
import { useAuthStore } from "~/modules/Auth/authStore";

export const clientLoader = async () => {
  try {
    const user = await queryClient.ensureQueryData(currentUserQueryOptions);

    if (!user) {
      useAuthStore.getState().setLoggedIn(false);
    }
  } catch {
    useAuthStore.getState().setLoggedIn(false);
    return null;
  }

  return null;
};

export default function AuthLayout() {
  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <MFAGuard mode="auth">
        <Outlet />
      </MFAGuard>
    </main>
  );
}
