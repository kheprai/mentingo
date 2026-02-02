import { Type } from "@sinclair/typebox";

import { UUIDSchema } from "src/common";

import type { CategoryInsert } from "./createCategorySchema";

export const categoryUpdateSchema = Type.Partial(
  Type.Object({
    id: UUIDSchema,
    title: Type.Record(Type.String(), Type.String()),
    archived: Type.Boolean(),
  }),
);

export type CategoryUpdateBody = Partial<Pick<CategoryInsert, "title" | "archived">>;
