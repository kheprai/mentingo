import { z } from "zod";

export const createCategoryFormSchema = z.object({
  title_en: z.string().min(2, "English title must be at least 2 characters."),
  title_es: z.string().min(2, "Spanish title must be at least 2 characters."),
});

export type CreateCategoryFormValues = z.infer<typeof createCategoryFormSchema>;
