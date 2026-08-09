import { UserResponseDto } from '../dto/user-response.dto';

export class UserMapper {
  static toResponse(user: Record<string, unknown>): UserResponseDto {
    return {
      id: String(user.id),
      email: String(user.email),
      firstName: String(user.firstName),
      lastName: String(user.lastName),
      role: String(user.role),
      isVerified: Boolean(user.isVerified),
    };
  }
}
