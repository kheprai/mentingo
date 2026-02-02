import { Type } from "@sinclair/typebox";

import type { Static } from "@sinclair/typebox";

export const processPaymentSchema = Type.Object({
  token: Type.String(),
  amount: Type.Number(),
  description: Type.String(),
  installments: Type.Optional(Type.Number({ default: 1 })),
  paymentMethodId: Type.String(),
  email: Type.String({ format: "email" }),
  courseId: Type.String({ format: "uuid" }),
  userId: Type.String({ format: "uuid" }),
  identification: Type.Optional(
    Type.Object({
      type: Type.String(),
      number: Type.String(),
    }),
  ),
});

export type ProcessPaymentBody = Static<typeof processPaymentSchema>;

export const paymentResponseSchema = Type.Object({
  id: Type.Number(),
  status: Type.String(),
  statusDetail: Type.Optional(Type.String()),
  externalReference: Type.Optional(Type.String()),
});

export type PaymentResponse = Static<typeof paymentResponseSchema>;

export const getPaymentStatusSchema = Type.Object({
  id: Type.Number(),
  status: Type.String(),
  statusDetail: Type.Optional(Type.String()),
  dateApproved: Type.Optional(Type.String()),
  dateCreated: Type.String(),
  paymentMethodId: Type.String(),
  installments: Type.Number(),
  transactionAmount: Type.Number(),
  currency: Type.String(),
});

export type GetPaymentStatusResponse = Static<typeof getPaymentStatusSchema>;
