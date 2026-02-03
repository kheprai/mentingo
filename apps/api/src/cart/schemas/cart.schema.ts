import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const cartItemSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  courseId: Type.String({ format: "uuid" }),
  title: Type.String(),
  description: Type.String(),
  thumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  authorName: Type.String(),
  categoryName: Type.Union([Type.String(), Type.Null()]),
  priceInCents: Type.Number(),
  mercadopagoPriceInCents: Type.Number(),
  currency: Type.String(),
  stripePriceId: Type.Union([Type.String(), Type.Null()]),
  mercadopagoProductId: Type.Union([Type.String(), Type.Null()]),
  slug: Type.Union([Type.String(), Type.Null()]),
  addedAt: Type.String(),
});

export type CartItemDto = Static<typeof cartItemSchema>;

export const cartResponseSchema = Type.Object({
  items: Type.Array(cartItemSchema),
  itemCount: Type.Number(),
});

export type CartResponse = Static<typeof cartResponseSchema>;

export const addToCartSchema = Type.Object({
  courseId: Type.String({ format: "uuid" }),
});

export type AddToCartBody = Static<typeof addToCartSchema>;

export const mergeCartSchema = Type.Object({
  courseIds: Type.Array(Type.String({ format: "uuid" })),
});

export type MergeCartBody = Static<typeof mergeCartSchema>;
