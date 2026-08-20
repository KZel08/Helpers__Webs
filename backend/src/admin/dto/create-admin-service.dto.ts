import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '@prisma/client';

export class CreateAdminServiceDto {
  @ApiProperty({ example: 'Deep Home Cleaning' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    example: 'Full apartment deep clean including kitchen and bathrooms',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'helper-profile-uuid' })
  @IsString()
  @IsNotEmpty()
  helperId: string;

  @ApiProperty({
    example: 799,
    description: 'Final price set by the admin in INR',
  })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ enum: PriceType, example: PriceType.FIXED })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiPropertyOptional({
    example: 120,
    description: 'Duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
