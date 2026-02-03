import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";

import { BunnyStreamService } from "src/bunny/bunnyStream.service";
import { GoogleOAuthGuard } from "src/common/guards/google-oauth.guard";
import { MicrosoftOAuthGuard } from "src/common/guards/microsoft-oauth.guard";
import { FileModule } from "src/file/files.module";
import { GroupModule } from "src/group/group.module";
import { LocalizationModule } from "src/localization/localization.module";
import { S3Service } from "src/s3/s3.service";
import { SettingsService } from "src/settings/settings.service";
import { StatisticsModule } from "src/statistics/statistics.module";
import { StatisticsService } from "src/statistics/statistics.service";
import { UserModule } from "src/user/user.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OTPService } from "./otp.service";
import { GoogleStrategy } from "./strategy/google.strategy";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { MicrosoftStrategy } from "./strategy/microsoft.strategy";
import { TokenService } from "./token.service";

@Module({
  imports: [
    PassportModule,
    StatisticsModule,
    UserModule,
    FileModule,
    GroupModule,
    LocalizationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    StatisticsService,
    TokenService,
    JwtStrategy,
    OTPService,
    S3Service,
    BunnyStreamService,
    GoogleStrategy,
    MicrosoftStrategy,
    GoogleOAuthGuard,
    MicrosoftOAuthGuard,
    SettingsService,
  ],
  exports: [],
})
export class AuthModule {}
