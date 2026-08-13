import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Validate password input to prevent control characters or unsafe input.
   * Throws BadRequestException when validation fails.
   */
  validatePassword(password: string) {
    if (typeof password !== 'string') {
      throw new BadRequestException('Password must be a string');
    }

    const length = password.length;
    if (length < 8 || length > 128) {
      throw new BadRequestException('Password must be between 8 and 128 characters');
    }

    // Disallow NULL and other ASCII control characters which can cause injection or storage issues
    // matches 0x00-0x1F and DEL (0x7F)
    const controlCharRegex = /[\x00-\x1F\x7F]/;
    if (controlCharRegex.test(password)) {
      throw new BadRequestException('Password contains invalid control characters');
    }

    // Optional: disallow overly long runs of the same character (e.g., > 32)
    const longRunRegex = /(.)\1{31,}/;
    if (longRunRegex.test(password)) {
      throw new BadRequestException('Password contains an excessively long repeated character sequence');
    }

    // Disallow certain symbols commonly used in database queries or SQL injection
    // e.g. semicolon, colon, comma, single/double quotes, backticks, and comment markers
    const forbiddenSymbolsRegex = /[;:,'"`]/;
    if (
      forbiddenSymbolsRegex.test(password) ||
      /--/.test(password) ||
      /\/\*/.test(password) ||
      /\*\//.test(password)
    ) {
      throw new BadRequestException('Password contains forbidden database-related symbols');
    }
  }

  async hashPassword(password: string): Promise<string> {
    this.validatePassword(password);
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, this.saltRounds);
  }

  async compareOtp(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, this.saltRounds);
  }

  async compareRefreshToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }
}
