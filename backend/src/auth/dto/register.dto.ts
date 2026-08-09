import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'aisha@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Aisha' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.CUSTOMER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;
}
