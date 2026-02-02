import { Link } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useEnrollCourse } from "~/api/mutations";
import { courseQueryOptions, useCurrentUser } from "~/api/queries";
import { queryClient } from "~/api/queryClient";
import { Enroll } from "~/assets/svgs";
import { CopyUrlButton } from "~/components/CopyUrlButton/CopyUrlButton";
import { CoursePriceDisplay } from "~/components/CoursePriceDisplay/CoursePriceDisplay";
import { Icon } from "~/components/Icon";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/formatters/priceFormatter";
import { MercadoPagoCheckout } from "~/modules/mercadopago";
import { PaymentModal } from "~/modules/stripe/PaymentModal";
import { getCurrencyLocale } from "~/utils/getCurrencyLocale";

import type { GetCourseResponse } from "~/api/generated-api";

type CourseOptionsProps = {
  course: GetCourseResponse["data"];
};

export const CourseOptions = ({ course }: CourseOptionsProps) => {
  const { mutateAsync: enrollCourse } = useEnrollCourse();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "mercadopago" | null>(null);

  const hasStripe = !!course.stripePriceId;
  const hasMercadoPago = !!course.mercadopagoProductId && (course.mercadopagoPriceInCents ?? 0) > 0;
  const isPaid = hasStripe || hasMercadoPago;

  const handleEnrollCourse = async () => {
    await enrollCourse({ id: course?.id }).then(() => {
      queryClient.invalidateQueries(courseQueryOptions(course?.id));
    });
  };

  const renderEnrollButton = () => {
    if (!currentUser) {
      return (
        <Link to="/auth/register">
          <Button className="w-full gap-x-2" variant="primary">
            <Enroll />
            <span>{t("studentCourseView.sideSection.button.enrollCourse")}</span>
          </Button>
        </Link>
      );
    }

    return (
      <Button onClick={handleEnrollCourse} className="gap-x-2" variant="primary">
        <Enroll />
        <span>{t("studentCourseView.sideSection.button.enrollCourse")}</span>
      </Button>
    );
  };

  const renderPaymentMethodSelector = () => {
    return (
      <div className="flex flex-col gap-y-3">
        <p className="body-sm-md text-neutral-700">
          {t("studentCourseView.paymentMethodSelection.title")}
        </p>
        <div className="flex flex-col gap-y-2">
          {hasStripe && (
            <Button
              variant={selectedMethod === "stripe" ? "primary" : "outline"}
              className="w-full justify-start gap-x-2"
              onClick={() => setSelectedMethod("stripe")}
            >
              <span>
                {t("studentCourseView.paymentMethodSelection.stripe")} -{" "}
                {formatPrice(course.priceInCents, "USD", getCurrencyLocale("USD"))}
              </span>
            </Button>
          )}
          {hasMercadoPago && (
            <Button
              variant={selectedMethod === "mercadopago" ? "primary" : "outline"}
              className="w-full justify-start gap-x-2"
              onClick={() => setSelectedMethod("mercadopago")}
            >
              <span>
                {t("studentCourseView.paymentMethodSelection.mercadopago")} -{" "}
                {formatPrice(course.mercadopagoPriceInCents ?? 0, "ARS", getCurrencyLocale("ARS"))}
              </span>
            </Button>
          )}
        </div>
        {selectedMethod === "stripe" && course.stripePriceId && (
          <PaymentModal
            courseCurrency="usd"
            coursePrice={course.priceInCents}
            courseTitle={course.title}
            courseDescription={course.description}
            courseId={course.id}
            coursePriceId={course.stripePriceId}
          />
        )}
        {selectedMethod === "mercadopago" && (
          <MercadoPagoCheckout
            courseCurrency="ars"
            coursePrice={course.mercadopagoPriceInCents ?? 0}
            courseTitle={course.title}
            courseDescription={course.description}
            courseId={course.id}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <h4 className="h6 pb-1 text-neutral-950">
        {t("studentCourseView.sideSection.optionHeader")}
      </h4>
      <div className="flex flex-col gap-y-2">
        <CopyUrlButton variant="outline" className="gap-x-2">
          <Icon name="Share" className="h-auto w-6 text-primary-800" />
          <span>{t("studentCourseView.sideSection.button.shareCourse")}</span>
        </CopyUrlButton>
        {isPaid && (
          <div className="py-2">
            <CoursePriceDisplay
              priceInCents={course.priceInCents}
              mercadopagoPriceInCents={course.mercadopagoPriceInCents}
              stripePriceId={course.stripePriceId}
              mercadopagoProductId={course.mercadopagoProductId}
              variant="detail"
            />
          </div>
        )}
        {isPaid ? renderPaymentMethodSelector() : renderEnrollButton()}
      </div>
    </>
  );
};
