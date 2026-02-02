import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { GetAllCategoriesResponse } from "~/api/generated-api";

const getCategoryTitle = (title: string | Record<string, string>, language: string): string => {
  if (typeof title === "string") return title;
  return title[language] || title.en || Object.values(title)[0] || "";
};

export const CategoryEntry = ({
  item,
  onSelect,
}: {
  item: GetAllCategoriesResponse["data"][number];
  onSelect: () => void;
}) => {
  const { i18n } = useTranslation();

  return (
    <Link
      to={`/admin/categories/${item.id}`}
      onClick={onSelect}
      className="group focus:outline-none focus-visible:outline-none"
    >
      <li className="flex items-center gap-3 rounded-md px-[8px] py-[6px] text-sm text-neutral-900 hover:bg-primary-50 group-focus:bg-primary-100">
        <span className="line-clamp-1 flex-1">{getCategoryTitle(item.title, i18n.language)}</span>
      </li>
    </Link>
  );
};
