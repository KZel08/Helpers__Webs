import { ConflictException } from '@nestjs/common';

export class PhoneAlreadyExistsException extends ConflictException {
  constructor(phone?: string) {
    super(phone ? `Phone already exists: ${phone}` : 'Phone already exists');
  }
}
