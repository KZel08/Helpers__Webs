import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Aisha' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Khan' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
