import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type RedisClientType } from "redis";

import type { RedisConfigSchema } from "src/common/configuration/redis";

interface OTPData {
  code: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class OTPService {
  private readonly logger = new Logger(OTPService.name);
  private redis: RedisClientType;

  private readonly OTP_TTL = 300; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_TTL = 60; // 1 minute between OTP sends

  constructor(private readonly configService: ConfigService) {
    const redisCfg = this.configService.get("redis") as RedisConfigSchema | undefined;
    if (!redisCfg) {
      throw new Error("Redis configuration is required for OTPService");
    }

    this.redis = createClient({ url: redisCfg.REDIS_URL });
    this.redis.connect().catch((err) => {
      this.logger.error(`Redis connection failed: ${err}`);
    });
  }

  async generateAndStore(phone: string): Promise<string> {
    const canSend = await this.canSend(phone);
    if (!canSend) {
      throw new BadRequestException("Please wait before requesting a new code");
    }

    const code = this.generateCode();

    const otpData: OTPData = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    };

    await this.redis.set(`otp:${phone}`, JSON.stringify(otpData), { EX: this.OTP_TTL });
    await this.redis.set(`otp_rate:${phone}`, "1", { EX: this.RATE_LIMIT_TTL });

    this.logger.log(`OTP generated for ${phone.slice(0, 6)}***`);
    return code;
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const raw = await this.redis.get(`otp:${phone}`);
    if (!raw) return false;

    const otpData: OTPData = JSON.parse(raw);

    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      await this.redis.del(`otp:${phone}`);
      throw new BadRequestException("Too many attempts. Please request a new code.");
    }

    if (otpData.code !== code) {
      otpData.attempts += 1;
      const ttl = await this.redis.ttl(`otp:${phone}`);
      await this.redis.set(`otp:${phone}`, JSON.stringify(otpData), {
        EX: ttl > 0 ? ttl : this.OTP_TTL,
      });
      return false;
    }

    // Valid code - remove from Redis
    await this.redis.del(`otp:${phone}`);
    return true;
  }

  async canSend(phone: string): Promise<boolean> {
    const rateLimited = await this.redis.get(`otp_rate:${phone}`);
    return !rateLimited;
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
