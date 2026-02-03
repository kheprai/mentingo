import { type Static, Type } from "@sinclair/typebox";

export const sendOtpSchema = Type.Object({
  phone: Type.String({ pattern: "^\\+[1-9]\\d{6,14}$" }),
});

export type SendOtpBody = Static<typeof sendOtpSchema>;
