import { ConflictException } from '@nestjs/common';

export class EmailAlreadyExistsException extends ConflictException {
  constructor(email?: string) {
    super(email ? `Email already exists: ${email}` : 'Email already exists');
  }
}
