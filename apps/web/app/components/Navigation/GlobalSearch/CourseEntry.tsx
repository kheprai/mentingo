import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { useUserRole } from "../../../hooks/useUserRole";

import type { GetAllCoursesResponse } from "~/api/generated-api";

const getCategoryTitle = (category: string | Record<string, string> | null | undefined): string => {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category?.en || Object.values(category)[0] || "";
};

export const CourseEntry = ({
  item,
  onSelect,
}: {
  item: GetAllCoursesResponse["data"][number];
  onSelect: () => void;
}) => {
  const { isStudent } = useUserRole();
  const { i18n: _i18n } = useTranslation();

  return (
    <Link
      to={isStudent ? `/course/${item.id}` : `/admin/beta-courses/${item.id}`}
      onClick={onSelect}
      className="group focus:outline-none focus-visible:outline-none"
    >
      <li className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-neutral-900 hover:bg-primary-50 group-focus:bg-primary-100">
        <img
          src={item?.thumbnailUrl ?? ""}
          alt={item.title}
          className="size-4 rounded-sm bg-[#D9D9D9]"
        />
        <span className="line-clamp-1 flex-1 body-sm-md">{item.title}</span>
        <span className="details-md ps-3 text-neutral-600">{getCategoryTitle(item.category)}</span>
      </li>
    </Link>
  );
};
