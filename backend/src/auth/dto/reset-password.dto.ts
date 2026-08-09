import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token sent via email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewStrongPass123!' })
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password: string;
}
