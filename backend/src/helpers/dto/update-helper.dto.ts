import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHelperDto {
  @ApiPropertyOptional({ example: 'Experienced home cleaning professional' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 500, description: 'Hourly rate in INR' })
  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isAvailable?: boolean;
}
