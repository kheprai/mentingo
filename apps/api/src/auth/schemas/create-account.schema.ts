import { type Static, Type } from "@sinclair/typebox";

export const createAccountSchema = Type.Object({
  phone: Type.String({ pattern: "^\\+[1-9]\\d{6,14}$" }),
  firstName: Type.String({ minLength: 1, maxLength: 64 }),
  lastName: Type.String({ minLength: 1, maxLength: 64 }),
  otpToken: Type.String(),
});

export type CreateAccountBody = Static<typeof createAccountSchema>;
