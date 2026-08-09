import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  generateOtp(length = 6): string {
    const digits = '0123456789';
    let otp = '';

    for (let index = 0; index < length; index += 1) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }

    return otp;
  }
}
