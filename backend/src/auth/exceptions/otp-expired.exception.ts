import { BadRequestException } from '@nestjs/common';

export class OtpExpiredException extends BadRequestException {
  constructor() {
    super('OTP expired');
  }
}
