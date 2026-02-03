import { Navigate } from "@remix-run/react";
import { match } from "ts-pattern";

import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { LOGIN_REDIRECT_URL } from "~/modules/Auth/constants";

import type React from "react";

type MFAGuardProps = {
  children: React.ReactElement;
  mode: "auth" | "app" | "public";
};

export const MFAGuard = ({ children, mode }: MFAGuardProps) => {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  return match(mode)
    .with("auth", () => {
      if (!currentUser) {
        return children;
      }

      return <Navigate to={LOGIN_REDIRECT_URL} />;
    })
    .with("public", () => {
      return children;
    })
    .with("app", () => {
      if (!currentUser) {
        return <Navigate to="/auth/login" />;
      }

      return children;
    })
    .exhaustive();
};
