import { Type } from "@sinclair/typebox";

import type { Static } from "@sinclair/typebox";

export const getOrCreateCustomerSchema = Type.Object({
  customerId: Type.String(),
});

export type GetOrCreateCustomerResponse = Static<typeof getOrCreateCustomerSchema>;

export const customerCardSchema = Type.Object({
  id: Type.Optional(Type.String()),
  firstSixDigits: Type.Optional(Type.String()),
  lastFourDigits: Type.Optional(Type.String()),
  expirationMonth: Type.Optional(Type.Number()),
  expirationYear: Type.Optional(Type.Number()),
  paymentMethod: Type.Optional(
    Type.Object({
      id: Type.Optional(Type.String()),
      name: Type.Optional(Type.String()),
      paymentTypeId: Type.Optional(Type.String()),
      thumbnail: Type.Optional(Type.String()),
      secureThumbnail: Type.Optional(Type.String()),
    }),
  ),
  issuer: Type.Optional(
    Type.Object({
      id: Type.Optional(Type.Number()),
      name: Type.Optional(Type.String()),
    }),
  ),
  cardholder: Type.Optional(
    Type.Object({
      name: Type.Optional(Type.String()),
    }),
  ),
});

export const customerCardsResponseSchema = Type.Array(customerCardSchema);

export type CustomerCardDto = Static<typeof customerCardSchema>;
