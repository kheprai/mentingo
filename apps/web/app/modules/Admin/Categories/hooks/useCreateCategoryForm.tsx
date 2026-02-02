import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useCreateCategory } from "~/api/mutations/admin/useCreateCategory";
import { CATEGORIES_QUERY_KEY } from "~/api/queries/useCategories";
import { queryClient } from "~/api/queryClient";

import { createCategoryFormSchema } from "../validators/createCategoryFormSchema";

import type { CreateCategoryFormValues } from "../validators/createCategoryFormSchema";
import type { CreateCategoryResponse } from "~/api/generated-api";

export const useCreateCategoryForm = (onSuccess: (response: CreateCategoryResponse) => void) => {
  const { mutateAsync: createCategory } = useCreateCategory();

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      title_en: "",
      title_es: "",
    },
  });

  const onSubmit = (values: CreateCategoryFormValues) => {
    createCategory({
      data: {
        title: {
          en: values.title_en,
          es: values.title_es,
        } as unknown as string, // Type will be correct after swagger regeneration
      },
    }).then((response) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });

      onSuccess(response);
    });
  };

  return { form, onSubmit };
};
