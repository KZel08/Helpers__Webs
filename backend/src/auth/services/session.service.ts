import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { PasswordService } from './password.service';
import { TokenService, JwtPayload } from './token.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(
    userId: string,
    payload: Omit<JwtPayload, 'jti'>,
    meta?: {
      ipAddress?: string;
      userAgent?: string;
      deviceName?: string;
      deviceType?: string;
    },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken =
      await this.tokenService.generateAccessToken(payload);

    /*
     * Generate the raw refresh secret.
     *
     * This is returned to the client but NEVER stored
     * directly in PostgreSQL.
     */
    const rawRefreshSecret = randomBytes(64).toString('hex');

    const hashedToken =
      await this.passwordService.hashRefreshToken(
        rawRefreshSecret,
      );

    /*
     * Create the database session first.
     *
     * The database-generated ID becomes the JWT jti.
     */
    const session = await this.refreshTokenRepo.create({
      userId,
      hashedToken,
      expiresAt: this.tokenService.getRefreshExpiresAt(),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      deviceName: meta?.deviceName,
      deviceType: meta?.deviceType,
    });

    /*
     * jti identifies this specific device/session.
     */
    const refreshToken =
      await this.tokenService.generateRefreshToken({
        ...payload,
        jti: session.id,
      });

    return {
      accessToken,
      refreshToken,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.refreshTokenRepo.deleteById(sessionId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.refreshTokenRepo.deleteAll(userId);
  }

  async validateRefreshSession(
    sessionId: string,
    userId: string,
    rawRefreshToken: string,
  ) {
    const session =
      await this.refreshTokenRepo.findActiveById(sessionId);

    if (!session) {
      return null;
    }

    if (session.userId !== userId) {
      return null;
    }

    const valid =
      await this.passwordService.compareRefreshToken(
        rawRefreshToken,
        session.hashedToken,
      );

    if (!valid) {
      return null;
    }

    return session;
  }
}
