import { type Static, Type } from "@sinclair/typebox";

import { baseUserResponseSchema, userOnboardingStatusSchema } from "src/user/schemas/user.schema";

export const verifyOtpSchema = Type.Object({
  phone: Type.String({ pattern: "^\\+[1-9]\\d{6,14}$" }),
  code: Type.String({ minLength: 6, maxLength: 6 }),
});

export type VerifyOtpBody = Static<typeof verifyOtpSchema>;

export const verifyOtpResponseSchema = Type.Union([
  Type.Object({
    ...baseUserResponseSchema.properties,
    isNewUser: Type.Literal(false),
    onboardingStatus: userOnboardingStatusSchema,
  }),
  Type.Object({
    verified: Type.Literal(true),
    isNewUser: Type.Literal(true),
    otpToken: Type.String(),
  }),
]);
