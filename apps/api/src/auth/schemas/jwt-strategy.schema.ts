import { type Static, Type } from "@sinclair/typebox";

import { UUIDSchema } from "src/common";

export const jwtPayloadSchema = Type.Object({
  userId: UUIDSchema,
  email: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  role: Type.Optional(Type.String()),
});

export type JwtPayload = Static<typeof jwtPayloadSchema>;
