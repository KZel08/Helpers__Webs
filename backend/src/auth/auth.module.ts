import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { OtpService } from './services/otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserRepository } from './repositories/user.repository';
import { OTPRepository } from './repositories/otp.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { LoginHistoryRepository } from './repositories/login-history.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    OtpService,
    JwtStrategy,
    UserRepository,
    OTPRepository,
    RefreshTokenRepository,
    LoginHistoryRepository,
  ],
  exports: [AuthService, TokenService, JwtStrategy, PassportModule],
})
export class AuthModule {}
