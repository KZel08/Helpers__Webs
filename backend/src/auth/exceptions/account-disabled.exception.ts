import { ForbiddenException } from '@nestjs/common';

export class AccountDisabledException extends ForbiddenException {
  constructor() {
    super('Account is disabled');
  }
}
