import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useMercadoPagoConfigured } from "~/api/queries/useMercadoPagoConfigured";
import { useStripeConfigured } from "~/api/queries/useStripeConfigured";
import { useUserRole } from "~/hooks/useUserRole";

export const useEditCourseTabs = () => {
  const { t } = useTranslation();
  const { data: isStripeConfigured } = useStripeConfigured();
  const { data: isMercadoPagoConfigured } = useMercadoPagoConfigured();

  const { isAdmin } = useUserRole();

  const isPaymentConfigured = isStripeConfigured?.enabled || isMercadoPagoConfigured?.enabled;

  const baseTabs = useMemo(
    () => [
      { label: t("adminCourseView.common.settings"), value: "Settings" },
      { label: t("adminCourseView.common.curriculum"), value: "Curriculum" },
      ...(isPaymentConfigured
        ? [
            {
              label: t("adminCourseView.common.pricing"),
              value: "Pricing",
            },
          ]
        : []),
      { label: t("adminCourseView.common.status"), value: "Status" },
    ],
    [isPaymentConfigured, t],
  );

  const adminTabs = useMemo(
    () => [{ label: t("adminCourseView.common.enrolledStudents"), value: "Enrolled" }],
    [t],
  );

  return isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;
};
