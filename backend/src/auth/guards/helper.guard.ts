import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../services/token.service';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class HelperGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== 'HELPER') {
      throw new ForbiddenException('Helper access required');
    }

    return true;
  }
}
