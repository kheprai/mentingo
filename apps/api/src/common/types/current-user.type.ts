import type { UUIDType } from "src/common";
import type { UserRole } from "src/user/schemas/userRoles";

export type CurrentUser = {
  userId: UUIDType;
  email?: string;
  phone?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};
