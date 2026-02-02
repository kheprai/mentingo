import { useParams } from "@remix-run/react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useUpdateCategory } from "~/api/mutations/admin/useUpdateCategory";
import { categoryByIdQueryOptions, useCategoryById } from "~/api/queries/admin/useCategoryById";
import { queryClient } from "~/api/queryClient";
import { PageWrapper } from "~/components/PageWrapper";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Loader from "~/modules/common/Loader/Loader";
import { setPageTitle } from "~/utils/setPageTitle";

import type { MetaFunction } from "@remix-run/react";

type CategoryFormValues = {
  title_en: string;
  title_es: string;
  archived: boolean;
};

export const meta: MetaFunction = ({ matches }) => setPageTitle(matches, "pages.categoryDetails");

const Category = () => {
  const { id = "" } = useParams();
  const { t } = useTranslation();

  if (!id) throw new Error(t("adminCategoryView.error.categoryIdNotFound"));

  const { data: category, isLoading } = useCategoryById(id);
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      title_en: "",
      title_es: "",
      archived: false,
    },
  });

  // Reset form values when category data loads
  useEffect(() => {
    if (category) {
      const title = category.title as string | Record<string, string>;
      if (typeof title === "string") {
        reset({ title_en: title, title_es: "", archived: category.archived ?? false });
      } else {
        reset({
          title_en: title?.en ?? "",
          title_es: title?.es ?? "",
          archived: category.archived ?? false,
        });
      }
    }
  }, [category, reset]);

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );

  if (!category) throw new Error(t("adminCategoryView.error.categoryNotFound"));

  const onSubmit = (data: CategoryFormValues) => {
    updateCategory({
      data: {
        title: {
          en: data.title_en,
          es: data.title_es,
        } as unknown as string, // Type will be correct after swagger regeneration
        archived: data.archived,
      },
      categoryId: id,
    }).then(() => {
      queryClient.invalidateQueries(categoryByIdQueryOptions(id));
    });
  };

  const breadcrumbs = [
    { title: t("adminCategoryView.breadcrumbs.categories"), href: "/admin/categories" },
    { title: t("adminCategoryView.breadcrumbs.categoryDetails"), href: `/admin/categories/${id}` },
  ];

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-950">
              {t("adminCategoryView.editCategoryHeader")}
            </h2>
            <Button type="submit" disabled={!isDirty} className="mr-2">
              {t("common.button.save")}
            </Button>
          </div>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2">
                <Label className="font-normal text-neutral-600">
                  {t("adminCategoryView.field.titleEn", "Title (English)")}
                </Label>
                <Controller
                  name="title_en"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label className="font-normal text-neutral-600">
                  {t("adminCategoryView.field.titleEs", "Title (Spanish)")}
                </Label>
                <Controller
                  name="title_es"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1"
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label className="font-normal text-neutral-600">
                {t("adminCategoryView.field.status")}
              </Label>
              <Controller
                name="archived"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="archived"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                    <label
                      htmlFor="archived"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("common.other.archived")}
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default Category;
