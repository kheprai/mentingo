import { Link, useSearchParams } from "@remix-run/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { version } from "~/../version.json";
import { useSendOTP } from "~/api/mutations/useSendOTP";
import { useVerifyOTP } from "~/api/mutations/useVerifyOTP";
import { useGlobalSettingsSuspense } from "~/api/queries/useGlobalSettings";
import useLoginPageFiles from "~/api/queries/useLoginPageFiles";
import { useSSOEnabled } from "~/api/queries/useSSOEnabled";
import { OTPInput } from "~/components/ui/OTPInput";
import { PlatformLogo } from "~/components/PlatformLogo";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { UploadFilesToLoginPagePreviewDialog } from "~/modules/Dashboard/Settings/components/admin/UploadFilesToLoginPagePreviewDialog";
import { setPageTitle } from "~/utils/setPageTitle";

import { SocialLogin } from "./components";

import type { LoginPageResource } from "../Dashboard/Settings/components/admin/UploadFilesToLoginPageItem";
import type { MetaFunction } from "@remix-run/react";

export const meta: MetaFunction = ({ matches }) => setPageTitle(matches, "pages.login");

type Step = "phone" | "otp";

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const error = searchParams.get("error");

  const { data: loginPageFiles } = useLoginPageFiles();

  const [previewResource, setPreviewResource] = useState<LoginPageResource | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        description: error,
      });
      setSearchParams({});
    }
  }, [error, setSearchParams]);

  const { t } = useTranslation();

  const { data: ssoEnabled } = useSSOEnabled();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+54");
  const [resendTimer, setResendTimer] = useState(0);

  const { mutateAsync: sendOTP, isPending: isSendingOTP } = useSendOTP();
  const { mutateAsync: verifyOTP, isPending: isVerifying } = useVerifyOTP();

  const handlePreviewClick = (resource: LoginPageResource) => {
    setPreviewResource(resource);
    setIsPreviewDialogOpen(true);
  };

  const handleClosePreviewDialog = () => {
    setIsPreviewDialogOpen(false);
    setPreviewResource(null);
  };

  const isGoogleOAuthEnabled =
    (ssoEnabled?.data.google ?? import.meta.env.VITE_GOOGLE_OAUTH_ENABLED) === "true";

  const isMicrosoftOAuthEnabled =
    (ssoEnabled?.data.microsoft ?? import.meta.env.VITE_MICROSOFT_OAUTH_ENABLED) === "true";

  const isSlackOAuthEnabled =
    (ssoEnabled?.data.slack ?? import.meta.env.VITE_SLACK_OAUTH_ENABLED) === "true";

  const {
    data: {
      enforceSSO: isSSOEnforced,
      inviteOnlyRegistration,
      loginBackgroundImageS3Key,
    },
  } = useGlobalSettingsSuspense();

  const isAnyProviderEnabled = useMemo(
    () => isGoogleOAuthEnabled || isMicrosoftOAuthEnabled || isSlackOAuthEnabled,
    [isGoogleOAuthEnabled, isMicrosoftOAuthEnabled, isSlackOAuthEnabled],
  );

  const loginResources = loginPageFiles?.resources ?? [];

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = useCallback(async () => {
    if (!phone || phone.length < 8) return;

    try {
      await sendOTP(phone);
      setStep("otp");
      setResendTimer(60);
    } catch {
      // Error handled by mutation
    }
  }, [phone, sendOTP]);

  const handleVerifyOTP = useCallback(
    async (code: string) => {
      try {
        const result = await verifyOTP({ phone, code });

        if (result?.isNewUser && result?.otpToken) {
          // Redirect to register with otpToken
          const params = new URLSearchParams({
            phone,
            otpToken: result.otpToken,
          });
          window.location.href = `/auth/register?${params.toString()}`;
        }
        // If not new user, the mutation handles navigation
      } catch {
        // Error handled by mutation
      }
    },
    [phone, verifyOTP],
  );

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return;
    try {
      await sendOTP(phone);
      setResendTimer(60);
    } catch {
      // Error handled by mutation
    }
  }, [phone, sendOTP, resendTimer]);

  const isValidPhone = phone.match(/^\+[1-9]\d{6,14}$/);

  return (
    <>
      {loginBackgroundImageS3Key && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${loginBackgroundImageS3Key}) `,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle role="heading" className="text-2xl">
            <Link to="/" className="mb-6 flex justify-center">
              <PlatformLogo className="h-16 w-auto py-3" alt="Platform Logo" />
            </Link>
            {t("loginView.header")}
          </CardTitle>
          <CardDescription>
            {isSSOEnforced
              ? t("loginView.subHeaderSSO")
              : step === "phone"
                ? t("loginView.subHeaderPhone", "Ingresa tu numero de telefono para continuar")
                : t("loginView.subHeaderOTP", "Ingresa el codigo que recibiste por WhatsApp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSSOEnforced && (
            <>
              {step === "phone" && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      {t("loginView.field.phone", "Telefono")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+54 11 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn({ "border-red-500": phone && !isValidPhone })}
                    />
                    {phone && !isValidPhone && phone.length > 3 && (
                      <div className="text-sm text-red-500">
                        {t("loginView.validation.phone", "Ingresa un numero valido con codigo de pais (ej: +54...)")}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!isValidPhone || isSendingOTP}
                    onClick={handleSendOTP}
                  >
                    {isSendingOTP
                      ? t("loginView.button.sending", "Enviando...")
                      : t("loginView.button.sendCode", "Enviar codigo")}
                  </Button>
                </div>
              )}

              {step === "otp" && (
                <div className="grid gap-4">
                  <p className="text-center text-sm text-neutral-600">
                    {t("loginView.otpSentTo", "Enviamos un codigo a")} <strong>{phone}</strong>
                  </p>
                  <OTPInput
                    onComplete={handleVerifyOTP}
                    disabled={isVerifying}
                  />
                  {isVerifying && (
                    <p className="text-center text-sm text-neutral-500">
                      {t("loginView.verifying", "Verificando...")}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      className="text-neutral-500 underline"
                    >
                      {t("loginView.button.changePhone", "Cambiar numero")}
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0}
                      className={cn(
                        "underline",
                        resendTimer > 0 ? "text-neutral-400" : "text-primary-600",
                      )}
                    >
                      {resendTimer > 0
                        ? t("loginView.button.resendIn", "Reenviar en {{seconds}}s", { seconds: resendTimer })
                        : t("loginView.button.resendCode", "Reenviar codigo")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {isAnyProviderEnabled && (
            <SocialLogin
              isSSOEnforced={isSSOEnforced}
              isGoogleOAuthEnabled={isGoogleOAuthEnabled}
              isMicrosoftOAuthEnabled={isMicrosoftOAuthEnabled}
              isSlackOAuthEnabled={isSlackOAuthEnabled}
            />
          )}

          {!inviteOnlyRegistration && (
            <div className="mt-4 text-center text-sm">
              {t("loginView.other.dontHaveAccount")}{" "}
              <Link to="/auth/register" className="underline">
                {t("loginView.other.signUp")}
              </Link>
            </div>
          )}

          {loginResources.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center text-sm text-neutral-400">
              {loginResources.map((resource, index) => (
                <div key={resource.id} className="flex items-center">
                  {index > 0 && loginResources.length > 1 && (
                    <Separator orientation="vertical" className="mx-2 h-4 bg-neutral-300" />
                  )}
                  <button
                    type="button"
                    onClick={() => handlePreviewClick(resource)}
                    className="truncate text-sm underline"
                  >
                    {resource.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="bottom-4 mt-4 text-center text-sm text-neutral-300">
            {t("common.other.appVersion", { version })}
          </p>
        </CardContent>
      </Card>
      <UploadFilesToLoginPagePreviewDialog
        open={isPreviewDialogOpen}
        resourceName={previewResource?.name ?? t("loginFilesUpload.unnamedFile")}
        resourceUrl={previewResource?.resourceUrl ?? ""}
        onClose={handleClosePreviewDialog}
      />
    </>
  );
}
