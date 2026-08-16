import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PriceType } from '@prisma/client';

export class ReviewServiceRequestDto {
  @ApiProperty({
    example: true,
    description: 'Whether to approve the service request',
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    example: 'Approved after reviewing the proposed service.',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({
    example: 'Deep Home Cleaning',
    description: 'Final service title decided by admin',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    example: 'Full apartment deep cleaning',
    description: 'Final service description decided by admin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: 599,
    description: 'Final customer-facing price in INR',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    enum: PriceType,
    example: PriceType.FIXED,
  })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional({
    example: 120,
    description: 'Final duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
