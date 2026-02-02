import { Type } from "@sinclair/typebox";

import type { Static } from "@sinclair/typebox";

export const webhookPayloadSchema = Type.Object({
  id: Type.Optional(Type.Union([Type.Number(), Type.String()])),
  live_mode: Type.Optional(Type.Boolean()),
  type: Type.String(),
  date_created: Type.Optional(Type.String()),
  user_id: Type.Optional(Type.Union([Type.Number(), Type.String()])),
  api_version: Type.Optional(Type.String()),
  action: Type.Optional(Type.String()),
  data: Type.Object({
    id: Type.Union([Type.String(), Type.Number()]),
  }),
});

export type WebhookPayload = Static<typeof webhookPayloadSchema>;
