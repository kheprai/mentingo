import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import { type Request, Response } from "express";
import { Validate } from "nestjs-typebox";

import { baseResponse, BaseResponse, nullResponse, type UUIDType } from "src/common";
import { Public } from "src/common/decorators/public.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { GoogleOAuthGuard } from "src/common/guards/google-oauth.guard";
import { MicrosoftOAuthGuard } from "src/common/guards/microsoft-oauth.guard";
import { RefreshTokenGuard } from "src/common/guards/refresh-token.guard";
import { SlackOAuthGuard } from "src/common/guards/slack-oauth.guard";
import { CurrentUser as CurrentUserType } from "src/common/types/current-user.type";
import { UserActivityEvent, UserLogoutEvent } from "src/events";
import { baseUserResponseSchema, currentUserResponseSchema } from "src/user/schemas/user.schema";
import { USER_ROLES } from "src/user/schemas/userRoles";

import { AuthService } from "./auth.service";
import { CreateAccountBody, createAccountSchema } from "./schemas/create-account.schema";
import { type SendOtpBody, sendOtpSchema } from "./schemas/send-otp.schema";
import {
  type VerifyOtpBody,
  verifyOtpResponseSchema,
  verifyOtpSchema,
} from "./schemas/verify-otp.schema";
import { TokenService } from "./token.service";

import type { Static } from "@sinclair/typebox";
import type { ProviderLoginUserType } from "src/utils/types/provider-login-user.type";

@Controller("auth")
export class AuthController {
  private CORS_ORIGIN: string;

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly eventBus: EventBus,
  ) {
    this.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
  }

  @Public()
  @Post("send-otp")
  @Validate({
    request: [{ type: "body", schema: sendOtpSchema }],
  })
  async sendOTP(
    @Body() data: SendOtpBody,
  ): Promise<BaseResponse<{ message: string; debugCode?: string }>> {
    const result = await this.authService.sendOTP(data.phone);
    return new BaseResponse(result);
  }

  @Public()
  @Post("verify-otp")
  @Validate({
    request: [{ type: "body", schema: verifyOtpSchema }],
    response: baseResponse(verifyOtpResponseSchema),
  })
  async verifyOTP(@Body() data: VerifyOtpBody, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.verifyOTP(data.phone, data.code);

    if ("accessToken" in result) {
      this.tokenService.setTokenCookies(response, result.accessToken, result.refreshToken);

      const { accessToken: _, refreshToken: __, ...responseData } = result;
      return new BaseResponse(responseData);
    }

    return new BaseResponse(result);
  }

  @Public()
  @Post("register")
  @Validate({
    request: [{ type: "body", schema: createAccountSchema }],
    response: baseResponse(baseUserResponseSchema),
  })
  async register(
    @Body() data: CreateAccountBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse<Static<typeof baseUserResponseSchema>>> {
    const result = await this.authService.registerWithOTP(data);

    this.tokenService.setTokenCookies(response, result.accessToken, result.refreshToken);

    const { accessToken: _, refreshToken: __, ...responseData } = result;
    return new BaseResponse(responseData);
  }

  @Post("logout")
  @Roles(...Object.values(USER_ROLES))
  @Validate({
    response: nullResponse(),
  })
  async logout(
    @Res({ passthrough: true }) response: Response,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<null> {
    this.tokenService.clearTokenCookies(response);

    this.eventBus.publish(new UserLogoutEvent({ userId: currentUser.userId, actor: currentUser }));
    return null;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  @Validate({
    response: nullResponse(),
  })
  async refreshTokens(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request & { refreshToken: UUIDType },
  ): Promise<null> {
    const refreshToken = request["refreshToken"];

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshTokens(refreshToken);

      this.tokenService.setTokenCookies(response, accessToken, newRefreshToken);

      return null;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  @Get("current-user")
  @Validate({
    response: baseResponse(currentUserResponseSchema),
  })
  async currentUser(
    @CurrentUser("userId") currentUserId: UUIDType,
  ): Promise<BaseResponse<Static<typeof currentUserResponseSchema>>> {
    const account = await this.authService.currentUser(currentUserId);

    this.eventBus.publish(new UserActivityEvent(currentUserId, "LOGIN"));

    return new BaseResponse(account);
  }

  @Public()
  @Get("google")
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() _request: Request): Promise<void> {
    // Initiates the Google OAuth flow
  }

  @Public()
  @Get("google/callback")
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() request: Request & { user: ProviderLoginUserType },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const googleUser = request.user;

    try {
      const { accessToken, refreshToken } =
        await this.authService.handleProviderLoginCallback(googleUser);

      this.tokenService.setTokenCookies(response, accessToken, refreshToken, true);

      response.redirect(this.CORS_ORIGIN);
    } catch (e) {
      response.redirect(
        this.CORS_ORIGIN + "/auth/login?error=" + encodeURIComponent((e as Error).message),
      );
    }
  }

  @Public()
  @Get("microsoft")
  @UseGuards(MicrosoftOAuthGuard)
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow
  }

  @Public()
  @Get("microsoft/callback")
  @UseGuards(MicrosoftOAuthGuard)
  async microsoftAuthCallback(
    @Req() request: Request & { user: ProviderLoginUserType },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const microsoftUser = request.user;

    try {
      const { accessToken, refreshToken } =
        await this.authService.handleProviderLoginCallback(microsoftUser);

      this.tokenService.setTokenCookies(response, accessToken, refreshToken, true);

      response.redirect(this.CORS_ORIGIN);
    } catch (e) {
      response.redirect(
        this.CORS_ORIGIN + "/auth/login?error=" + encodeURIComponent((e as Error).message),
      );
    }
  }

  @Public()
  @Get("slack")
  @UseGuards(SlackOAuthGuard)
  async slackAuth() {
    // Initiates the Slack OAuth flow
  }

  @Public()
  @Get("slack/callback")
  @UseGuards(SlackOAuthGuard)
  async slackAuthCallback(
    @Req() request: Request & { user: ProviderLoginUserType },
    @Res({ passthrough: true }) response: Response,
  ) {
    const slackUser = request.user;

    try {
      const { accessToken, refreshToken } =
        await this.authService.handleProviderLoginCallback(slackUser);

      this.tokenService.setTokenCookies(response, accessToken, refreshToken, true);

      response.redirect(this.CORS_ORIGIN);
    } catch (e) {
      response.redirect(
        this.CORS_ORIGIN + "/auth/login?error=" + encodeURIComponent((e as Error).message),
      );
    }
  }
}
