import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const stripeCheckoutSchema = Type.Object({
  locale: Type.Optional(Type.String()),
});

export type StripeCheckoutBody = Static<typeof stripeCheckoutSchema>;

export const stripeCheckoutResponseSchema = Type.Object({
  clientSecret: Type.String(),
  orderId: Type.String(),
});

export const mercadopagoCheckoutSchema = Type.Object({
  token: Type.String(),
  paymentMethodId: Type.String(),
  email: Type.String({ format: "email" }),
  installments: Type.Optional(Type.Number({ default: 1 })),
  identification: Type.Optional(
    Type.Object({
      type: Type.String(),
      number: Type.String(),
    }),
  ),
});

export type MercadopagoCheckoutBody = Static<typeof mercadopagoCheckoutSchema>;

export const mercadopagoCheckoutResponseSchema = Type.Object({
  orderId: Type.String(),
  paymentId: Type.Number(),
  status: Type.String(),
  statusDetail: Type.Optional(Type.String()),
});

export const freeCheckoutSchema = Type.Object({
  courseIds: Type.Optional(Type.Array(Type.String())),
});

export type FreeCheckoutBody = Static<typeof freeCheckoutSchema>;

export const freeCheckoutResponseSchema = Type.Object({
  orderId: Type.String(),
  enrolledCourseIds: Type.Array(Type.String()),
});
