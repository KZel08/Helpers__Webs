import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
