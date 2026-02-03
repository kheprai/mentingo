import { registerAs } from "@nestjs/config";
import { type Static, Type } from "@sinclair/typebox";

import { configValidator } from "src/utils/configValidator";

const schema = Type.Object({
  apiBaseUrl: Type.String(),
  apiKey: Type.String(),
  phoneNumberId: Type.String(),
});

type KapsoConfigSchema = Static<typeof schema>;

const validateKapsoConfig = configValidator(schema);

export default registerAs("kapso", (): KapsoConfigSchema => {
  const values = {
    apiBaseUrl: process.env.KAPSO_API_BASE_URL || "",
    apiKey: process.env.KAPSO_API_KEY || "",
    phoneNumberId: process.env.KAPSO_PHONE_NUMBER_ID || "",
  };
  return validateKapsoConfig(values);
});
