import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 6);
  }

  async compareOtp(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 8);
  }
}
