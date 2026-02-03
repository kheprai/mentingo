import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "@remix-run/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useRegisterUser } from "~/api/mutations/useRegisterUser";
import { useSendOTP } from "~/api/mutations/useSendOTP";
import { useVerifyOTP } from "~/api/mutations/useVerifyOTP";
import { useGlobalSettingsSuspense } from "~/api/queries/useGlobalSettings";
import { useSSOEnabled } from "~/api/queries/useSSOEnabled";
import { OTPInput } from "~/components/ui/OTPInput";
import { PlatformLogo } from "~/components/PlatformLogo";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormValidationError } from "~/components/ui/form-validation-error";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { setPageTitle } from "~/utils/setPageTitle";

import { SocialLogin } from "./components";

import type { MetaFunction } from "@remix-run/react";

export const meta: MetaFunction = ({ matches }) => setPageTitle(matches, "pages.register");

type Step = "form" | "otp";

const registerFormSchema = (t: (key: string, fallback?: string) => string) =>
  z.object({
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, {
      message: t("registerView.validation.phone", "Ingresa un numero valido con codigo de pais"),
    }),
    firstName: z.string().min(1, { message: t("registerView.validation.firstName", "Ingresa tu nombre") }),
    lastName: z.string().min(1, { message: t("registerView.validation.lastName", "Ingresa tu apellido") }),
  });

type RegisterFormData = z.infer<ReturnType<typeof registerFormSchema>>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we arrived from login with a verified OTP
  const prefilledPhone = searchParams.get("phone") ?? "";
  const prefilledOtpToken = searchParams.get("otpToken") ?? "";

  const [step, setStep] = useState<Step>("form");
  const [otpToken, setOtpToken] = useState(prefilledOtpToken);
  const [resendTimer, setResendTimer] = useState(0);

  const { mutateAsync: sendOTP, isPending: isSendingOTP } = useSendOTP();
  const { mutateAsync: verifyOTP, isPending: isVerifying } = useVerifyOTP();
  const { mutate: registerUser, isPending: isRegistering } = useRegisterUser();

  const { data: ssoEnabled } = useSSOEnabled();

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

  useEffect(() => {
    if (inviteOnlyRegistration) {
      toast({
        description: t("inviteOnlyRegistrationView.toast.registerRedirect"),
        variant: "destructive",
      });
      return navigate("/auth/login");
    }
  }, [inviteOnlyRegistration, navigate, toast, t]);

  const schema = useMemo(() => registerFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      phone: prefilledPhone || "+54",
      firstName: "",
      lastName: "",
    },
  });

  // If we have a prefilled otpToken from login, go straight to registration
  useEffect(() => {
    if (prefilledOtpToken && prefilledPhone) {
      setOtpToken(prefilledOtpToken);
    }
  }, [prefilledOtpToken, prefilledPhone]);

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = useCallback(async () => {
    const phone = getValues("phone");
    if (!phone) return;

    try {
      await sendOTP(phone);
      setStep("otp");
      setResendTimer(60);
    } catch {
      // Error handled by mutation
    }
  }, [getValues, sendOTP]);

  const handleVerifyOTP = useCallback(
    async (code: string) => {
      const phone = getValues("phone");
      try {
        const result = await verifyOTP({ phone, code });

        if (result?.isNewUser && result?.otpToken) {
          setOtpToken(result.otpToken);
          // Now we can register
          const { firstName, lastName } = getValues();
          registerUser({
            data: {
              phone,
              firstName,
              lastName,
              otpToken: result.otpToken,
            },
          });
        }
        // If user already exists, the verify mutation handles login+navigation
      } catch {
        // Error handled by mutation
      }
    },
    [getValues, verifyOTP, registerUser],
  );

  const onSubmit = async (_data: RegisterFormData) => {
    if (isSSOEnforced && isAnyProviderEnabled) return;

    // If we already have an otpToken (from login redirect), register directly
    if (otpToken) {
      const { phone, firstName, lastName } = getValues();
      registerUser({
        data: { phone, firstName, lastName, otpToken },
      });
      return;
    }

    // Otherwise send OTP first
    await handleSendOTP();
  };

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return;
    const phone = getValues("phone");
    try {
      await sendOTP(phone);
      setResendTimer(60);
    } catch {
      // Error handled by mutation
    }
  }, [getValues, sendOTP, resendTimer]);

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
          <Link to="/" className="mb-6 flex justify-center">
            <PlatformLogo className="h-16 w-auto py-3" alt="Platform Logo" />
          </Link>
          <CardTitle className="text-xl">{t("registerView.header")}</CardTitle>
          <CardDescription>
            {isSSOEnforced
              ? t("registerView.subHeaderSSO")
              : step === "form"
                ? t("registerView.subHeaderPhone", "Completa tus datos para crear tu cuenta")
                : t("registerView.subHeaderOTP", "Ingresa el codigo que recibiste por WhatsApp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSSOEnforced && (
            <>
              {step === "form" && (
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">{t("registerView.field.firstName")}</Label>
                    <Input id="firstName" type="text" placeholder="Juan" {...register("firstName")} />
                    {errors.firstName?.message && (
                      <FormValidationError message={errors.firstName.message} />
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lastName">{t("registerView.field.lastName")}</Label>
                    <Input id="lastName" type="text" placeholder="Perez" {...register("lastName")} />
                    {errors.lastName?.message && (
                      <FormValidationError message={errors.lastName.message} />
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      {t("registerView.field.phone", "Telefono")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+54 11 1234 5678"
                      {...register("phone")}
                    />
                    {errors.phone?.message && (
                      <FormValidationError message={errors.phone.message} />
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isValid || isSendingOTP || isRegistering}
                  >
                    {isSendingOTP || isRegistering
                      ? t("registerView.button.creating", "Creando cuenta...")
                      : otpToken
                        ? t("registerView.button.createAccount")
                        : t("registerView.button.sendCode", "Enviar codigo")}
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <div className="grid gap-4">
                  <p className="text-center text-sm text-neutral-600">
                    {t("registerView.otpSentTo", "Enviamos un codigo a")}{" "}
                    <strong>{getValues("phone")}</strong>
                  </p>
                  <OTPInput
                    onComplete={handleVerifyOTP}
                    disabled={isVerifying || isRegistering}
                  />
                  {(isVerifying || isRegistering) && (
                    <p className="text-center text-sm text-neutral-500">
                      {t("registerView.verifying", "Verificando...")}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="text-neutral-500 underline"
                    >
                      {t("registerView.button.back", "Volver")}
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
                        ? t("registerView.button.resendIn", "Reenviar en {{seconds}}s", { seconds: resendTimer })
                        : t("registerView.button.resendCode", "Reenviar codigo")}
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

          <div className="mt-4 text-center text-sm">
            {t("registerView.other.alreadyHaveAccount")}{" "}
            <Link to="/auth/login" className="underline">
              {t("registerView.button.signIn")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
