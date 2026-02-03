import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@remix-run/react";
import { ArrowLeft, CheckCircle, CreditCard, MessageCircle, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFreeCartCheckout } from "~/api/mutations/useCartCheckout";
import { useRequestPaymentLink } from "~/api/mutations/useRequestPaymentLink";
import { useSendOTP } from "~/api/mutations/useSendOTP";
import { useVerifyOTP } from "~/api/mutations/useVerifyOTP";
import { useRegisterUser } from "~/api/mutations/useRegisterUser";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { OTPInput } from "~/components/ui/OTPInput";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { FormValidationError } from "~/components/ui/form-validation-error";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { useCartCurrency } from "~/lib/hooks/useCartCurrency";
import { useCartStore } from "~/lib/stores/cartStore";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";
import { cn } from "~/lib/utils";

import { CartItemCard } from "./CartItemCard";
import { CurrencyToggle } from "./CurrencyToggle";
import { EmptyCartState } from "./EmptyCartState";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;
  const items = useCartStore((state) => state.items);
  const selectedPaymentMethod = useCartStore((state) => state.selectedPaymentMethod);
  const setSelectedPaymentMethod = useCartStore((state) => state.setSelectedPaymentMethod);
  const { defaultMethod, showToggle, currency } = useCartCurrency();
  const { mutateAsync: freeCheckout, isPending: isFreeCheckoutPending } = useFreeCartCheckout();
  const { mutateAsync: requestPaymentLink, isPending: isRequestingLink } = useRequestPaymentLink();

  const [linkSent, setLinkSent] = useState(false);
  const [sentOrderId, setSentOrderId] = useState<string | null>(null);

  const isFreeItem = (item: (typeof items)[number]) =>
    item.priceInCents === 0 && !item.stripePriceId && !item.mercadopagoProductId;

  const allFree = items.length > 0 && items.every(isFreeItem);
  const hasFree = items.some(isFreeItem);
  const hasPaid = items.some((i) => !isFreeItem(i));

  const subtotal =
    defaultMethod === "mercadopago"
      ? items.reduce((sum, item) => sum + item.mercadopagoPriceInCents, 0)
      : items.reduce((sum, item) => sum + item.priceInCents, 0);

  const hasStripeItems = items.some((item) => item.stripePriceId);
  const hasMPItems = items.some(
    (item) => item.mercadopagoProductId && item.mercadopagoPriceInCents > 0,
  );

  // Auto-select payment method if only one is available
  useEffect(() => {
    if (!showToggle && selectedPaymentMethod !== defaultMethod) {
      setSelectedPaymentMethod(defaultMethod);
    }
  }, [showToggle, defaultMethod, selectedPaymentMethod, setSelectedPaymentMethod]);

  const handleFreeCheckout = async () => {
    const result = await freeCheckout(undefined);
    if (result) {
      navigate("/checkout/success?free=1");
    }
  };

  const handleRequestPaymentLink = async () => {
    const method = selectedPaymentMethod || defaultMethod;
    if (!method) return;

    try {
      const result = await requestPaymentLink(method);
      setLinkSent(true);
      setSentOrderId(result.orderId);
    } catch {
      // Error handled by mutation
    }
  };

  if (items.length === 0 && !linkSent) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyCartState />
      </div>
    );
  }

  if (linkSent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-4 size-16 text-green-500" />
          <h1 className="text-2xl font-bold">
            {t("cart.checkout.linkSentTitle", "Te enviamos el link de pago")}
          </h1>
          <p className="mt-3 text-neutral-600">
            {t(
              "cart.checkout.linkSentDesc",
              "Revisa tu WhatsApp para completar el pago. Te enviamos el detalle de tu compra con el link de pago.",
            )}
          </p>
          {currentUser?.phone && (
            <p className="mt-2 text-sm text-neutral-500">
              {t("cart.checkout.linkSentTo", "Enviado a")} <strong>{currentUser.phone}</strong>
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {sentOrderId && (
            <Button variant="primary" className="w-full" asChild>
              <Link to={`/orders/${sentOrderId}`}>
                {t("cart.checkout.viewOrderStatus", "Ver estado de mi pedido")}
              </Link>
            </Button>
          )}
          <Button variant="outline" className="w-full" asChild>
            <Link to="/">
              {t("cart.confirmation.browseMore", "Seguir explorando")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          to="/cart"
          className="mb-4 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="mr-1 size-4" />
          {t("cart.page.title")}
        </Link>
        <h1 className="text-2xl font-bold">{t("cart.checkout.title")}</h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          {!isLoggedIn && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  {t("cart.checkout.loginRequired")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InlineAuth />
              </CardContent>
            </Card>
          )}

          {isLoggedIn && allFree && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-success-600" />
                  {t("cart.checkout.freeEnrollment")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-neutral-600">
                  {t("cart.checkout.freeEnrollmentDesc")}
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleFreeCheckout}
                  disabled={isFreeCheckoutPending}
                >
                  {t("cart.button.enrollFree")}
                </Button>
              </CardContent>
            </Card>
          )}

          {isLoggedIn && !allFree && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5" />
                  {t("cart.checkout.selectPaymentMethod")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasFree && hasPaid && (
                  <p className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-500">
                    {t("cart.checkout.mixedCartNote")}
                  </p>
                )}

                {showToggle && (
                  <div className="flex gap-3">
                    {hasStripeItems && (
                      <Button
                        variant={selectedPaymentMethod === "stripe" ? "primary" : "outline"}
                        className="flex-1"
                        onClick={() => setSelectedPaymentMethod("stripe")}
                      >
                        Stripe (USD)
                      </Button>
                    )}
                    {hasMPItems && (
                      <Button
                        variant={selectedPaymentMethod === "mercadopago" ? "primary" : "outline"}
                        className="flex-1"
                        onClick={() => setSelectedPaymentMethod("mercadopago")}
                      >
                        MercadoPago (ARS)
                      </Button>
                    )}
                  </div>
                )}

                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 size-5 shrink-0 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        {t(
                          "cart.checkout.whatsappPayment",
                          "Paga desde tu WhatsApp",
                        )}
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        {t(
                          "cart.checkout.whatsappPaymentDesc",
                          "Te enviaremos el detalle de tu compra y un link de pago a tu WhatsApp.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleRequestPaymentLink}
                  disabled={isRequestingLink}
                >
                  {isRequestingLink
                    ? t("cart.checkout.sendingLink", "Enviando link...")
                    : t("cart.checkout.sendPaymentLink", "Enviar link de pago a mi WhatsApp")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:w-80">
          <div className="sticky top-4 rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t("cart.checkout.orderSummary")}
            </h3>

            {!allFree && <CurrencyToggle className="mb-3 justify-end" />}

            <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <div key={item.courseId} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className="shrink-0 font-medium">
                    {isFreeItem(item)
                      ? t("landing.courses.card.free")
                      : defaultMethod === "mercadopago" && item.mercadopagoPriceInCents > 0
                        ? formatPrice(item.mercadopagoPriceInCents, "ARS", getCurrencyLocale("ARS"))
                        : formatPrice(item.priceInCents, "USD", getCurrencyLocale("USD"))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>{t("cart.checkout.total")}</span>
                <span>
                  {allFree
                    ? t("landing.courses.card.free")
                    : formatPrice(subtotal, currency, getCurrencyLocale(currency))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Auth (Phone + OTP) ────────────────────────────────────────────────

type InlineStep = "phone" | "otp" | "register";

const phoneRegex = /^\+[1-9]\d{6,14}$/;

const registerSchema = (t: (key: string, fallback?: string) => string) =>
  z.object({
    phone: z.string().regex(phoneRegex, {
      message: t("registerView.validation.phone", "Ingresa un numero valido con codigo de pais"),
    }),
    firstName: z
      .string()
      .min(1, { message: t("registerView.validation.firstName", "Ingresa tu nombre") }),
    lastName: z
      .string()
      .min(1, { message: t("registerView.validation.lastName", "Ingresa tu apellido") }),
  });

type RegisterFormData = z.infer<ReturnType<typeof registerSchema>>;

function InlineAuth() {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState<string>("login");

  return (
    <Tabs value={authTab} onValueChange={setAuthTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{t("loginView.header")}</TabsTrigger>
        <TabsTrigger value="register">{t("registerView.header")}</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-4">
        <InlineLogin />
      </TabsContent>

      <TabsContent value="register" className="mt-4">
        <InlineRegister />
      </TabsContent>
    </Tabs>
  );
}

function InlineLogin() {
  const { t } = useTranslation();
  const [step, setStep] = useState<InlineStep>("phone");
  const [phone, setPhone] = useState("+54");
  const [resendTimer, setResendTimer] = useState(0);

  const { mutateAsync: sendOTP, isPending: isSendingOTP } = useSendOTP();
  const { mutateAsync: verifyOTP, isPending: isVerifying } = useVerifyOTP();

  const isValidPhone = phoneRegex.test(phone);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = useCallback(async () => {
    if (!isValidPhone) return;
    try {
      await sendOTP(phone);
      setStep("otp");
      setResendTimer(60);
    } catch {
      // Error handled by mutation
    }
  }, [phone, isValidPhone, sendOTP]);

  const handleVerifyOTP = useCallback(
    async (code: string) => {
      try {
        const result = await verifyOTP({ phone, code });
        if (result?.isNewUser && result?.otpToken) {
          // User doesn't exist — they need to register
          window.location.href = `/auth/register?phone=${encodeURIComponent(phone)}&otpToken=${encodeURIComponent(result.otpToken)}`;
        }
        // If existing user, the mutation handles login + page will re-render as logged in
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

  if (step === "otp") {
    return (
      <div className="grid gap-4">
        <p className="text-center text-sm text-neutral-600">
          {t("loginView.otpSentTo", "Enviamos un codigo a")} <strong>{phone}</strong>
        </p>
        <OTPInput onComplete={handleVerifyOTP} disabled={isVerifying} />
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
            className={cn("underline", resendTimer > 0 ? "text-neutral-400" : "text-primary-600")}
          >
            {resendTimer > 0
              ? t("loginView.button.resendIn", "Reenviar en {{seconds}}s", {
                  seconds: resendTimer,
                })
              : t("loginView.button.resendCode", "Reenviar codigo")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="inline-login-phone">
          {t("loginView.field.phone", "Telefono")}
        </Label>
        <Input
          id="inline-login-phone"
          type="tel"
          placeholder="+54 11 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {phone && !isValidPhone && phone.length > 3 && (
          <p className="text-sm text-red-500">
            {t(
              "loginView.validation.phone",
              "Ingresa un numero valido con codigo de pais (ej: +54...)",
            )}
          </p>
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
  );
}

function InlineRegister() {
  const { t } = useTranslation();
  const [step, setStep] = useState<InlineStep>("phone");
  const [otpToken, setOtpToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const { mutateAsync: sendOTP, isPending: isSendingOTP } = useSendOTP();
  const { mutateAsync: verifyOTP, isPending: isVerifying } = useVerifyOTP();
  const { mutate: registerUser, isPending: isRegistering } = useRegisterUser();

  const schema = useMemo(() => registerSchema(t), [t]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      phone: "+54",
      firstName: "",
      lastName: "",
    },
  });

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
          // Register immediately
          const { firstName, lastName } = getValues();
          registerUser({
            data: { phone, firstName, lastName, otpToken: result.otpToken },
          });
        }
        // If user already exists, the verify mutation handles login
      } catch {
        // Error handled by mutation
      }
    },
    [getValues, verifyOTP, registerUser],
  );

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

  const onSubmit = async (_data: RegisterFormData) => {
    if (otpToken) {
      const { phone, firstName, lastName } = getValues();
      registerUser({ data: { phone, firstName, lastName, otpToken } });
      return;
    }
    await handleSendOTP();
  };

  if (step === "otp") {
    return (
      <div className="grid gap-4">
        <p className="text-center text-sm text-neutral-600">
          {t("registerView.otpSentTo", "Enviamos un codigo a")}{" "}
          <strong>{getValues("phone")}</strong>
        </p>
        <OTPInput onComplete={handleVerifyOTP} disabled={isVerifying || isRegistering} />
        {(isVerifying || isRegistering) && (
          <p className="text-center text-sm text-neutral-500">
            {t("registerView.verifying", "Verificando...")}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-neutral-500 underline"
          >
            {t("registerView.button.back", "Volver")}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className={cn("underline", resendTimer > 0 ? "text-neutral-400" : "text-primary-600")}
          >
            {resendTimer > 0
              ? t("registerView.button.resendIn", "Reenviar en {{seconds}}s", {
                  seconds: resendTimer,
                })
              : t("registerView.button.resendCode", "Reenviar codigo")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="inline-reg-firstName">{t("registerView.field.firstName")}</Label>
          <Input id="inline-reg-firstName" type="text" placeholder="Juan" {...register("firstName")} />
          {errors.firstName?.message && (
            <FormValidationError message={errors.firstName.message} />
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="inline-reg-lastName">{t("registerView.field.lastName")}</Label>
          <Input id="inline-reg-lastName" type="text" placeholder="Perez" {...register("lastName")} />
          {errors.lastName?.message && (
            <FormValidationError message={errors.lastName.message} />
          )}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="inline-reg-phone">{t("registerView.field.phone", "Telefono")}</Label>
        <Input id="inline-reg-phone" type="tel" placeholder="+54 11 1234 5678" {...register("phone")} />
        {errors.phone?.message && <FormValidationError message={errors.phone.message} />}
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
  );
}
