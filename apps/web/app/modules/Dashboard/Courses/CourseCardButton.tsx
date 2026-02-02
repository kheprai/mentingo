import { useTranslation } from "react-i18next";

import { Icon } from "~/components/Icon";
import { Button } from "~/components/ui/button";

type CourseCardButtonProps = {
  enrolled: boolean;
  isAdmin: boolean;
  priceInCents: number;
  isScormCreatePage?: boolean;
};

const CourseCardButton = ({
  enrolled,
  isAdmin,
  priceInCents,
  isScormCreatePage,
}: CourseCardButtonProps) => {
  const { t } = useTranslation();
  const getButtonLabel = (enrolled: boolean, isAdmin: boolean) => {
    if (enrolled) {
      return (
        <span className="flex items-center gap-x-2">
          <Icon name="ArrowRight" className="size-4 text-white" />{" "}
          {t("studentCoursesView.button.continue")}
        </span>
      );
    }

    if (isScormCreatePage) return t("studentCoursesView.button.readMore");

    if (isAdmin) return t("studentCoursesView.button.view");

    if (priceInCents) return t("studentCoursesView.button.enroll");

    return t("studentCoursesView.button.enroll");
  };

  const buttonLabel = getButtonLabel(enrolled, isAdmin);

  return (
    <Button variant={enrolled ? "secondary" : "primary"} className="mt-auto w-full">
      {buttonLabel}
    </Button>
  );
};

export default CourseCardButton;
