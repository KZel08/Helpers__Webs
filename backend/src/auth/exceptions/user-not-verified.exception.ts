import { ForbiddenException } from '@nestjs/common';

export class UserNotVerifiedException extends ForbiddenException {
  constructor() {
    super('User is not verified');
  }
}
