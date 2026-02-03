import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const orderItemSchema = Type.Object({
  id: Type.String(),
  courseId: Type.String(),
  courseTitle: Type.String(),
  courseThumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  priceInCents: Type.Number(),
  currency: Type.String(),
});

export const orderSchema = Type.Object({
  id: Type.String(),
  status: Type.String(),
  provider: Type.String(),
  totalAmountInCents: Type.Number(),
  currency: Type.String(),
  createdAt: Type.String(),
  items: Type.Array(orderItemSchema),
});

export type OrderDto = Static<typeof orderSchema>;

export const orderListSchema = Type.Object({
  orders: Type.Array(orderSchema),
});

export const orderDetailSchema = orderSchema;
