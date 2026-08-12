import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JwtService,
  type JwtSignOptions,
} from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(
    payload: Omit<JwtPayload, 'jti'>,
  ): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
    );

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    if (!expiresIn) {
      throw new Error('JWT_EXPIRES_IN is not configured');
    }

    const options: JwtSignOptions = {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    };

    return this.jwtService.signAsync(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      options,
    );
  }

  async generateRefreshToken(
    payload: JwtPayload,
  ): Promise<string> {
    const secret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );

    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not configured',
      );
    }

    if (!expiresIn) {
      throw new Error(
        'JWT_REFRESH_EXPIRES_IN is not configured',
      );
    }

    const options: JwtSignOptions = {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    };

    return this.jwtService.signAsync(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        jti: payload.jti,
      },
      options,
    );
  }

  async verifyAccessToken(
    token: string,
  ): Promise<JwtPayload> {
    const secret = this.configService.get<string>(
      'JWT_SECRET',
    );

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return this.jwtService.verifyAsync<JwtPayload>(
      token,
      { secret },
    );
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<JwtPayload> {
    const secret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );

    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not configured',
      );
    }

    return this.jwtService.verifyAsync<JwtPayload>(
      token,
      { secret },
    );
  }

  getRefreshExpiresAt(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 30,
    );

    return expiresAt;
  }
}
