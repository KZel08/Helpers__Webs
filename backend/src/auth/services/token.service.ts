import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string; // refresh token id
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const { jti: _jti, ...accessPayload } = payload;
    return this.jwtService.signAsync(
      { sub: accessPayload.sub, email: accessPayload.email, role: accessPayload.role },
      {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-secret',
        expiresIn: '900',  // 15 minutes in seconds as string for ms compatibility
      },
    );
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role, jti: payload.jti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
        expiresIn: '2592000', // 30 days in seconds
      },
    );
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
    });
  }

  getRefreshExpiresAt(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    return expires;
  }
}
