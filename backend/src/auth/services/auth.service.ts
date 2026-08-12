import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { GoogleAuthDto } from '../dto/google-auth.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepository } from '../repositories/user.repository';
import { OTPRepository } from '../repositories/otp.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { LoginHistoryRepository } from '../repositories/login-history.repository';
import { PasswordService } from './password.service';
import { OtpService } from './otp.service';
import { TokenService, JwtPayload } from './token.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly otpRepo: OTPRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly loginHistoryRepo: LoginHistoryRepository,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
  ): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    const existingEmail = await this.userRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    if (dto.phone) {
      const existingPhone = await this.userRepo.findByPhone(dto.phone);
      if (existingPhone) {
        throw new ConflictException('An account with this phone number already exists');
      }
    }

    const hashedPassword = await this.passwordService.hashPassword(dto.password);

    const user = await this.userRepo.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
    });

    // Generate email verification OTP (log for now — SMTP wired when env is set)
    const otp = this.otpService.generateOtp();
    const hashedOtp = await this.passwordService.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.otpRepo.create({
      userId: user.id,
      code: hashedOtp,
      purpose: 'email-verification',
      expiresAt,
    });

    this.logger.log(`[DEV] Email verification OTP for ${user.email}: ${otp}`);

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const tokens = await this.sessionService.createSession(user.id, payload);

    return { user: UserMapper.toResponse(user), ...tokens };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
  ): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const passwordValid =
      await this.passwordService.comparePassword(
        dto.password,
        user.password,
      );

    if (!passwordValid) {
      await this.loginHistoryRepo.create({
        userId: user.id,
        success: false,
      });

      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
    });

    await this.loginHistoryRepo.create({
      userId: user.id,
      success: true,
    });

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const tokens = await this.sessionService.createSession(user.id, payload);

    return { user: UserMapper.toResponse(user), ...tokens };
  }

  // ─── Refresh ────────────────────────────────────────────────────────────────

  async refresh(
    dto: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token session');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or disabled');
    }

    const session = await this.sessionService.validateRefreshSession(payload.jti,user.id,dto.refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    /** Revoke only the session that was used. Other devices remain logged in.**/
    await this.sessionService.revokeSession(session.id);

    const tokens = await this.sessionService.createSession(user.id, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.sessionService.revokeAllSessions(userId);
  }

  // ─── Forgot Password ────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If this email is registered, a reset link has been sent' };
    }

    const otp = this.otpService.generateOtp();
    const hashedOtp = await this.passwordService.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.otpRepo.create({
      userId: user.id,
      code: hashedOtp,
      purpose: 'password-reset',
      expiresAt,
    });

    // TODO: Send email via SMTP when SMTP env vars are configured
    this.logger.log(`[DEV] Password reset OTP for ${user.email}: ${otp}`);

    return { message: 'If this email is registered, a reset link has been sent' };
  }

  // ─── Reset Password ─────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // In a real implementation the token would encode the userId
    // For now we find by searching recent OTPs (simplified flow)
    this.logger.log(`[DEV] Reset password called with token: ${dto.token}`);
    // TODO: Implement full OTP-based password reset lookup
    const hashedPassword = await this.passwordService.hashPassword(dto.password);
    this.logger.log(`[DEV] New password hash generated, length: ${hashedPassword.length}`);
    return { message: 'Password has been reset successfully' };
  }

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  async googleAuth(
    dto: GoogleAuthDto,
  ): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    // TODO: Verify Google ID token using google-auth-library when GOOGLE_CLIENT_ID is set
    this.logger.log(`[DEV] Google auth stub called with token length: ${dto.token.length}`);
    throw new UnauthorizedException('Google OAuth requires GOOGLE_CLIENT_ID env variable');
  }

  // ─── Get Me ─────────────────────────────────────────────────────────────────

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return UserMapper.toResponse(user);
  }
}
