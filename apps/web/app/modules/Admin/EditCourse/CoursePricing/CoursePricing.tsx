import { CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useMercadoPagoConfigured } from "~/api/queries/useMercadoPagoConfigured";
import { useStripeConfigured } from "~/api/queries/useStripeConfigured";
import { PriceInput } from "~/components/PriceInput/PriceInput";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

import { useCoursePricingForm } from "./hooks/useCoursePricingForm";

import type { SupportedLanguages } from "@repo/shared";

type CoursePricingProps = {
  courseId: string;
  priceInCents?: number;
  mercadopagoPriceInCents?: number;
  currency?: string;
  language: SupportedLanguages;
};

const CoursePricing = ({
  courseId,
  priceInCents,
  mercadopagoPriceInCents,
  currency,
  language,
}: CoursePricingProps) => {
  const { form, onSubmit } = useCoursePricingForm({
    courseId,
    priceInCents,
    mercadopagoPriceInCents,
    currency,
    language,
  });
  const { setValue, watch } = form;
  const { t } = useTranslation();
  const { data: stripeConfigured } = useStripeConfigured();
  const { data: mercadoPagoConfigured } = useMercadoPagoConfigured();

  const isFree = watch("isFree");
  return (
    <div className="flex w-full max-w-[744px] flex-col gap-y-6 bg-white p-8">
      <div className="flex flex-col gap-y-1.5">
        <h5 className="h5 text-neutral-950">{t("adminCourseView.pricing.header")}</h5>
        <p className="body-base text-neutral-900">{t("adminCourseView.pricing.subHeader")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-6">
          <div className="flex flex-col space-y-6">
            <Card
              className={cn(
                "flex w-[680px] cursor-pointer items-start gap-x-4 rounded-md border px-6 py-4",
                {
                  "border-primary-500 bg-primary-50": isFree === true,
                },
              )}
              onClick={() => setValue("isFree", true)}
            >
              <div className="mt-1.5">
                <Input
                  type="radio"
                  name="isFree"
                  checked={isFree === true}
                  onChange={() => setValue("isFree", true)}
                  className="size-4 cursor-pointer p-1"
                  id="isFree"
                />
              </div>
              <Label htmlFor="isFree" className="body-lg-md cursor-pointer text-neutral-950">
                <div className="body-lg-md mb-2 text-neutral-950">
                  {t("adminCourseView.pricing.freeCourseHeader")}
                </div>
                <div
                  className={cn("body-base", {
                    "text-neutral-900": !isFree,
                    "text-neutral-950": isFree,
                  })}
                >
                  {t("adminCourseView.pricing.freeCourseBody")}
                </div>{" "}
              </Label>
            </Card>

            <Card
              className={cn(
                "flex w-[680px] cursor-pointer items-start gap-x-4 rounded-md border px-6 py-4",
                {
                  "border-primary-500 bg-primary-50": isFree === false,
                },
              )}
              onClick={() => setValue("isFree", false)}
            >
              <div className="mt-1.5">
                <Input
                  type="radio"
                  name="isPaid"
                  checked={isFree === false}
                  onChange={() => setValue("isFree", false)}
                  className="size-4 cursor-pointer p-1 pt-4"
                  id="isPaid"
                />
              </div>
              <div>
                <Label htmlFor="isPaid" className={"body-lg-md cursor-pointer text-neutral-950"}>
                  <div className="body-lg-md mb-2 text-neutral-950">
                    {t("adminCourseView.pricing.paidCourseHeader")}
                  </div>
                  <div
                    className={cn("body-base", {
                      "text-neutral-900": isFree,
                      "text-neutral-950": !isFree,
                    })}
                  >
                    {t("adminCourseView.pricing.paidCourseBody")}
                  </div>
                </Label>
                {isFree === false && (
                  <>
                    <div className="mb-1 mt-4">
                      <Label className="text-sm font-medium" htmlFor="priceUsd">
                        <span className="text-destructive">*</span>{" "}
                        {t("adminCourseView.pricing.field.priceUsd")}
                      </Label>
                    </div>
                    <div className="mb-2">
                      <PriceInput
                        value={form.getValues("priceInCents")}
                        onChange={(value) => setValue("priceInCents", value)}
                        currency="USD"
                        placeholder={t("adminCourseView.pricing.placeholder.amount")}
                        className={cn(
                          "[&::-moz-appearance]:textfield appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                          {
                            "border-error-600": form.formState.errors.priceInCents,
                          },
                        )}
                        id="priceUsd"
                        aria-label={t("adminCourseView.pricing.field.priceUsd")}
                      />
                      {form.formState.errors.priceInCents && (
                        <p className="text-xs text-error-600">
                          {form.formState.errors.priceInCents.message}
                        </p>
                      )}
                    </div>
                    <div className="mb-1 mt-4">
                      <Label className="text-sm font-medium" htmlFor="priceArs">
                        <span className="text-destructive">*</span>{" "}
                        {t("adminCourseView.pricing.field.priceArs")}
                      </Label>
                    </div>
                    <div className="mb-2">
                      <PriceInput
                        value={form.getValues("mercadopagoPriceInCents")}
                        onChange={(value) => setValue("mercadopagoPriceInCents", value)}
                        currency="ARS"
                        placeholder={t("adminCourseView.pricing.placeholder.amount")}
                        className={cn(
                          "[&::-moz-appearance]:textfield appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                          {
                            "border-error-600": form.formState.errors.mercadopagoPriceInCents,
                          },
                        )}
                        id="priceArs"
                        aria-label={t("adminCourseView.pricing.field.priceArs")}
                      />
                      {form.formState.errors.mercadopagoPriceInCents && (
                        <p className="text-xs text-error-600">
                          {form.formState.errors.mercadopagoPriceInCents.message}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
                      <p className="body-sm-md mb-2 text-neutral-700">
                        {t("adminCourseView.pricing.paymentMethods")}
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {stripeConfigured?.enabled ? (
                            <CheckCircle className="h-4 w-4 text-success-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-neutral-400" />
                          )}
                          <span
                            className={cn("body-sm", {
                              "text-neutral-950": stripeConfigured?.enabled,
                              "text-neutral-400": !stripeConfigured?.enabled,
                            })}
                          >
                            Stripe
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {mercadoPagoConfigured?.enabled ? (
                            <CheckCircle className="h-4 w-4 text-success-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-neutral-400" />
                          )}
                          <span
                            className={cn("body-sm", {
                              "text-neutral-950": mercadoPagoConfigured?.enabled,
                              "text-neutral-400": !mercadoPagoConfigured?.enabled,
                            })}
                          >
                            MercadoPago
                          </span>
                        </div>
                      </div>
                      {!stripeConfigured?.enabled && !mercadoPagoConfigured?.enabled && (
                        <p className="body-sm mt-2 text-warning-600">
                          {t("adminCourseView.pricing.noPaymentMethodsWarning")}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
          <Button className="w-20" type="submit">
            {t("common.button.save")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CoursePricing;
