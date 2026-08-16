import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '@prisma/client';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'Deep Home Cleaning' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Full apartment deep clean including kitchen and bathrooms' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'cat_cleaning_id' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 599, description: 'Suggested price in INR' })
  @IsInt()
  @Min(0)
  suggestedPrice: number;

  @ApiProperty({ enum: PriceType, example: PriceType.FIXED })
  @IsEnum(PriceType)
  suggestedPriceType: PriceType;

  @ApiPropertyOptional({ example: 120, description: 'Suggested duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  suggestedDuration?: number;
}
