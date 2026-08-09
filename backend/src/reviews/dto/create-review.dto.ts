import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'booking_id' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 4.5, description: 'Rating from 1 to 5' })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent work, very professional!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
