import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventBus } from "@nestjs/cqrs";
import { JwtService } from "@nestjs/jwt";
import { and, eq, isNull } from "drizzle-orm";

import { DatabasePg, type UUIDType } from "src/common";
import { UserLoginEvent } from "src/events/user/user-login.event";
import { UserRegisteredEvent } from "src/events/user/user-registered.event";
import { SettingsService } from "src/settings/settings.service";
import { USER_ROLES, type UserRole } from "src/user/schemas/userRoles";
import { WhatsAppService } from "src/whatsapp/whatsapp.service";

import { userOnboarding, users } from "../storage/schema";
import { UserService } from "../user/user.service";

import { OTPService } from "./otp.service";
import { TokenService } from "./token.service";

import type { CreateAccountBody } from "./schemas/create-account.schema";
import type { Response } from "express";
import type { CommonUser } from "src/common/schemas/common-user.schema";
import type { CurrentUser } from "src/common/types/current-user.type";
import type { UserResponse } from "src/user/schemas/user.schema";
import type { ProviderLoginUserType } from "src/utils/types/provider-login-user.type";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private settingsService: SettingsService,
    private eventBus: EventBus,
    private tokenService: TokenService,
    private otpService: OTPService,
    private whatsAppService: WhatsAppService,
  ) {}

  public async sendOTP(phone: string) {
    const code = await this.otpService.generateAndStore(phone);

    if (process.env.PHONE_DEBUG === "true") {
      return { message: "OTP sent (debug)", debugCode: code };
    }

    await this.whatsAppService.sendOTP(phone, code);
    return { message: "OTP sent" };
  }

  public async verifyOTP(phone: string, code: string) {
    const isValid = await this.otpService.verify(phone, code);
    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired code");
    }

    // Check if user exists
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.phone, phone), isNull(users.deletedAt)));

    if (existingUser) {
      if (existingUser.archived) {
        throw new UnauthorizedException("Your account has been archived");
      }

      const { accessToken, refreshToken } = await this.getTokens(existingUser);

      const { avatarReference, ...userWithoutAvatar } = existingUser;
      const usersProfilePictureUrl =
        await this.userService.getUsersProfilePictureUrl(avatarReference);

      const onboardingStatus = await this.userService.getAllOnboardingStatus(existingUser.id);

      const actor: CurrentUser = {
        userId: existingUser.id,
        phone: existingUser.phone ?? undefined,
        role: existingUser.role as UserRole,
      };
      this.eventBus.publish(new UserLoginEvent({ userId: existingUser.id, method: "otp", actor }));

      return {
        ...userWithoutAvatar,
        profilePictureUrl: usersProfilePictureUrl,
        accessToken,
        refreshToken,
        isNewUser: false as const,
        onboardingStatus,
      };
    }

    // User doesn't exist - issue temporary OTP token for registration
    const otpToken = await this.jwtService.signAsync(
      { phone, purpose: "otp_registration" },
      {
        expiresIn: "5m",
        secret: this.configService.get<string>("jwt.secret"),
      },
    );

    return {
      verified: true as const,
      isNewUser: true as const,
      otpToken,
    };
  }

  public async registerWithOTP(data: CreateAccountBody) {
    // Validate otpToken
    let tokenPayload: { phone: string; purpose: string };
    try {
      tokenPayload = await this.jwtService.verifyAsync(data.otpToken, {
        secret: this.configService.get<string>("jwt.secret"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired registration token");
    }

    if (tokenPayload.purpose !== "otp_registration" || tokenPayload.phone !== data.phone) {
      throw new UnauthorizedException("Invalid registration token");
    }

    // Check user doesn't already exist
    const [existingUser] = await this.db.select().from(users).where(eq(users.phone, data.phone));

    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const createdUser = await this.db.transaction(async (trx) => {
      const [newUser] = await trx
        .insert(users)
        .values({
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
        })
        .returning();

      await trx.insert(userOnboarding).values({ userId: newUser.id });

      await this.settingsService.createSettingsIfNotExists(
        newUser.id,
        newUser.role as UserRole,
        { language: "es" },
        trx,
      );

      const { avatarReference, ...userWithoutAvatar } = newUser;
      const usersProfilePictureUrl =
        await this.userService.getUsersProfilePictureUrl(avatarReference);

      this.eventBus.publish(new UserRegisteredEvent(newUser));

      return { ...userWithoutAvatar, profilePictureUrl: usersProfilePictureUrl };
    });

    if (!createdUser) {
      throw new BadRequestException("Failed to create user");
    }

    const { accessToken, refreshToken } = await this.getTokens(createdUser);

    const onboardingStatus = await this.userService.getAllOnboardingStatus(createdUser.id);

    return {
      ...createdUser,
      accessToken,
      refreshToken,
      isNewUser: false as const,
      onboardingStatus,
    };
  }

  public async currentUser(id: UUIDType) {
    const user = await this.userService.getUserById(id);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const onboardingStatus = await this.userService.getAllOnboardingStatus(user.id);

    return { ...user, onboardingStatus };
  }

  public async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        ignoreExpiration: false,
      });

      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const tokens = await this.getTokens(user);
      const actor: CurrentUser = {
        userId: user.id,
        phone: user.phone ?? undefined,
        role: user.role as UserRole,
      };

      this.eventBus.publish(
        new UserLoginEvent({ userId: user.id, method: "refresh_token", actor }),
      );

      return tokens;
    } catch (error) {
      throw new ForbiddenException("Invalid refresh token");
    }
  }

  private async getTokens(
    user:
      | CommonUser
      | UserResponse
      | { id: string; phone?: string | null; email?: string | null; role: string },
  ) {
    const { id: userId, role } = user;
    const phone = "phone" in user ? user.phone : undefined;
    const email = "email" in user ? user.email : undefined;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { userId, phone, email, role },
        {
          expiresIn: this.configService.get<string>("jwt.expirationTime"),
          secret: this.configService.get<string>("jwt.secret"),
        },
      ),
      this.jwtService.signAsync(
        { userId, phone, email, role },
        {
          expiresIn: "7d",
          secret: this.configService.get<string>("jwt.refreshSecret"),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  public async handleProviderLoginCallback(userCallback: ProviderLoginUserType) {
    if (!userCallback) {
      throw new UnauthorizedException("User data is missing");
    }

    const { inviteOnlyRegistration } = await this.settingsService.getGlobalSettings();
    let [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, userCallback.email), isNull(users.deletedAt)));

    if (user?.archived) {
      throw new UnauthorizedException("Your account has been archived");
    }

    if (!user && inviteOnlyRegistration) {
      throw new UnauthorizedException("Registration is invite-only.");
    }

    if (!user && !inviteOnlyRegistration) {
      user = await this.userService.createUser({
        email: userCallback.email,
        firstName: userCallback.firstName,
        lastName: userCallback.lastName,
        role: USER_ROLES.STUDENT,
      });
    }

    const tokens = await this.getTokens(user);

    const actor: CurrentUser = {
      userId: user.id,
      email: user.email ?? undefined,
      role: user.role as UserRole,
    };
    this.eventBus.publish(new UserLoginEvent({ userId: user.id, method: "provider", actor }));

    return tokens;
  }
}
