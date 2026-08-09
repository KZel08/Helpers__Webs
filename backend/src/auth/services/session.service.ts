import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { PasswordService } from './password.service';
import { TokenService, JwtPayload } from './token.service';
import * as crypto from 'crypto';


@Injectable()
export class SessionService {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(
    userId: string,
    payload: JwtPayload,
    meta?: { ipAddress?: string; userAgent?: string; deviceName?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const rawRefreshToken = crypto.randomUUID();
    const hashedToken = await this.passwordService.hashRefreshToken(rawRefreshToken);

    await this.refreshTokenRepo.create({
      userId,
      hashedToken,
      expiresAt: this.tokenService.getRefreshExpiresAt(),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      deviceName: meta?.deviceName,
    });

    const refreshToken = await this.tokenService.generateRefreshToken({ ...payload, jti: rawRefreshToken });

    return { accessToken, refreshToken };
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.refreshTokenRepo.deleteAll(userId);
  }

  async rotateSession(
    userId: string,
    payload: JwtPayload,
    oldTokenId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Revoke old session tokens
    await this.refreshTokenRepo.deleteAll(userId);
    return this.createSession(userId, payload);
  }
}
